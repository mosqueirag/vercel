export type ServiceStatus = "operational" | "maintenance" | "partial" | "outage" | "unknown";

export const CONTACT = {
  whatsapp: "5492975376656",
  whatsappDisplay: "+54 9 2975 37-6656",
  energyGuard: "297 436-4961",
  internetSupport: "297 464-1110",
  funeralGuard: "297 624-1614 / 297 624-1615",
  office: "Roca 663 · Sarmiento, Chubut",
  hours: "Lunes a viernes · 8:00 a 15:00",
  virtualOffice: "https://www.cooponlineweb.com.ar/SARMIENTO/Login",
} as const;

export const internetPlans = [
  { id: "hogar", name: "Internet Hogar", audience: "Hogares", speed: "Pendiente de confirmación", technology: "Consultar disponibilidad técnica", price: null, benefits: ["Uso cotidiano", "Soporte local", "Instalación sujeta a factibilidad"] },
  { id: "intensivo", name: "Hogar Intensivo", audience: "Hogares con varios dispositivos", speed: "Pendiente de confirmación", technology: "Fibra óptica donde exista cobertura", price: null, benefits: ["Streaming y videollamadas", "Múltiples dispositivos", "Asesoramiento personalizado"] },
  { id: "comercial", name: "Internet Comercial", audience: "Comercios y empresas", speed: "Pendiente de confirmación", technology: "Según factibilidad técnica", price: null, benefits: ["Perfil de uso comercial", "Evaluación técnica", "Seguimiento de solicitud"] },
] as const;

export const serviceStatuses: { name: string; status: ServiceStatus; detail: string }[] = [
  { name: "Energía", status: "unknown", detail: "Sin información operativa confirmada" },
  { name: "Internet", status: "unknown", detail: "Sin información operativa confirmada" },
  { name: "Fibra óptica", status: "unknown", detail: "Sin información operativa confirmada" },
  { name: "Telefonía", status: "unknown", detail: "Sin información operativa confirmada" },
  { name: "Oficina Virtual", status: "unknown", detail: "Verificá el acceso antes de operar" },
];

export const knowledgeBase = `
COOPSAR es la Cooperativa de Provisión de Servicios Públicos de Sarmiento Ltda.
Servicios: energía eléctrica, internet, fibra óptica, telefonía y servicio solidario de sepelios.
Oficina Virtual: permite consultar deuda, facturas y gestiones. URL: ${CONTACT.virtualOffice}
WhatsApp comercial: ${CONTACT.whatsappDisplay}.
Guardia de energía: ${CONTACT.energyGuard}.
Soporte de internet y telefonía: ${CONTACT.internetSupport}.
Guardia de sepelio: ${CONTACT.funeralGuard}.
Atención: ${CONTACT.hours}. Domicilio: ${CONTACT.office}.
No hay precios, velocidades, zonas de cobertura, cortes ni condiciones comerciales confirmadas en la base actual.
Ante falta de información confirmada, indicar que está pendiente y derivar al canal correspondiente. Nunca afirmar cobertura ni inventar requisitos.
`;

export const quickActions = [
  ["Pagar factura", "Consultá deuda y medios disponibles.", CONTACT.virtualOffice, "$"],
  ["Descargar factura", "Ingresá a la Oficina Virtual.", CONTACT.virtualOffice, "↓"],
  ["Falta de energía", `Guardia: ${CONTACT.energyGuard}.`, "/energia", "!"],
  ["Cortes programados", "Revisá las alertas confirmadas.", "/cortes-programados", "≈"],
  ["Nueva conexión", "Iniciá la consulta de factibilidad.", "/tramites", "+"],
  ["Cambiar titularidad", "Conocé los pasos y documentación.", "/tramites", "↔"],
  ["Solicitar reconexión", "Recibí orientación para iniciar el pedido.", "/tramites", "↻"],
  ["Consultar cobertura", "Enviá tu zona para evaluación.", "/internet#cobertura", "⌖"],
  ["Contratar internet", "Pedí asesoramiento comercial.", "/internet#contratar", "⌁"],
  ["Actualizar datos", "Gestioná tus datos de asociado.", "/tramites", "✎"],
  ["Consultar deuda", "Accedé a tu cuenta en línea.", CONTACT.virtualOffice, "="],
  ["WhatsApp", "Hablá con una persona.", `https://wa.me/${CONTACT.whatsapp}`, "W"],
] as const;
