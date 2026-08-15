import Image from "next/image";
import Link from "next/link";
import { getPublishedNews } from "../lib/news";
import { AssistantCenter } from "./components/assistant-center";
import { HomeAdaptivePanel } from "./components/home-adaptive-panel";
import { InternetCenter } from "./components/internet-center";
import { SelfService, ServiceStatusPanel } from "./components/operations";
import { Contact, Footer, Header, NewsCards } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const news = await getPublishedNews(3);
  return <main>
    <Header />
    <AssistantCenter />
    <HomeAdaptivePanel />
    <InternetCenter />
    <SelfService />
    <ServiceStatusPanel />
    <section className="efficient-energy" aria-labelledby="efficient-energy-title">
      <div className="efficient-energy-image">
        <Image src="/images/coopsar-energy.png" alt="Equipo de COOPSAR trabajando en la red eléctrica de Sarmiento" fill sizes="(max-width: 800px) 100vw, 1400px" />
        <div className="efficient-energy-shade" />
        <h2 id="efficient-energy-title">Pequeños cambios<br />hacen una <strong>gran<br />diferencia</strong></h2>
        <article>
          <span className="eyebrow">Consumo eficiente</span>
          <h3>Cuidá la energía.<br />Conocé cuánto consumís.</h3>
          <p>Usar la energía de manera responsable empieza por entender nuestros hábitos. Identificá qué artefactos demandan más y encontrá oportunidades concretas para ahorrar.</p>
          <p>Con el simulador de COOPSAR podés estimar el consumo mensual de tu hogar en kWh, comparar categorías y tomar mejores decisiones.</p>
          <div><Link href="/simulador-energia">Simular consumo →</Link><Link href="/energia">Ver consejos</Link></div>
        </article>
      </div>
    </section>
    <section className="section news-section">
      <div className="section-heading"><div><span className="eyebrow">Noticias y comunicados</span><h2>Información de COOPSAR</h2></div><Link className="text-link" href="/noticias">Ver todas →</Link></div>
      <NewsCards items={news} />
    </section>
    <Contact />
    <Footer />
  </main>;
}
