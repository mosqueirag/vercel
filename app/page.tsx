import { AssistantCenter } from "./components/assistant-center";
import { InternetCenter } from "./components/internet-center";
import { SelfService, ServiceStatusPanel } from "./components/operations";
import { Contact, Footer, Header, NewsCards } from "./ui";
import Link from "next/link";

export default function Home() {
  return <main><Header /><AssistantCenter /><InternetCenter /><SelfService /><ServiceStatusPanel /><section className="section news-section"><div className="section-heading"><div><span className="eyebrow">Noticias y comunicados</span><h2>Información de COOPSAR</h2></div><Link className="text-link" href="/noticias">Ver todas →</Link></div><NewsCards /></section><Contact /><Footer /></main>;
}
