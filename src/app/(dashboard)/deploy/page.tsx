"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";

export default function DeployPage() {
  const [activeTarget, setActiveTarget] = useState("vercel");

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-slate-100">
          Deploy &amp; Infrastructure
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage deployments, integrations, and API stitching
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-xs text-slate-400 font-display mb-1">
            Current Status
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-400 font-display">
              Healthy
            </span>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-slate-400 font-display mb-1">
            Active Environment
          </div>
          <div className="text-sm font-semibold text-slate-100 font-display">
            Production
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-slate-400 font-display mb-1">
            API Latency
          </div>
          <div className="text-sm font-semibold text-primary font-display">
            42ms
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-slate-400 font-display mb-1">
            Last Deploy
          </div>
          <div className="text-sm font-semibold text-slate-100 font-display">
            2h ago
          </div>
        </Card>
      </div>

      {/* Deploy Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Deploy Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            tabs={[
              {
                id: "vercel",
                label: "Vercel (Primary)",
                content: (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-300">
                          cloud
                        </span>
                        <div>
                          <p className="text-sm font-display text-slate-200">
                            Vercel
                          </p>
                          <p className="text-xs text-slate-400">
                            Production deployment
                          </p>
                        </div>
                      </div>
                      <Badge variant="green">Connected</Badge>
                    </div>
                    <Button size="sm">
                      <span className="material-symbols-outlined text-sm">
                        rocket_launch
                      </span>
                      Deploy to Vercel
                    </Button>
                  </div>
                ),
              },
              {
                id: "render",
                label: "Render (WS/Paid)",
                content: (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-300">
                          dns
                        </span>
                        <div>
                          <p className="text-sm font-display text-slate-200">
                            Render
                          </p>
                          <p className="text-xs text-slate-400">
                            WebSocket &amp; paid services
                          </p>
                        </div>
                      </div>
                      <Badge variant="amber">Configure</Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      <span className="material-symbols-outlined text-sm">
                        link
                      </span>
                      Connect Render
                    </Button>
                  </div>
                ),
              },
            ]}
            onChange={setActiveTarget}
          />
        </CardContent>
      </Card>

      {/* GitHub Integration */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-300">
                code
              </span>
              <div>
                <p className="text-sm font-display text-slate-200">
                  saintvision/saintsallabs-production
                </p>
                <p className="text-xs text-slate-400">Auto-deploy on push to main</p>
              </div>
            </div>
            <Badge variant="green">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Stitching */}
      <Card>
        <CardHeader>
          <CardTitle>API Stitching</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Claude (Anthropic)", key: "ANTHROPIC_API_KEY", connected: true },
              { name: "Grok (xAI)", key: "XAI_API_KEY", connected: false },
              { name: "ElevenLabs", key: "ELEVENLABS_API_KEY", connected: true },
              { name: "Google Stitch", key: "GEMINI_API_KEY", connected: false },
            ].map((api) => (
              <div
                key={api.key}
                className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-display text-slate-200">
                    {api.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{api.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    className="w-40 h-8 text-xs"
                    defaultValue={api.connected ? "••••••••" : ""}
                  />
                  <Badge variant={api.connected ? "green" : "slate"}>
                    {api.connected ? "Active" : "Set"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain Management */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                language
              </span>
              <div>
                <p className="text-sm font-display text-slate-200">
                  app.saintsal.build
                </p>
                <p className="text-xs text-slate-400">SSL Active &bull; CDN Enabled</p>
              </div>
            </div>
            <Badge variant="green">ACTIVE</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
