import { createHash } from "node:crypto";

export type HumanEdit = { title: string; summary: string; content: string };
export function validateHumanEdit(value: Partial<HumanEdit> | null): HumanEdit | null {
  if (!value) return null;
  const title = value.title?.trim(), summary = value.summary?.trim(), content = value.content?.trim();
  if (!title || !summary || !content || title.length > 180 || summary.length > 700 || content.length > 12000) return null;
  return { title, summary, content };
}
export function humanEditHash(value: HumanEdit) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
