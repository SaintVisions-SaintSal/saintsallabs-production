"use client";

import { IntelligenceGrid } from "@/components/dashboard/intelligence-grid";
import { SystemStatus } from "@/components/dashboard/system-status";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <IntelligenceGrid />

      <SystemStatus />

      {/* Floating action button */}
      <Link
        href="/intelligence"
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-black shadow-lg hover:bg-primary/90 transition-colors"
        style={{ boxShadow: "0 0 20px rgba(245, 159, 10, 0.3)" }}
      >
        <span className="material-symbols-outlined text-2xl">chat_bubble</span>
      </Link>
    </div>
  );
}
