import type { Procedure } from "../../lib/procedures/catalog";

function isOfficialExternalUrl(value: string | undefined) {
  try {
    return Boolean(value && new URL(value).protocol === "https:");
  } catch {
    return false;
  }
}

function usesVirtualOffice(procedure: Procedure) {
  return procedure.id === "payments" || procedure.id === "update_data";
}

export function resolveProcedureHref(procedure: Procedure, virtualOffice: string | undefined) {
  if (usesVirtualOffice(procedure)) {
    return isOfficialExternalUrl(virtualOffice) ? virtualOffice : "/medios-de-pago";
  }

  return procedure.href;
}

export function isExternalProcedureHref(href: string | undefined) {
  return Boolean(href?.startsWith("https://"));
}
