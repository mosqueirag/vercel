import { describe, expect, it } from "vitest";
import { geocodeSarmientoAddress, geocodeSarmientoAddressWithSource } from "./georef";

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const georefPoint = { direcciones: [{ localidad_censal: { nombre: "Sarmiento" }, ubicacion: { lon: -69.1, lat: -45.6 } }] };
const noGeorefPoint = { direcciones: [{ localidad_censal: { nombre: "Sarmiento" }, ubicacion: { lon: null, lat: null } }] };
const geoapifyPoint = { results: [{ country_code: "ar", state: "Chubut", city: "Sarmiento", formatted: "España 450, Sarmiento, Chubut, Argentina", lat: -45.59, lon: -69.08, rank: { confidence: 0.9 } }] };

describe("official Argentina geocoder adapter", () => {
  it("accepts a valid Sarmiento Georef response without calling Geoapify", async () => {
    let calls = 0;
    const point = await geocodeSarmientoAddressWithSource("Calle de prueba", 100, async () => { calls += 1; return response(georefPoint); }, "test-key");
    expect(point).toEqual({ longitude: -69.1, latitude: -45.6, source: "georef" });
    expect(calls).toBe(1);
  });

  it("uses Geoapify only after Georef has no valid coordinates", async () => {
    let calls = 0;
    const point = await geocodeSarmientoAddressWithSource("España", 450, async () => response(calls++ === 0 ? noGeorefPoint : geoapifyPoint), "test-key");
    expect(point).toEqual({ longitude: -69.08, latitude: -45.59, source: "geoapify" });
    expect(calls).toBe(2);
  });

  it("rejects Geoapify results from Comodoro Rivadavia", async () => {
    let calls = 0;
    const result = await geocodeSarmientoAddressWithSource("España", 450, async () => response(calls++ === 0 ? noGeorefPoint : { results: [{ ...geoapifyPoint.results[0], city: "Comodoro Rivadavia", formatted: "España 450, Comodoro Rivadavia, Chubut" }] }), "test-key");
    expect(result).toBeNull();
  });

  it("rejects Geoapify results from another province", async () => {
    let calls = 0;
    const result = await geocodeSarmientoAddressWithSource("España", 450, async () => response(calls++ === 0 ? noGeorefPoint : { results: [{ ...geoapifyPoint.results[0], state: "Santa Cruz" }] }), "test-key");
    expect(result).toBeNull();
  });

  it("continues safely when Geoapify has zero results", async () => {
    let calls = 0;
    expect(await geocodeSarmientoAddressWithSource("España", 450, async () => response(calls++ === 0 ? noGeorefPoint : { results: [] }), "test-key")).toBeNull();
  });

  it("continues safely when Geoapify times out", async () => {
    let calls = 0;
    expect(await geocodeSarmientoAddressWithSource("España", 450, async () => { if (calls++ === 0) return response(noGeorefPoint); throw new Error("timeout"); }, "test-key")).toBeNull();
  });

  it("does not fail or call Geoapify when the API key is absent", async () => {
    let calls = 0;
    expect(await geocodeSarmientoAddressWithSource("España", 450, async () => { calls += 1; return response(noGeorefPoint); }, undefined)).toBeNull();
    expect(calls).toBe(1);
  });

  it("rejects a response outside Sarmiento", async () => {
    const point = await geocodeSarmientoAddress("Calle de prueba", 100, async () => response({ direcciones: [{ localidad: { nombre: "Otra ciudad" }, ubicacion: { lon: -69.1, lat: -45.6 } }] }));
    expect(point).toBeNull();
  });
});
