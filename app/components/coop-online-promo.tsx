import { CoopOnlineDownloadLink } from "./coop-online-download-link";

export function CoopOnlinePromo() {
  return <section className="coop-online-promo section" aria-labelledby="coop-online-title">
    <div className="coop-online-promo-copy">
      <span className="eyebrow">COOP Online</span>
      <h2 id="coop-online-title">Todo COOPSAR, también en tu celular.</h2>
      <p>Accedé a COOP Online y gestioná tus servicios desde donde estés.</p>
      <CoopOnlineDownloadLink className="coop-online-promo-cta" source="home_app_promo">Descargar app en Google Play <span aria-hidden="true">→</span></CoopOnlineDownloadLink>
    </div>
    <div className="coop-online-phone" aria-hidden="true">
      <div className="coop-online-phone-speaker" />
      <div className="coop-online-phone-screen"><span>COOP</span><i /><b /><small /></div>
    </div>
  </section>;
}
