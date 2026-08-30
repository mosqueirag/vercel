export const internetTechnologies = [
  {
    id: "FTTH",
    label: "Fibra óptica",
    heading: "Conectividad por fibra óptica",
    description: "Conexión mediante fibra hasta el domicilio, pensada para el uso cotidiano de múltiples dispositivos.",
    facts: ["Conexión por fibra.", "Apta para streaming y videollamadas.", "Disponibilidad según zona."],
    visual: "fiber",
  },
  {
    id: "ADSL",
    label: "ADSL",
    heading: "Internet mediante red ADSL",
    description: "Alternativa de conectividad que utiliza infraestructura telefónica disponible.",
    facts: ["Usa infraestructura existente.", "Disponible en determinadas zonas.", "Sujeto a validación técnica."],
    visual: "adsl",
  },
  {
    id: "WIRELESS",
    label: "Internet inalámbrico",
    heading: "Conectividad inalámbrica",
    description: "Alternativa de Internet mediante conectividad inalámbrica.",
    facts: ["Conexión sin tendido de fibra al domicilio.", "Alternativa para distintas zonas.", "Instalación sujeta a factibilidad."],
    visual: "wireless",
  },
] as const;

export type InternetTechnologyId = (typeof internetTechnologies)[number]["id"];

export function getInternetTechnologyPresentation(technology: InternetTechnologyId) {
  return internetTechnologies.find((item) => item.id === technology)!;
}
