import type { CoopiaAnalytics } from "../data/coopia-analytics";

export function summarizeCoopiaAnalytics(data: CoopiaAnalytics) {
  if (!data.totals.messages) return { summary: "Todavía no hay consultas suficientes para generar un resumen operativo.", recommendations: ["Revisar que la telemetría de COOPIA esté disponible en staging."] };
  const topic = data.intents[0]?.label?.replaceAll("_", " ") || "orientación general";
  const service = data.services[0]?.label || "los servicios";
  const recommendations = [
    data.totals.unresolved ? "Revisar los temas que terminan sin resolución o con derivación humana." : "Mantener actualizada la base de conocimiento oficial.",
    data.commercialRequests ? "Revisar solicitudes comerciales recientes desde la bandeja correspondiente." : "No hay oportunidades comerciales registradas para este período.",
  ];
  return { summary: `En el período seleccionado hubo ${data.totals.messages} consultas. El tema principal fue ${topic} y el servicio más consultado fue ${service}.`, recommendations };
}
