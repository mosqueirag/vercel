import { NextRequest } from "next/server";
import { getPublishedNews } from "../../../lib/news";

const pages = [
  ["Asistente COOPIA", "Consultas, orientación y atención inteligente", "/#asistente", "Atención"],
  ["Energía eléctrica", "Servicio eléctrico, guardia y recomendaciones", "/energia", "Servicios"],
  ["Simulador de consumo", "Calculá el consumo eléctrico estimado de tu hogar", "/simulador-energia", "Herramientas"],
  ["Internet", "Planes, contratación y consulta por domicilio", "/internet", "Servicios"],
  ["Fibra óptica", "Información y disponibilidad de fibra óptica", "/fibra-optica", "Servicios"],
  ["Telefonía", "Información del servicio de telefonía", "/telefonia", "Servicios"],
  ["Servicio Solidario", "Información sobre el servicio de sepelio", "/sepelio", "Servicios"],
  ["Trámites", "Conexiones, titularidad, reconexiones y actualización de datos", "/tramites", "Gestiones"],
  ["Medios de pago", "Opciones para pagar facturas y consultar deuda", "/medios-de-pago", "Gestiones"],
  ["Cortes programados", "Alertas e interrupciones confirmadas", "/cortes-programados", "Información"],
  ["Centro de ayuda", "Preguntas frecuentes y canales de atención", "/centro-de-ayuda", "Ayuda"],
  ["Noticias", "Noticias y comunicados oficiales de COOPSAR", "/noticias", "Información"],
  ["Institucional", "Información sobre COOPSAR", "/institucional", "COOPSAR"],
  ["Contacto", "Horarios, teléfonos y canales de atención", "/contacto", "Ayuda"],
] as const;

function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR");
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return Response.json({ results: [] });
  const terms = searchable(query).split(/\s+/).filter(Boolean);
  const pageResults = pages.filter((item) => terms.every((term) => searchable(`${item[0]} ${item[1]} ${item[3]}`).includes(term))).map(([title, description, href, type]) => ({ title, description, href, type }));
  const news = await getPublishedNews(50);
  const newsResults = news.filter((item) => terms.every((term) => searchable(`${item.title} ${item.excerpt} ${item.category}`).includes(term))).map((item) => ({ title: item.title, description: item.excerpt, href: `/noticias/${item.slug}`, type: "Noticia" }));
  return Response.json({ results: [...pageResults, ...newsResults].slice(0, 12) }, { headers: { "Cache-Control": "private, max-age=30" } });
}
