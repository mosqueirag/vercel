import type { Metadata } from "next";
import { Footer, Header } from "../../ui";
import { FamilyUpdateForm } from "./family-update-form";
import { getPublicContacts } from "../../../lib/data/public-content";
import { resolveFuneralGuard } from "../../../lib/sepelio-presentation";
import styles from "./family-update.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actualizar grupo familiar", description: "Solicitud privada para revisar integrantes del grupo familiar del servicio de sepelio." };

export default async function FuneralFamilyUpdatePage() {
  const guard = resolveFuneralGuard(await getPublicContacts("funeral"));
  return <><Header /><main className={styles.page}><div className={styles.container}>
    <section className={styles.intro} aria-labelledby="family-update-title"><p className={styles.eyebrow}>Servicio de sepelio</p><h1 id="family-update-title">Actualizar grupo familiar</h1><p className={styles.introCopy}>Informá los datos que querés que COOPSAR revise. La solicitud no modifica tu grupo automáticamente.</p></section>
    <section className={styles.bodyGrid} aria-label="Solicitud de actualización de grupo familiar"><FamilyUpdateForm guardHref={guard.href} /><aside className={styles.rail} aria-label="Ayuda para completar el trámite"><section className={styles.railCard}><h2>¿Necesitás el servicio ahora?</h2><p>La atención urgente se gestiona por la guardia.</p><a href={guard.href}>Llamar a guardia →</a></section><section className={styles.railCard}><h2>¿Qué pasa después?</h2><ol className={styles.railSteps}><li>Enviás la solicitud.</li><li>COOPSAR revisa la información.</li><li>La actualización no se aplica automáticamente.</li></ol></section></aside></section>
  </div></main><Footer /></>;
}
