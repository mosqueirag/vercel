export type GeocodedPoint = { longitude: number; latitude: number };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();

function numberAt(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

export async function geocodeSarmientoAddress(street: string, number: number, fetcher: FetchLike = fetch): Promise<GeocodedPoint | null> {
  const query = new URLSearchParams({ direccion: `${street} ${number}`, localidad: "Sarmiento", provincia: "Chubut", max: "1" });
  try {
    const response = await fetcher(`https://apis.datos.gob.ar/georef/api/direcciones?${query.toString()}`, { signal: AbortSignal.timeout(3500), headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const payload = await response.json() as { direcciones?: Array<{ ubicacion?: { lat?: unknown; lon?: unknown }; localidad_censal?: { nombre?: string }; localidad?: { nombre?: string } }> };
    const match = payload.direcciones?.[0];
    const locality = match?.localidad_censal?.nombre ?? match?.localidad?.nombre;
    const longitude = numberAt(match?.ubicacion?.lon);
    const latitude = numberAt(match?.ubicacion?.lat);
    if (!locality || normalize(locality) !== "SARMIENTO" || longitude === null || latitude === null || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
    return { longitude, latitude };
  } catch {
    return null;
  }
}
