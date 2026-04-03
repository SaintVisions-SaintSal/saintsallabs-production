export type PlanTier = "free" | "starter" | "pro" | "teams" | "enterprise";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  planTier: PlanTier;
  credits: number;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  company?: string;
  website?: string;
  apiKeys: ApiKeyEntry[];
}

export interface ApiKeyEntry {
  provider: string;
  keyHint: string;
  addedAt: string;
}
