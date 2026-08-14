import { AssistantCenter } from "./components/assistant-center";
import { InternetCenter } from "./components/internet-center";
import { SelfService, ServiceStatusPanel } from "./components/operations";
import { Contact, Footer, Header, NewsCards } from "./ui";
import Link from "next/link";
import { getPublishedNews } from "../lib/news";

export default async function Home() {
  const news = await getPublishedNews(3);
  return <main><Header /><AssistantCenter /><InternetCenter /><SelfService /><ServiceStatusPanel /><section className="section news-section"><div className="section-heading"><div><span className="eyebrow">Noticias y comunicados</span><h2>Información de COOPSAR</h2></div><Link className="text-link" href="/noticias">Ver todas →</Link></div><NewsCards items={news} /></section><Contact /><Footer /></main>;
}
