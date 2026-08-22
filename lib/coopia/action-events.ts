import type { AssistantAction } from "../ai/results";

/** A click always records one generic action plus, when useful, one domain event. */
export function coopiaActionEventTypes(action: AssistantAction) {
  const domainEvent = action === "OPEN_VIRTUAL_OFFICE" ? "payment_portal_opened"
    : action === "OPEN_COMPLAINT_WHATSAPP" ? "complaint_whatsapp_opened"
      : action === "OPEN_WHATSAPP" ? "whatsapp_opened"
        : null;
  return domainEvent ? ["coopia_action_clicked", domainEvent] as const : ["coopia_action_clicked"] as const;
}
