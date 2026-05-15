import type { SupportRole, SupportRoleBoundary } from "../types";

export function deriveRoleBoundaries(role: SupportRole): SupportRoleBoundary {
  const summaries: Record<SupportRole, string> = {
    partner: "Support can stay collaborative without turning into constant health oversight.",
    "family-member": "Shared context can stay practical and brief without opening every emotional detail.",
    caregiver: "Care support can stay informed without becoming supervisory or real-time.",
    "trusted-friend": "A trusted friend can receive gentle context without needing ongoing medical detail.",
  };

  return {
    role,
    avoidRealTimeVisibility: true,
    avoidEmotionalDetail: true,
    preserveAutonomyLanguage: true,
    summary: summaries[role],
  };
}
