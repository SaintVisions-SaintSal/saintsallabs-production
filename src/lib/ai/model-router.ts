import type { PlanTier } from "@/types/user";

export type SalTier = "mini" | "pro" | "max" | "max-fast";

const MODEL_MAP: Record<SalTier, string> = {
  mini: "claude-haiku-4-5-20251001",
  pro: "claude-sonnet-4-6",
  max: "claude-opus-4-6",
  "max-fast": "claude-opus-4-6",
};

const TIER_TO_SAL: Record<PlanTier, SalTier> = {
  free: "mini",
  starter: "pro",
  pro: "max",
  teams: "max-fast",
  enterprise: "max-fast",
};

export function getModelForTier(planTier: PlanTier): string {
  const salTier = TIER_TO_SAL[planTier];
  return MODEL_MAP[salTier];
}

export function getSalTier(planTier: PlanTier): SalTier {
  return TIER_TO_SAL[planTier];
}

export function getModelId(salTier: SalTier): string {
  return MODEL_MAP[salTier];
}

export function getSalTierLabel(salTier: SalTier): string {
  const labels: Record<SalTier, string> = {
    mini: "SAL Mini",
    pro: "SAL Pro",
    max: "SAL Max",
    "max-fast": "SAL Max Pro",
  };
  return labels[salTier];
}
