import type { IntentDetection } from "../ai/intents";

/** Copy only: official destinations and availability remain in structured actions. */
export function deterministicCoopiaResponse(detection: IntentDetection) {
  switch (detection.orchestrationIntent) {
    case "payment": return "**Pago y factura**\n\nTe muestro las acciones oficiales disponibles para consultar, pagar o descargar tu factura.";
    case "energy_outage": return "**Energía**\n\nVoy a orientarte con el canal operativo oficial según el servicio y el horario vigente.";
    case "internet_issue": return "**Internet y conectividad**\n\nPodemos iniciar una orientación básica y continuar por el canal oficial si necesitás asistencia.";
    case "internet_interest": return "**Internet**\n\nPrimero consultemos la cobertura; después podrás ver los planes publicados y solicitar contacto.";
    case "fiber_interest": return "**Fibra óptica**\n\nPrimero consultemos si existe cobertura en tu domicilio. La disponibilidad final requiere validación técnica.";
    case "fiber_coverage": return "**Cobertura de fibra**\n\nIngresá tu domicilio para consultar la cobertura registrada. La disponibilidad final requiere validación técnica.";
    case "funeral_service": return "**Servicio de sepelio**\n\nTe mostramos la información y los canales oficiales disponibles.";
    case "human_handoff": return "**Atención personal**\n\nPodés continuar la consulta con una persona de nuestro equipo por un canal oficial.";
    default: return null;
  }
}
