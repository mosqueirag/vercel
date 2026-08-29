import { z } from "zod";

export const funeralDocumentsBucket = "funeral-private-documents";
export const funeralDocumentMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const funeralDocumentMaxBytes = 8 * 1024 * 1024;

export type FuneralDocumentSide = "front" | "back";

export const funeralDocumentDescriptorSchema = z.object({
  type: z.enum(funeralDocumentMimeTypes),
  size: z.number().int().positive().max(funeralDocumentMaxBytes),
});

export const funeralUploadInitSchema = z.object({
  front: funeralDocumentDescriptorSchema,
  back: funeralDocumentDescriptorSchema,
});

export function funeralDocumentExtension(type: (typeof funeralDocumentMimeTypes)[number]) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[type];
}

export function privateFuneralDocumentPath(uploadId: string, side: FuneralDocumentSide, type: (typeof funeralDocumentMimeTypes)[number]) {
  return `${uploadId}/holder-dni-${side}.${funeralDocumentExtension(type)}`;
}

export function documentSizeBucket(size: number) {
  if (size <= 1024 * 1024) return "up_to_1mb";
  if (size <= 4 * 1024 * 1024) return "up_to_4mb";
  return "up_to_8mb";
}

export function isPrivateFuneralDocumentPath(path: string) {
  return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\/holder-dni-(front|back)\.(jpg|png|webp)$/i.test(path);
}
