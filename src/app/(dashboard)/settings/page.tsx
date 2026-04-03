"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { PLANS, PAYMENT_LINKS, PRICING_TABLE_ID } from "@/lib/stripe/client";
import type { PlanTier } from "@/types/user";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  tier: PlanTier;
  role: string;
  credits_remaining: number;
  credits_monthly_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ghl_contact_id: string | null;
  ghl_provisioned: boolean;
}

const TIER_BADGE_VARIANT: Record<string, "amber" | "default"> = {
  free: "default",
  starter: "amber",
  pro: "amber",
  teams: "amber",
  enterprise: "amber",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, email, full_name, tier, role, credits_remaining, credits_monthly_limit, stripe_customer_id, stripe_subscription_id, ghl_contact_id, ghl_provisioned"
          )
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data as ProfileData);
          setDisplayName(data.full_name || "");
          setEmail(data.email || user.email || "");
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      setProfile({ ...profile, full_name: displayName });
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleManageBilling() {
    if (!profile?.stripe_customer_id) return;
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Failed to open billing portal:", err);
    }
  }

  function handleUpgrade(targetTier: PlanTier) {
    const link = PAYMENT_LINKS[targetTier];
    if (link) {
      window.open(link, "_blank");
    }
  }

  // Determine the current plan from PLANS
  const currentPlan = profile
    ? PLANS[profile.tier as keyof typeof PLANS]
    : PLANS.free;
  const creditsUsed = profile
    ? profile.credits_monthly_limit - profile.credits_remaining
    : 0;
  const creditsPercent = profile
    ? Math.min(
        (creditsUsed / Math.max(profile.credits_monthly_limit, 1)) * 100,
        100
      )
    : 0;

  // Get next tier for upgrade CTA
  const tierOrder: PlanTier[] = [
    "free",
    "starter",
    "pro",
    "teams",
    "enterprise",
  ];
  const currentTierIndex = profile
    ? tierOrder.indexOf(profile.tier)
    : 0;
  const nextTier =
    currentTierIndex < tierOrder.length - 1
      ? tierOrder[currentTierIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="h-64 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-slate-100">
          Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your profile, billing, and API keys
        </p>
      </div>

      <Tabs
        tabs={[
          {
            id: "profile",
            label: "Profile",
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          fallback={displayName || email}
                          size="lg"
                        />
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 font-display mb-1 block">
                            Display Name
                          </label>
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-display mb-1 block">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={email}
                            disabled
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            id: "billing",
            label: "Billing",
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold font-display text-slate-100">
                            {currentPlan.name} Plan
                          </span>
                          <Badge
                            variant={
                              TIER_BADGE_VARIANT[
                                profile?.tier || "free"
                              ] || "default"
                            }
                          >
                            {profile?.stripe_subscription_id
                              ? "Active"
                              : "Free"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          {currentPlan.credits.toLocaleString()} credits/month
                          &bull; ${currentPlan.price.monthly}/mo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {nextTier && (
                          <Button
                            size="sm"
                            onClick={() => handleUpgrade(nextTier)}
                          >
                            Upgrade to{" "}
                            {
                              PLANS[nextTier as keyof typeof PLANS]
                                .name
                            }
                          </Button>
                        )}
                        {profile?.stripe_subscription_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManageBilling}
                          >
                            Manage Billing
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400 font-display mb-1">
                        <span>Credits Used</span>
                        <span>
                          {creditsUsed.toLocaleString()} /{" "}
                          {(
                            profile?.credits_monthly_limit || 50
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${creditsPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Feature list */}
                    <div className="mt-6">
                      <h4 className="text-sm font-display text-slate-300 mb-3">
                        Plan Features
                      </h4>
                      <ul className="space-y-2">
                        {currentPlan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-slate-400"
                          >
                            <span className="material-symbols-outlined text-sm text-green-400">
                              check_circle
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Comparison */}
                {profile?.tier !== "enterprise" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Upgrade Your Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tierOrder
                          .filter(
                            (t) =>
                              tierOrder.indexOf(t) >
                              currentTierIndex
                          )
                          .slice(0, 3)
                          .map((t) => {
                            const plan =
                              PLANS[t as keyof typeof PLANS];
                            return (
                              <div
                                key={t}
                                className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50"
                              >
                                <h5 className="font-bold font-display text-slate-100">
                                  {plan.name}
                                </h5>
                                <p className="text-2xl font-bold text-primary mt-1">
                                  ${plan.price.monthly}
                                  <span className="text-xs text-slate-400 font-normal">
                                    /mo
                                  </span>
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {plan.credits.toLocaleString()}{" "}
                                  credits/month
                                </p>
                                <Button
                                  size="sm"
                                  className="w-full mt-3"
                                  onClick={() =>
                                    handleUpgrade(t)
                                  }
                                >
                                  Upgrade
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ),
          },
          {
            id: "api-keys",
            label: "API Keys",
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your API Keys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div>
                          <p className="text-sm font-display text-slate-200">
                            Production Key
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            sal_prod_••••••••••••
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined text-sm">
                              content_copy
                            </span>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined text-sm text-red-400">
                              delete
                            </span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div>
                          <p className="text-sm font-display text-slate-200">
                            Development Key
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            sal_dev_••••••••••••
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined text-sm">
                              content_copy
                            </span>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined text-sm text-red-400">
                              delete
                            </span>
                          </Button>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <span className="material-symbols-outlined text-sm">
                          add
                        </span>
                        Generate New Key
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
