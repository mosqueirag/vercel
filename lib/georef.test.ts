import { describe, expect, it } from "vitest";
import { geocodeSarmientoAddress } from "./georef";

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("official Argentina geocoder adapter", () => {
  it("accepts a valid Sarmiento response", async () => {
    const point = await geocodeSarmientoAddress("Calle de prueba", 100, async () => response({ direcciones: [{ localidad_censal: { nombre: "Sarmiento" }, ubicacion: { lon: -69.1, lat: -45.6 } }] }));
    expect(point).toEqual({ longitude: -69.1, latitude: -45.6 });
  });
  it("rejects a response outside Sarmiento", async () => {
    const point = await geocodeSarmientoAddress("Calle de prueba", 100, async () => response({ direcciones: [{ localidad: { nombre: "Otra ciudad" }, ubicacion: { lon: -69.1, lat: -45.6 } }] }));
    expect(point).toBeNull();
  });
  it("falls back safely when the public service errors or times out", async () => {
    expect(await geocodeSarmientoAddress("Calle de prueba", 100, async () => { throw new Error("timeout"); })).toBeNull();
  });
});
