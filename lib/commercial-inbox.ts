export const commercialStatuses = ["new", "contacted", "qualified", "installation_pending", "completed", "lost", "waiting_coverage", "notified", "converted", "closed", "cancelled"] as const;
export type CommercialStatus = (typeof commercialStatuses)[number];

export type CommercialLead = {
  id: string;
  createdAt: string;
  requestType: "installation" | "coverage_validation" | "fiber_waitlist";
  status: CommercialStatus;
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
  street: string | null;
  zone: string;
  coverageStatus: string | null;
  selectedPlan: string | null;
  journeyId: string | null;
  contactConsent: boolean;
  marketingOptIn: boolean;
};

export type FiberDemand = { label: string; count: number; dimension: "street" | "zone" };

const commercialMessage = "Hola, te contactamos desde COOPSAR por tu consulta sobre Internet/Fibra.";

export function isCommercialStatus(value: string): value is CommercialStatus {
  return commercialStatuses.includes(value as CommercialStatus);
}

export function commercialTypeLabel(type: CommercialLead["requestType"]) {
  return type === "fiber_waitlist" ? "Interés en Fibra / lista de espera" : "Solicitud de Internet";
}

export function commercialWhatsAppUrl(phone: string) {
  const number = phone.replace(/\D/g, "");
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(commercialMessage)}` : null;
}

/** Only aggregate groups with two or more leads; individual demand never appears here. */
export function aggregateFiberDemand(rows: Array<Pick<CommercialLead, "street" | "zone">>) {
  const aggregate = (dimension: FiberDemand["dimension"], values: string[]) => {
    const counts = new Map<string, number>();
    values.map((value) => value.trim()).filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].filter(([, count]) => count >= 2).map(([label, count]) => ({ label, count, dimension }));
  };
  return [
    ...aggregate("zone", rows.map((row) => row.zone)),
    ...aggregate("street", rows.map((row) => row.street || "")),
  ].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es-AR"));
}
