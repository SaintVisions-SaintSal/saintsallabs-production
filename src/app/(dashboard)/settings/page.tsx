"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("SaintVision User");
  const [email, setEmail] = useState("user@saintvision.tech");

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
                          fallback={displayName}
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
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button size="sm">Save Changes</Button>
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
                            Pro Plan
                          </span>
                          <Badge variant="amber">Active</Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          100,000 credits/month &bull; SAL Pro (Sonnet)
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Upgrade
                      </Button>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400 font-display mb-1">
                        <span>Credits Used</span>
                        <span>7 / 100,000</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: "0.007%" }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
