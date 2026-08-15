import type { Metadata } from "next";
import { Contact, Footer, Header } from "../ui";
import { EnergySimulator } from "./energy-simulator";

export const metadata: Metadata = { title: "Simulador de consumo de energía", description: "Estimá el consumo mensual en kWh de los artefactos de tu hogar y encontrá oportunidades de ahorro." };

export default function EnergySimulatorPage() {
  return <main><Header /><EnergySimulator /><Contact /><Footer /></main>;
}
