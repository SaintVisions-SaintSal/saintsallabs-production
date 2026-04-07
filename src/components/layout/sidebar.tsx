"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Builder", href: "/builder", icon: "code" },
  { label: "Intelligence", href: "/intelligence", icon: "psychology" },
  { label: "Real Estate", href: "/real-estate", icon: "home_work" },
  { label: "CookinCards", href: "/cookin-cards", icon: "style" },
  { label: "Deploy", href: "/deploy", icon: "deployed_code" },
  { label: "Launch", href: "/launch", icon: "checklist" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-slate-800 bg-background-dark h-screen sticky top-0">
      <div className="p-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-2xl"
            style={{ filter: "drop-shadow(0 0 8px rgba(245, 159, 10, 0.4))" }}
          >
            hub
          </span>
          <span className="font-display font-bold text-lg text-slate-100">
            SaintSal Labs
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-display transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-xl",
                  isActive && "text-primary"
                )}
                style={
                  isActive
                    ? {
                        filter:
                          "drop-shadow(0 0 8px rgba(245, 159, 10, 0.4))",
                      }
                    : undefined
                }
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Neural Engine Active
        </div>
      </div>
    </aside>
  );
}
