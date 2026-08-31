import type { Metadata } from "next";
import { Footer, Header } from "../ui";
import { getPublicContact } from "../../lib/data/public-content";
import { getPublicServiceStatus } from "../../lib/data/service-alerts";
import { getPublishedSitePage } from "../../lib/data/site-pages";
import { EnergyActions } from "./energy-actions";
import { EnergyStatusPanel } from "./energy-status-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Energía | COOPSAR", description: "Estado del servicio, cortes programados, guardia y gestiones de energía." };

export default async function EnergyPage() {
  const [page, operation, guard] = await Promise.all([getPublishedSitePage("energia"), getPublicServiceStatus("energy"), getPublicContact("energy", "emergency")]);
  const content = page ?? { eyebrow: "Energía", title: "Energía para la comunidad", intro: "Estado operativo, guardia y gestiones en un solo lugar." };
  return <><Header /><main className="energy-page"><section className="energy-hero"><div><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p></div><EnergyStatusPanel status={operation.status} alert={operation.alert} error={operation.error} /></section><EnergyActions guard={guard} /></main><Footer /></>;
}
