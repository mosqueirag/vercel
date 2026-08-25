"use client";

import { useCoopia } from "./coopia-context";

export function openCoopiaPanel(setOpen: (open: boolean) => void) {
  setOpen(true);
}

export function InternetCoopiaAction({ children, className }: { children: string; className?: string }) {
  const { setOpen } = useCoopia();

  return <button type="button" className={className} onClick={() => openCoopiaPanel(setOpen)}>{children}</button>;
}
