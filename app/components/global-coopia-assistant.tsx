"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CoopiaConversation } from "./coopia-conversation";
import { useCoopia } from "./coopia-context";
import { isPublicCoopiaPath } from "../../lib/coopia/session";

export function GlobalCoopiaAssistant() {
  const pathname = usePathname(); const coopia = useCoopia(); const { isOpen, setOpen } = coopia; const panelRef = useRef<HTMLElement>(null); const triggerRef = useRef<HTMLButtonElement>(null); const closeRef = useRef<() => void>(() => undefined);
  const hidden = pathname === "/" || !isPublicCoopiaPath(pathname);
  useEffect(() => { closeRef.current = () => setOpen(false); }, [setOpen]);
  useEffect(() => { if (!isOpen) return; const panel = panelRef.current; const trigger = triggerRef.current; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { closeRef.current(); return; } if (event.key !== "Tab" || !panel) return; const focusable = panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], textarea, [tabindex]:not([tabindex="-1"])'); const first = focusable[0], last = focusable[focusable.length - 1]; if (!first || !last) return; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }; document.addEventListener("keydown", onKeyDown); panel?.querySelector<HTMLElement>("button")?.focus(); return () => { document.removeEventListener("keydown", onKeyDown); trigger?.focus(); }; }, [isOpen]);
  if (hidden) return null;
  return <div className="global-coopia"><button ref={triggerRef} type="button" className="global-coopia-trigger" aria-expanded={coopia.isOpen} aria-controls="global-coopia-panel" onClick={() => coopia.setOpen(!coopia.isOpen)}><span>✦</span><strong>COOPIA</strong><small>Asistencia</small></button>{coopia.isOpen && <aside ref={panelRef} id="global-coopia-panel" className="global-coopia-panel" role="dialog" aria-modal="true" aria-label="COOPIA"><header><div><span className="assistant-avatar">✦</span><strong>COOPIA</strong></div><button type="button" aria-label="Cerrar COOPIA" onClick={() => coopia.setOpen(false)}>×</button></header><CoopiaConversation compact /></aside>}</div>;
}
