import { proposalRiskLevel, type EditorialEntityType } from "./proposals";

export type StoredEditorialRisk = {
  id: string;
  entity_type: EditorialEntityType;
  entity_id: string;
  risk_level: string;
  validation_flags: string[];
};

export function editorialRiskRecalculation(proposals: StoredEditorialRisk[], historicalKeys: Set<string>) {
  const changes = proposals.flatMap((proposal) => {
    if (!historicalKeys.has(`${proposal.entity_type}:${proposal.entity_id}`)) return [];
    const riskLevel = proposalRiskLevel(proposal.entity_type, proposal.validation_flags);
    return proposal.risk_level === riskLevel ? [] : [{ id: proposal.id, riskLevel }];
  });
  const scanned = proposals.filter((proposal) => historicalKeys.has(`${proposal.entity_type}:${proposal.entity_id}`)).length;
  return { scanned, changed: changes.length, unchanged: scanned - changes.length, changes };
}
