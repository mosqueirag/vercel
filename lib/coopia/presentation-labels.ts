const labels: Record<string, string> = {
  action_completed: "acciones completadas",
  action_shown: "acciones mostradas",
  message_sent: "consultas enviadas",
  general_question: "consulta general",
  internet_signup: "alta de Internet",
  ownership_change: "cambio de titularidad",
  resolved: "resuelto",
  information_provided: "información brindada",
  conversion: "conversión registrada",
  handoff: "derivación humana",
  abandoned: "gestión abandonada",
  unresolved: "sin resolver",
  error: "error de atención",
  fiber_coverage: "cobertura de fibra",
  fiber: "fibra óptica",
  internet: "Internet",
  energy: "energía",
  billing: "facturación",
  phone: "telefonía",
  funeral: "sepelio",
};

export function coopiaPresentationLabel(value: string) {
  return labels[value] || value.replaceAll("_", " ");
}

export function coopiaPulseLabel(kind: "topic" | "service", value: string) {
  return `Posible incremento de consultas sobre ${kind === "topic" ? "el tema " : "el servicio "}${coopiaPresentationLabel(value)}.`;
}
