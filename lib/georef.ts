export type GeocodedPoint = { longitude: number; latitude: number };
export type GeocoderSource = "georef" | "geoapify";
export type GeocodingResult = GeocodedPoint & { source: GeocoderSource };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();

function numberAt(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

function validPoint(longitude: unknown, latitude: unknown): GeocodedPoint | null {
  const parsedLongitude = numberAt(longitude);
  const parsedLatitude = numberAt(latitude);
  if (parsedLongitude === null || parsedLatitude === null || parsedLongitude < -180 || parsedLongitude > 180 || parsedLatitude < -90 || parsedLatitude > 90) return null;
  return { longitude: parsedLongitude, latitude: parsedLatitude };
}

async function geocodeWithGeoref(street: string, number: number, fetcher: FetchLike): Promise<GeocodedPoint | null> {
  const query = new URLSearchParams({ direccion: `${street} ${number}`, localidad: "Sarmiento", provincia: "Chubut", max: "1" });
  try {
    const response = await fetcher(`https://apis.datos.gob.ar/georef/api/direcciones?${query.toString()}`, { signal: AbortSignal.timeout(3500), headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json() as { direcciones?: Array<{ ubicacion?: { lat?: unknown; lon?: unknown }; localidad_censal?: { nombre?: string }; localidad?: { nombre?: string } }> };
    const match = payload.direcciones?.[0];
    const locality = match?.localidad_censal?.nombre ?? match?.localidad?.nombre;
    if (!locality || normalize(locality) !== "SARMIENTO") return null;
    return validPoint(match?.ubicacion?.lon, match?.ubicacion?.lat);
  } catch {
    return null;
  }
}

type GeoapifyResult = { lat?: unknown; lon?: unknown; country_code?: unknown; state?: unknown; city?: unknown; county?: unknown; formatted?: unknown; rank?: { confidence?: unknown } };

function isSarmientoChubutArgentina(result: GeoapifyResult) {
  if (normalize(String(result.country_code ?? "")) !== "AR" || normalize(String(result.state ?? "")) !== "CHUBUT") return false;
  const localityEvidence = [result.city, result.county, result.formatted].map((value) => normalize(String(value ?? ""))).join(" ");
  return localityEvidence.includes("SARMIENTO") && !localityEvidence.includes("COMODORO RIVADAVIA");
}

async function geocodeWithGeoapify(street: string, number: number, apiKey: string | undefined, fetcher: FetchLike): Promise<GeocodedPoint | null> {
  if (!apiKey) return null;
  const query = new URLSearchParams({ housenumber: String(number), street, city: "Sarmiento", state: "Chubut", country: "Argentina", format: "json", limit: "3", lang: "es", filter: "countrycode:ar", apiKey });
  try {
    const response = await fetcher(`https://api.geoapify.com/v1/geocode/search?${query.toString()}`, { signal: AbortSignal.timeout(3500), headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json() as { results?: GeoapifyResult[] };
    for (const result of payload.results ?? []) {
      const confidence = numberAt(result.rank?.confidence);
      const point = validPoint(result.lon, result.lat);
      if (point && isSarmientoChubutArgentina(result) && (confidence === null || confidence >= 0.5)) return point;
    }
    return null;
  } catch {
    return null;
  }
}

export async function geocodeSarmientoAddressWithSource(street: string, number: number, fetcher: FetchLike = fetch, geoapifyApiKey = process.env.GEOAPIFY_GEOCODING_API_KEY): Promise<GeocodingResult | null> {
  const georef = await geocodeWithGeoref(street, number, fetcher);
  if (georef) return { ...georef, source: "georef" };
  const geoapify = await geocodeWithGeoapify(street, number, geoapifyApiKey, fetcher);
  return geoapify ? { ...geoapify, source: "geoapify" } : null;
}

export async function geocodeSarmientoAddress(street: string, number: number, fetcher: FetchLike = fetch): Promise<GeocodedPoint | null> {
  const result = await geocodeSarmientoAddressWithSource(street, number, fetcher);
  return result ? { longitude: result.longitude, latitude: result.latitude } : null;
}
