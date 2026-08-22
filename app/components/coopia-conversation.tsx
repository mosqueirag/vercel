"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AssistantUIRenderer } from "./assistant-ui";
import { useCoopia } from "./coopia-context";
import { getCoopiaQuickActions } from "../../lib/coopia/quick-actions";
import { scrollStructuredResponseIntoView, shouldAutoScrollStructuredResponse } from "../../lib/coopia/structured-response-scroll";

function RichText({ content }: { content: string }) {
  const inline = (value: string) => value.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g).filter(Boolean).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noreferrer">{part}</a> : part);
  return <div className="message-content">{content.trim().split(/\n\s*\n/).filter(Boolean).map((block, index) => { const lines = block.split("\n").map((line) => line.trim()).filter(Boolean); return lines.every((line) => /^[-•]\s+/.test(line)) ? <ul key={index}>{lines.map((line) => <li key={line}>{inline(line.replace(/^[-•]\s+/, ""))}</li>)}</ul> : <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{inline(line)}{lineIndex < lines.length - 1 && <br />}</span>)}</p>; })}</div>;
}

export function CoopiaConversation({ compact = false }: { compact?: boolean }) {
  const coopia = useCoopia(); const structuredReplyRef = useRef<HTMLDivElement>(null); const lastScrolledResultKey = useRef(""); const [feedbackFor, setFeedbackFor] = useState<string | null>(null); const lastMessage = coopia.messages.at(-1)?.content || ""; const suggestions = getCoopiaQuickActions(coopia.pageContext);
  useEffect(() => {
    if (!shouldAutoScrollStructuredResponse({ resultKey: coopia.assistantResultKey, hasStructuredResult: Boolean(coopia.assistantResult), lastScrolledResultKey: lastScrolledResultKey.current })) return;
    lastScrolledResultKey.current = coopia.assistantResultKey;
    let cancelled = false;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => { secondFrame = window.requestAnimationFrame(() => { if (!cancelled) scrollStructuredResponseIntoView(structuredReplyRef.current); }); });
    return () => { cancelled = true; window.cancelAnimationFrame(firstFrame); window.cancelAnimationFrame(secondFrame); };
  }, [coopia.assistantResult, coopia.assistantResultKey]);
  function submit(event: FormEvent) { event.preventDefault(); void coopia.ask(coopia.input); }
  const hasReply = coopia.messages.some((message) => message.role === "assistant" && message.content);
  return <div className={compact ? "coopia-conversation coopia-compact" : "coopia-conversation"}>
    {!coopia.limited && <><form className="chat-input" onSubmit={submit}><label className="sr-only" htmlFor={compact ? "coopia-global-query" : "assistant-query"}>Tu consulta</label><textarea id={compact ? "coopia-global-query" : "assistant-query"} value={coopia.input} maxLength={1200} onChange={(event) => coopia.setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={compact ? "¿En qué puedo ayudarte?" : "¿Qué necesitás resolver hoy?\nPodés contarme con tus palabras."} rows={compact ? 2 : 3} /><button disabled={!coopia.input.trim() || coopia.loading} aria-label="Enviar consulta">Enviar <span>↑</span></button></form><div className="suggestions coopia-quick-actions" aria-label="Consultas sugeridas">{suggestions.map((item) => <button type="button" key={item.prompt} onClick={() => void coopia.ask(item.prompt)}>{item.label}</button>)}</div></>}
    {(hasReply || coopia.limited || coopia.error || coopia.loading) && <div className="chat-log" aria-live="polite">
      {coopia.messages.map((message, index) => {
        const isCurrentAssistantReply = message.role === "assistant" && index === coopia.messages.length - 1 && Boolean(coopia.assistantResult);
        return <div className={`message ${message.role}`} key={`${message.role}-${index}`} ref={isCurrentAssistantReply ? structuredReplyRef : undefined}><small>{message.role === "user" ? "Vos" : "COOPIA"}</small>{message.content ? <RichText content={message.content} /> : <p>…</p>}{isCurrentAssistantReply && coopia.assistantResult && <AssistantUIRenderer result={coopia.assistantResult} resultKey={coopia.assistantResultKey} onComplaintServiceSelect={(service) => void coopia.ask(`Quiero hacer un reclamo de ${service}`)} />}{message.role === "assistant" && message.content && !coopia.assistantResult && <div className="message-actions"><a href={coopia.handoffUrl} onClick={() => coopia.track("coopia_handoff", undefined, "whatsapp")}>Hablar con un operador</a><Link href="/tramites">Ver trámites</Link></div>}</div>;
      })}
      {hasReply && !coopia.loading && feedbackFor !== lastMessage && <div className="coopia-feedback"><span>¿Te sirvió esta respuesta?</span><button type="button" onClick={() => { coopia.feedback(true); setFeedbackFor(lastMessage); }}>👍 Sí</button><button type="button" onClick={() => { coopia.feedback(false); setFeedbackFor(lastMessage); }}>👎 No</button></div>}
      {coopia.loading && coopia.messages.at(-1)?.role !== "assistant" && <div className="typing"><i /><i /><i /><span>COOPIA está escribiendo</span></div>}
      {coopia.limited && <div className="limit-card"><strong>Continuemos por un canal humano</strong><p>Alcanzaste el límite inicial de respuestas de IA. Podés continuar por WhatsApp sin perder el motivo de tu consulta.</p><div><a href={coopia.handoffUrl} onClick={() => coopia.track("coopia_handoff", undefined, "whatsapp")}>Continuar por WhatsApp ↗</a></div></div>}
      {coopia.error && <div className="chat-error"><span>{coopia.error}</span><button type="button" onClick={() => void coopia.ask(coopia.messages.at(-1)?.content || coopia.input)}>Reintentar</button></div>}
    </div>}
    <div className="ai-legal"><span>La IA puede cometer errores. No compartas contraseñas, datos bancarios ni información sensible.</span><Link href="/privacidad">Privacidad</Link></div>
  </div>;
}
