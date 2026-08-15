"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONTACT } from "../../lib/coopsar-data";

type Message = { role: "user" | "assistant"; content: string };
const suggestions = ["Pagar una factura", "Informar un problema", "Contratar internet", "Consultar cobertura", "Descargar factura", "Ver cortes programados"];

function RichText({ content }: { content: string }) {
  const inline = (value: string) => value.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) return <a key={index} href={part} target="_blank" rel="noreferrer">{part}</a>;
    return part;
  });
  return <div className="message-content">{content.trim().split(/\n\s*\n/).filter(Boolean).map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => /^[-•]\s+/.test(line))) return <ul key={index}>{lines.map((line) => <li key={line}>{inline(line.replace(/^[-•]\s+/, ""))}</li>)}</ul>;
    return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{inline(line)}{lineIndex < lines.length - 1 && <br />}</span>)}</p>;
  })}</div>;
}

export function AssistantCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limited, setLimited] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = sessionStorage.getItem("coopsar-chat"); if (saved) try { setMessages(JSON.parse(saved) as Message[]); } catch { /* Ignore invalid temporary history. */ } }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { sessionStorage.setItem("coopsar-chat", JSON.stringify(messages.slice(-8))); if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  async function ask(text: string) {
    const clean = text.trim();
    if (!clean || loading || limited) return;
    const next = [...messages, { role: "user" as const, content: clean }].slice(-8);
    setMessages(next); setInput(""); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      if (!response.ok) { const data = await response.json(); if (data.error === "session_limit") setLimited(true); else throw new Error(data.error); return; }
      setMessages((current) => [...current, { role: "assistant", content: "" }]);
      const reader = response.body?.getReader(); const decoder = new TextDecoder();
      if (!reader) throw new Error("Respuesta vacía");
      while (true) { const { done, value } = await reader.read(); if (done) break; const chunk = decoder.decode(value, { stream: true }); setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, content: item.content + chunk } : item)); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No pudimos responder."); }
    finally { setLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(input); }
  const summary = messages.map((message) => `${message.role === "user" ? "Socio" : "COOPIA"}: ${message.content}`).join("\n");
  const whatsapp = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hola, necesito ayuda con esta consulta:\n${summary.slice(-1200)}`)}`;

  return (
    <section className="ai-center" id="asistente" aria-labelledby="assistant-title">
      <div className="ai-heading"><span className="eyebrow">Centro de atención inteligente</span><h1 id="assistant-title">Hola, ¿cómo podemos ayudarte?</h1><p>Consultá, realizá trámites o conocé nuestros servicios sin buscar en el menú.</p></div>
      <div className="ai-console">
        <div className="ai-status"><span className="assistant-avatar">✦</span><div><strong>COOPIA</strong><small>Asistente digital de COOPSAR</small></div><i /> <small>Orientación inmediata</small></div>
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 ? <div className="chat-empty"><strong>Escribí lo que necesitás con tus propias palabras.</strong><p>Voy a orientarte usando información oficial de COOPSAR.</p></div> : messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><small>{message.role === "user" ? "Vos" : "COOPIA"}</small>{message.content ? <RichText content={message.content} /> : <p>…</p>}{message.role === "assistant" && message.content && <div className="message-actions"><a href={whatsapp}>Hablar con un operador</a><Link href="/tramites">Ver trámites</Link></div>}</div>)}
          {loading && messages.at(-1)?.role !== "assistant" && <div className="typing"><i /><i /><i /><span>COOPIA está escribiendo</span></div>}
          {limited && <div className="limit-card"><strong>Continuemos por un canal humano</strong><p>Alcanzaste el límite inicial de respuestas de IA. Podés copiar el resumen o enviarlo por WhatsApp.</p><div><button onClick={() => navigator.clipboard.writeText(summary)}>Copiar conversación</button><a href={whatsapp}>Continuar por WhatsApp ↗</a></div></div>}
          {error && <div className="chat-error"><span>{error}</span><button onClick={() => void ask(messages.at(-1)?.content || input)}>Reintentar</button></div>}
          <div ref={endRef} />
        </div>
        {!limited && <><div className="suggestions" aria-label="Consultas sugeridas">{suggestions.map((item) => <button key={item} onClick={() => void ask(item)}>{item}</button>)}</div><form className="chat-input" onSubmit={submit}><label className="sr-only" htmlFor="assistant-query">Tu consulta</label><textarea id="assistant-query" value={input} maxLength={1200} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ej.: Quiero contratar internet en mi barrio…" rows={2} /><button disabled={!input.trim() || loading} aria-label="Enviar consulta">Enviar <span>↑</span></button></form></>}
        <div className="ai-legal"><span>La IA puede cometer errores. No compartas contraseñas, datos bancarios ni información sensible.</span><Link href="/privacidad">Privacidad</Link></div>
      </div>
    </section>
  );
}
