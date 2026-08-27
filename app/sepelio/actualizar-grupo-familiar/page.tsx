import type { Metadata } from "next";
import { Footer, Header } from "../../ui";
import { FamilyUpdateForm } from "./family-update-form";
import { getPublicContacts } from "../../../lib/data/public-content";
import { resolveFuneralGuard } from "../../../lib/sepelio-presentation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actualizar grupo familiar | Sepelio | COOPSAR", description: "Solicitud privada para revisar integrantes del grupo familiar del servicio de sepelio." };

export default async function FuneralFamilyUpdatePage() {
  const guard = resolveFuneralGuard(await getPublicContacts("funeral"));
  return <><Header /><main className="family-update-page"><section className="family-update-intro section-shell"><p className="eyebrow">Servicio de sepelio</p><h1>Actualizar grupo familiar</h1><p>Completá la solicitud para que el equipo pueda revisar los integrantes informados. El envío no modifica datos automáticamente.</p><aside><strong>¿Necesitás el servicio ahora?</strong><span>La atención urgente se gestiona por la guardia.</span><a href={guard.href}>Llamar a guardia →</a></aside></section><section className="family-update-shell section-shell"><FamilyUpdateForm guardHref={guard.href} /></section></main><Footer /></>;
}
