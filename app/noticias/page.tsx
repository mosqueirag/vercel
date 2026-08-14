import { getPublishedNews } from "../../lib/news";
import { Contact, Footer, Header, NewsCards } from "../ui";

export const dynamic = "force-dynamic";

export default async function Page() {
  const news = await getPublishedNews();
  return <main><Header /><section className="inner"><span className="tag">ACTUALIDAD</span><h1>Noticias de COOPSAR</h1><p>Información oficial sobre energía, conectividad y servicios.</p></section><section className="section"><NewsCards items={news} /></section><Contact /><Footer /></main>;
}
