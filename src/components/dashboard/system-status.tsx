"use client";

export function SystemStatus() {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card-dark border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-display text-slate-300">
          GPU Clusters Online
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-emerald-400 text-sm">
            speed
          </span>
          <span className="text-xs text-slate-400 font-display">
            99.9% Uptime
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-sm">
            memory
          </span>
          <span className="text-xs text-slate-400 font-display">
            8 Clusters
          </span>
        </div>
      </div>
    </div>
  );
}
