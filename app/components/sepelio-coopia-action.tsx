"use client";

import { useCoopia } from "./coopia-context";

type SepelioCoopiaActionProps = { children: React.ReactNode; prompt: string; className?: string };

/** Opens the single global COOPIA panel without creating a second conversation. */
export function SepelioCoopiaAction({ children, prompt, className }: SepelioCoopiaActionProps) {
  const { setInput, setOpen } = useCoopia();
  return <button type="button" className={className} onClick={() => { setInput(prompt); setOpen(true); }}>{children}<span aria-hidden="true">→</span></button>;
}
