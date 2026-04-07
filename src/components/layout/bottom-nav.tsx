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
  { label: "Home", href: "/dashboard", icon: "dashboard" },
  { label: "Builder", href: "/builder", icon: "code" },
  { label: "SAL", href: "/intelligence", icon: "psychology" },
  { label: "Real Est.", href: "/real-estate", icon: "home_work" },
  { label: "Cards", href: "/cookin-cards", icon: "style" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-dark border-t border-slate-800">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                isActive ? "text-primary" : "text-slate-500"
              )}
            >
              <span
                className="material-symbols-outlined text-xl"
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
              <span className="text-[10px] font-display">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
