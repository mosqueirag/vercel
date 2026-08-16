import type { MetadataRoute } from "next";
import { servicePages } from "../lib/service-pages";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_SITE_URL || "https://coopsar-servicios.vercel.app"; return ["", ...Object.keys(servicePages), "simulador-energia", "noticias"].map((path) => ({ url: `${base}/${path}`, lastModified: new Date(), changeFrequency: path ? "weekly" : "daily", priority: path ? .7 : 1 })); }
