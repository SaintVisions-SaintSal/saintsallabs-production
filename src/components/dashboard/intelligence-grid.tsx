"use client";

import { Card } from "@/components/ui/card";

interface SuiteCard {
  title: string;
  subtitle: string;
  icon: string;
  isAddNew?: boolean;
}

const suites: SuiteCard[] = [
  {
    title: "Search Intelligence",
    subtitle: "Web search, research, and data extraction",
    icon: "travel_explore",
  },
  {
    title: "Finance Intelligence",
    subtitle: "Market analysis, trading, and portfolio management",
    icon: "candlestick_chart",
  },
  {
    title: "Tech Intelligence",
    subtitle: "Code generation, debugging, and DevOps",
    icon: "terminal",
  },
  {
    title: "Medical Intelligence",
    subtitle: "Clinical research and health analytics",
    icon: "medical_services",
  },
  {
    title: "Real Estate Intelligence",
    subtitle: "Property analysis, valuation, and market trends",
    icon: "domain",
  },
  {
    title: "Add New Suite",
    subtitle: "Create a custom intelligence suite",
    icon: "add",
    isAddNew: true,
  },
];

export function IntelligenceGrid() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold font-display text-slate-100">
          Intelligence Suites
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Select a suite to access specialized AI capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {suites.map((suite) => (
          <Card
            key={suite.title}
            className="p-4 cursor-pointer group hover:border-primary/40 transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  suite.isAddNew
                    ? "bg-slate-800 border border-dashed border-slate-600 group-hover:border-primary/40"
                    : "bg-primary/10"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${
                    suite.isAddNew
                      ? "text-slate-400 group-hover:text-primary"
                      : "text-primary"
                  }`}
                  style={
                    !suite.isAddNew
                      ? {
                          filter:
                            "drop-shadow(0 0 8px rgba(245, 159, 10, 0.4))",
                        }
                      : undefined
                  }
                >
                  {suite.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-100 font-display">
                  {suite.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{suite.subtitle}</p>
              </div>
              {!suite.isAddNew && (
                <span className="material-symbols-outlined text-slate-600 text-lg group-hover:text-slate-400 transition-colors">
                  chevron_right
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
