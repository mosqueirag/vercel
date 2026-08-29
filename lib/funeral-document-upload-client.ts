import type { FuneralDocumentSide } from "./funeral-documents";

export type FuneralDocumentFile = Pick<File, "type" | "size">;
export type SignedFuneralDocument = { path: string; token: string };
export type FuneralUploadSession = { uploadId: string; front: SignedFuneralDocument; back: SignedFuneralDocument };

export async function uploadPrivateFuneralDocuments({
  front,
  back,
  createSession,
  upload,
}: {
  front: FuneralDocumentFile;
  back: FuneralDocumentFile;
  createSession: () => Promise<FuneralUploadSession>;
  upload: (side: FuneralDocumentSide, signed: SignedFuneralDocument, file: FuneralDocumentFile) => Promise<void>;
}) {
  const session = await createSession();
  await Promise.all([
    upload("front", session.front, front),
    upload("back", session.back, back),
  ]);
  return session.uploadId;
}
