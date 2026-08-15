export type Appliance = {
  id: string;
  name: string;
  category: "Iluminación" | "Cocina" | "Climatización" | "Refrigeración" | "Lavado" | "Tecnología" | "Agua";
  watts: number;
  defaultHours: number;
  note?: string;
};

export const appliances: Appliance[] = [
  { id: "led", name: "Lámpara LED", category: "Iluminación", watts: 9, defaultHours: 5 },
  { id: "tube", name: "Tubo LED", category: "Iluminación", watts: 18, defaultHours: 5 },
  { id: "fridge", name: "Heladera con freezer", category: "Refrigeración", watts: 45, defaultHours: 24, note: "Potencia promedio considerando ciclos" },
  { id: "freezer", name: "Freezer", category: "Refrigeración", watts: 55, defaultHours: 24, note: "Potencia promedio considerando ciclos" },
  { id: "kettle", name: "Pava eléctrica", category: "Cocina", watts: 2000, defaultHours: 0.25 },
  { id: "microwave", name: "Microondas", category: "Cocina", watts: 1200, defaultHours: 0.25 },
  { id: "oven", name: "Horno eléctrico", category: "Cocina", watts: 2200, defaultHours: 1 },
  { id: "toaster", name: "Tostadora", category: "Cocina", watts: 900, defaultHours: 0.15 },
  { id: "washing", name: "Lavarropas", category: "Lavado", watts: 500, defaultHours: 0.5 },
  { id: "dryer", name: "Secarropas", category: "Lavado", watts: 2500, defaultHours: 0.5 },
  { id: "iron", name: "Plancha", category: "Lavado", watts: 1500, defaultHours: 0.3 },
  { id: "ac", name: "Aire acondicionado", category: "Climatización", watts: 1400, defaultHours: 4 },
  { id: "heater", name: "Caloventor", category: "Climatización", watts: 2000, defaultHours: 3 },
  { id: "radiator", name: "Radiador eléctrico", category: "Climatización", watts: 1500, defaultHours: 5 },
  { id: "fan", name: "Ventilador", category: "Climatización", watts: 75, defaultHours: 6 },
  { id: "tv", name: "Televisor LED", category: "Tecnología", watts: 100, defaultHours: 4 },
  { id: "desktop", name: "Computadora de escritorio", category: "Tecnología", watts: 250, defaultHours: 5 },
  { id: "notebook", name: "Notebook", category: "Tecnología", watts: 60, defaultHours: 5 },
  { id: "router", name: "Router de internet", category: "Tecnología", watts: 12, defaultHours: 24 },
  { id: "pump", name: "Bomba de agua", category: "Agua", watts: 750, defaultHours: 1 },
  { id: "water-heater", name: "Termotanque eléctrico", category: "Agua", watts: 2000, defaultHours: 3 },
];

export type ApplianceUse = { quantity: number; hoursPerDay: number; daysPerMonth: number };

export function monthlyConsumption(appliance: Appliance, use: ApplianceUse) {
  return appliance.watts * use.quantity * use.hoursPerDay * use.daysPerMonth / 1000;
}

export function consumptionLevel(kwh: number) {
  if (kwh < 150) return { label: "Consumo moderado", tone: "low" };
  if (kwh < 300) return { label: "Consumo intermedio", tone: "medium" };
  return { label: "Consumo elevado", tone: "high" };
}
