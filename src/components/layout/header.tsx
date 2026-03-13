"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatCredits } from "@/lib/utils";

interface HeaderProps {
  credits?: number;
  userName?: string;
  avatarUrl?: string | null;
}

export function Header({
  credits = 999993,
  userName = "User",
  avatarUrl,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-slate-800 bg-background-dark/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ filter: "drop-shadow(0 0 8px rgba(245, 159, 10, 0.4))" }}
          >
            hub
          </span>
          <span className="font-display font-bold text-sm text-slate-100">
            SaintSal Labs
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-display">
            NEURAL ENGINE ACTIVE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="amber">{formatCredits(credits)} Credits</Badge>

        <button className="relative p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
          <span className="material-symbols-outlined text-xl">
            notifications
          </span>
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        <Avatar src={avatarUrl} fallback={userName} size="sm" />
      </div>
    </header>
  );
}
