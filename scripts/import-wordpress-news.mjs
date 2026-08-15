import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const namespaces = {
  content: "content:encoded",
  excerpt: "excerpt:encoded",
  postId: "wp:post_id",
  postType: "wp:post_type",
  status: "wp:status",
  slug: "wp:post_name",
  date: "wp:post_date_gmt",
  attachmentUrl: "wp:attachment_url",
  metaKey: "wp:meta_key",
  metaValue: "wp:meta_value",
};

const demoTitles = new Set([
  "beautiful life with avada health care gives security",
  "beautiful life with beautiful health",
  "amazing health care coming to your area soon",
  "how often should you visit your midwife during pregnancy?",
  "what does it mean to have an incredible daily diet?",
  "taking the best care of your kids is a daily regiment",
  "new ways to prevent heart attacks",
  "best practices in finding the right insurance for your needs",
  "30 day golf challenge",
  "track training",
  "find a sport you love",
  "dedication, what it takes...",
  "try a family activity holiday to keep fit",
  "90 day swimming challenge",
  "training for a marathon",
  "don't sweat it",
]);

function loadEnvironment(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function decodeEntities(value = "") {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&#(x?[0-9a-f]+);|&([a-z]+);/gi, (entity, numeric, name) => {
    if (numeric) return String.fromCodePoint(Number.parseInt(numeric.replace(/^x/i, ""), numeric.startsWith("x") ? 16 : 10));
    return named[name.toLowerCase()] ?? entity;
  });
}

function unwrap(value = "") {
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return decodeEntities((cdata ? cdata[1] : value).trim());
}

function tag(item, name) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return unwrap(match?.[1]);
}

function categories(item) {
  return [...item.matchAll(/<category\s+domain="category"[^>]*>([\s\S]*?)<\/category>/gi)].map((match) => unwrap(match[1])).filter(Boolean);
}

function metadata(item) {
  const result = new Map();
  for (const block of item.matchAll(/<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/gi)) {
    result.set(tag(block[1], namespaces.metaKey), tag(block[1], namespaces.metaValue));
  }
  return result;
}

function cleanText(value = "") {
  return decodeEntities(value)
    .replace(/\[(?:\/?fusion_[^\]]+|\/?vc_[^\]]+|gallery[^\]]*|caption[^\]]*)\]/gi, "\n")
    .replace(/<\/?(?:p|div|h[1-6]|li|blockquote|tr|table|section|article)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(value, fallback) {
  const slug = decodeEntities(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `noticia-${fallback}`;
}

function categoryFor(values, title) {
  const source = `${values.join(" ")} ${title}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/sepelio/.test(source)) return "Sepelio";
  if (/internet|fibra/.test(source)) return "Internet y fibra";
  if (/telefon/.test(source)) return "Telefonía";
  if (/energia|electr|corte programado|corte de luz/.test(source)) return "Energía";
  if (/adecoop|taller|beca/.test(source)) return "ADECOOP";
  if (/oferta publica|concurso de precios|licitacion/.test(source)) return "Oferta pública";
  if (/comunicado/.test(source)) return "Comunicados";
  return "Institucional";
}

function normalizeImageUrl(value) {
  if (!value) return null;
  return value.replace(/^http:\/\/(?:www\.)?coopsar\.com\.ar/i, "https://www.coopsar.com.ar");
}

function parseExport(xml) {
  const items = [...xml.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const attachments = new Map();
  for (const item of items) {
    if (tag(item, namespaces.postType) === "attachment") attachments.set(tag(item, namespaces.postId), normalizeImageUrl(tag(item, namespaces.attachmentUrl)));
  }

  const usedSlugs = new Set();
  const rows = [];
  let excludedDemo = 0;
  for (const item of items) {
    if (tag(item, namespaces.postType) !== "post" || tag(item, namespaces.status) !== "publish") continue;
    const postId = tag(item, namespaces.postId);
    const title = tag(item, "title").trim();
    if (!title || demoTitles.has(title.toLowerCase())) { excludedDemo += 1; continue; }
    const rawContent = tag(item, namespaces.content);
    const content = cleanText(rawContent) || "Información publicada originalmente por COOPSAR.";
    const providedExcerpt = cleanText(tag(item, namespaces.excerpt));
    const excerpt = (providedExcerpt || content.split(/\n+/)[0]).slice(0, 280).trim();
    let slug = slugify(tag(item, namespaces.slug) || title, postId);
    if (usedSlugs.has(slug)) slug = `${slug}-${postId}`;
    usedSlugs.add(slug);
    const date = tag(item, namespaces.date).replace(" ", "T");
    const thumbnailId = metadata(item).get("_thumbnail_id");
    rows.push({
      slug,
      title,
      category: categoryFor(categories(item), title),
      excerpt,
      lead: excerpt,
      content,
      image_url: attachments.get(thumbnailId) || null,
      status: "published",
      published_at: date ? `${date}Z` : new Date().toISOString(),
      author_email: null,
    });
  }
  return { rows, excludedDemo, attachmentCount: attachments.size };
}

const input = process.argv.find((arg) => arg.toLowerCase().endsWith(".xml"));
if (!input) throw new Error("Uso: node scripts/import-wordpress-news.mjs <export.xml> [--apply]");
loadEnvironment(path.resolve(process.env.IMPORT_ENV_FILE || ".env.local"));
const xml = fs.readFileSync(path.resolve(input), "utf8");
const { rows, excludedDemo, attachmentCount } = parseExport(xml);
const totalContentCharacters = rows.reduce((total, row) => total + row.content.length, 0);
const sqlBatchArgument = process.argv.find((arg) => arg.startsWith("--sql-batch="));
if (sqlBatchArgument) {
  const batchNumber = Number(sqlBatchArgument.split("=")[1]);
  const batchSizeArgument = process.argv.find((arg) => arg.startsWith("--batch-size="));
  const batchSize = Number(batchSizeArgument?.split("=")[1] || 25);
  const sqlValue = (value) => value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
  const batch = rows.slice(batchNumber * batchSize, (batchNumber + 1) * batchSize);
  if (!batch.length) process.exit(0);
  const values = batch.map((row) => `(${sqlValue(row.slug)},${sqlValue(row.title)},${sqlValue(row.category)},${sqlValue(row.excerpt)},${sqlValue(row.lead)},${sqlValue(row.content)},${sqlValue(row.image_url)},${sqlValue(row.status)},${sqlValue(row.published_at)}::timestamptz,null)`).join(",\n");
  process.stdout.write(`insert into public.news_articles (slug,title,category,excerpt,lead,content,image_url,status,published_at,author_email) values\n${values}\non conflict (slug) do nothing;`);
  process.exit(0);
}
console.log(JSON.stringify({ parsed: rows.length, excludedDemo, attachmentCount, totalContentCharacters, largestArticle: Math.max(...rows.map((row) => row.content.length)), apply: process.argv.includes("--apply") }));
if (!process.argv.includes("--apply")) process.exit(0);

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !secret) throw new Error("Faltan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
const supabase = createClient(supabaseUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } });
let imported = 0;
for (let index = 0; index < rows.length; index += 25) {
  const batch = rows.slice(index, index + 25);
  const { error } = await supabase.from("news_articles").upsert(batch, { onConflict: "slug", ignoreDuplicates: true });
  if (error) throw new Error(`Falló el lote ${index / 25 + 1}: ${error.message}`);
  imported += batch.length;
  process.stdout.write(`\rProcesadas ${imported}/${rows.length}`);
}
console.log(`\nImportación terminada: ${imported} entradas procesadas.`);
