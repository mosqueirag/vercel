"use client";

import { CoopiaConversation } from "./coopia-conversation";

export function AssistantCenter() {
  return <section className="ai-center ai-center-home" id="asistente" aria-label="COOPIA"><div className="ai-console"><CoopiaConversation home /></div></section>;
}
