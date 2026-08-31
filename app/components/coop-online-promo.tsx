import { CoopOnlineDownloadLink } from "./coop-online-download-link";

export function CoopOnlineQuickAction() {
  return <CoopOnlineDownloadLink className="home-quick-action coop-online-quick-action public-action-card public-action-card--primary" source="quick_actions_app">
    <span className="coop-online-quick-phone" aria-hidden="true"><i /><b /></span>
    <span className="home-quick-action-copy"><small>App COOPSAR</small><strong>COOP Online</strong><em>Gestioná tus servicios desde el celular.</em></span>
    <span className="home-quick-action-arrow" aria-hidden="true">→</span>
  </CoopOnlineDownloadLink>;
}
