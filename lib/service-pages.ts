import { CONTACT } from "./coopsar-data";
import type { PublicContact } from "./data/public-content";

export const servicePages: Record<string, { eyebrow: string; title: string; intro: string; items: [string, string, string][] }> = {
  energia: { eyebrow: "Energía eléctrica", title: "Energía para la comunidad", intro: "Accedé a guardias, trámites y orientación sobre el suministro eléctrico.", items: [["Simulador de consumo", "Estimá cuántos kWh consumen los artefactos de tu hogar.", "/simulador-energia"], ["Falta de energía", `Guardia 24 horas: ${CONTACT.energyGuard}.`, `tel:+542974364961`], ["Cortes programados", "Consultá únicamente alertas confirmadas.", "/cortes-programados"], ["Nueva conexión", "Iniciá una consulta sobre requisitos y factibilidad.", "/tramites"], ["Facturas", "Consultá deuda y comprobantes en Oficina Virtual.", CONTACT.virtualOffice]] },
  internet: { eyebrow: "Conectividad", title: "Internet para cada necesidad", intro: "Planes, soporte y solicitudes de cobertura con atención local.", items: [["Contratar internet", "Usá el recomendador y solicitá contacto.", "/#internet"], ["Consultar cobertura", "La disponibilidad requiere evaluación técnica.", "/#contratar"], ["Soporte", `Comunicaciones: ${CONTACT.internetSupport}.`, `tel:+542974641110`], ["Fibra óptica", "Conocé la tecnología y pedí una evaluación.", "/fibra-optica"]] },
  "fibra-optica": { eyebrow: "Fibra óptica", title: "Conectividad de nueva generación", intro: "Consultá disponibilidad de FTTH para tu hogar, comercio o empresa.", items: [["Cobertura", "Pendiente de evaluación técnica por zona.", "/#contratar"], ["Planes", "Velocidades y precios pendientes de confirmación.", "/#internet"], ["Solicitud", "Registrá tus datos para recibir asesoramiento.", "/#contratar"], ["Soporte", `Canal técnico: ${CONTACT.internetSupport}.`, `tel:+542974641110`]] },
  telefonia: { eyebrow: "Telefonía", title: "Comunicación y soporte local", intro: "Información sobre telefonía fija, gestiones y asistencia técnica.", items: [["Asistencia técnica", `Canal: ${CONTACT.internetSupport}.`, `tel:+542974641110`], ["Alta o baja", "Consultá requisitos con un operador.", "/contacto"], ["Cambio de titularidad", "Iniciá la orientación del trámite.", "/tramites"], ["Información", "Las condiciones están pendientes de carga oficial.", "/centro-de-ayuda"]] },
  sepelio: { eyebrow: "Servicio solidario", title: "Acompañamiento cuando más se necesita", intro: "Orientación y guardias del Servicio Solidario de Sepelios.", items: [["Guardia", CONTACT.funeralGuard, `tel:+542976241614`], ["Grupo familiar", "Mantené actualizada la nómina declarada.", "/contacto"], ["Cobertura", "Solicitá información oficial sobre condiciones.", "/contacto"], ["Acompañamiento", "Atención y orientación ante una necesidad.", "/contacto"]] },
  tramites: { eyebrow: "Autoservicio", title: "Trámites y gestiones", intro: "Encontrá el canal correcto sin conocer previamente la sección.", items: [["Cambio de titularidad", "Consultá documentación antes de iniciar.", "/#asistente"], ["Nueva conexión", "Solicitá orientación y evaluación.", "/#asistente"], ["Reconexión", "Conocé los pasos según tu situación.", "/#asistente"], ["Actualizar datos", "Ingresá a la Oficina Virtual o pedí ayuda.", CONTACT.virtualOffice]] },
  "cortes-programados": { eyebrow: "Estado de servicios", title: "Cortes y alertas operativas", intro: "No existen alertas confirmadas cargadas en este momento. Ante una urgencia usá la guardia correspondiente.", items: [["Energía", `Guardia: ${CONTACT.energyGuard}.`, `tel:+542974364961`], ["Internet", `Soporte: ${CONTACT.internetSupport}.`, `tel:+542974641110`], ["Información oficial", "Las novedades aparecerán aquí cuando sean publicadas.", "/noticias"], ["Asistente", "Describí tu problema para recibir orientación.", "/#asistente"]] },
  "medios-de-pago": { eyebrow: "Facturas", title: "Facturas y medios de pago", intro: "Accedé a los canales digitales disponibles. Verificá siempre que estés en el sitio oficial.", items: [["Oficina Virtual", "Consultá y descargá facturas.", CONTACT.virtualOffice], ["Consultar deuda", "Ingresá con tus credenciales en el canal oficial.", CONTACT.virtualOffice], ["Débito automático", "Consultá disponibilidad y condiciones.", "/#asistente"], ["Seguridad", "Nunca compartas contraseñas ni códigos.", "/privacidad"]] },
  "centro-de-ayuda": { eyebrow: "Ayuda", title: "Centro de ayuda COOPSAR", intro: "Respuestas y accesos oficiales para resolver consultas frecuentes.", items: [["Asistente inteligente", "Escribí qué necesitás con tus palabras.", "/#asistente"], ["Trámites", "Explorá gestiones frecuentes.", "/tramites"], ["Internet", "Consultá planes y cobertura.", "/internet"], ["Hablar con una persona", CONTACT.whatsappDisplay, `https://wa.me/${CONTACT.whatsapp}`]] },
  institucional: { eyebrow: "Nuestra cooperativa", title: "COOPSAR, cerca de la comunidad", intro: "Servicios esenciales con compromiso cooperativo y atención local en Sarmiento.", items: [["Servicios", "Energía, conectividad, telefonía y sepelio.", "/"], ["Atención", CONTACT.hours, "/contacto"], ["Domicilio", CONTACT.office, "/contacto"], ["Noticias", "Información institucional y operativa.", "/noticias"]] },
  contacto: { eyebrow: "Atención", title: "Contactate con COOPSAR", intro: "Elegí el canal adecuado para tu consulta y evitá compartir información sensible.", items: [["WhatsApp comercial", CONTACT.whatsappDisplay, `https://wa.me/${CONTACT.whatsapp}`], ["Energía", CONTACT.energyGuard, `tel:+542974364961`], ["Internet y telefonía", CONTACT.internetSupport, `tel:+542974641110`], ["Sepelio", CONTACT.funeralGuard, `tel:+542976241614`]] },
  privacidad: { eyebrow: "Privacidad", title: "Uso responsable de tus datos", intro: "COOPSAR solicita únicamente la información necesaria para responder consultas y prestar servicios.", items: [["Asistente", "No compartas contraseñas, datos bancarios ni información sensible.", "/#asistente"], ["Solicitudes", "Los datos comerciales se usan para gestionar tu pedido.", "/internet"], ["Analítica", "Se priorizan métricas anónimas y agregadas.", "/"], ["Derechos", "Contactá a COOPSAR para consultar sobre tus datos.", "/contacto"]] },
};

const contactValue = (contacts: PublicContact[], service: string, purpose: string, fallback: string) => contacts.find((contact) => contact.service === service && contact.purpose === purpose)?.value || fallback;
const phoneHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;
const whatsappHref = (value: string) => `https://wa.me/${value.replace(/\D/g, "")}`;

/** Resolves only visible contact cards; published Supabase values always win. */
export function withPublicContacts(page: (typeof servicePages)[string], contacts: PublicContact[]) {
  const whatsapp = contactValue(contacts, "general", "general_contact", CONTACT.whatsapp);
  const energy = contactValue(contacts, "energy", "emergency", CONTACT.energyGuard);
  const internet = contactValue(contacts, "internet", "support", CONTACT.internetSupport);
  const funeral = contactValue(contacts, "funeral", "emergency", CONTACT.funeralGuard);
  const officeHours = contactValue(contacts, "general", "office_hours", CONTACT.hours);
  const officeAddress = contactValue(contacts, "general", "office_address", CONTACT.office);
  const virtualOffice = contactValue(contacts, "billing", "virtual_office", CONTACT.virtualOffice);

  return {
    ...page,
    items: page.items.map(([title, text, href]) => {
      if (title === "Falta de energía" || title === "Energía") return [title, `Guardia: ${energy}.`, phoneHref(energy)] as [string, string, string];
      if (title === "Soporte" || title === "Asistencia técnica" || title === "Internet y telefonía") return [title, `Canal técnico: ${internet}.`, phoneHref(internet)] as [string, string, string];
      if (title === "Guardia" || title === "Sepelio") return [title, funeral, phoneHref(funeral)] as [string, string, string];
      if (title === "WhatsApp comercial" || title === "Hablar con una persona") return [title, whatsapp, whatsappHref(whatsapp)] as [string, string, string];
      if (title === "Atención") return [title, officeHours, "/contacto"] as [string, string, string];
      if (title === "Domicilio") return [title, officeAddress, "/contacto"] as [string, string, string];
      if (title === "Oficina Virtual" || title === "Consultar deuda" || title === "Actualizar datos" || title === "Facturas") return [title, text, virtualOffice] as [string, string, string];
      return [title, text, href] as [string, string, string];
    }),
  };
}
