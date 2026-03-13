"use client";

import { Button } from "@/components/ui/button";
import type { BuildStatus } from "@/types/builder";

interface DeployBarProps {
  buildStatus: BuildStatus;
  onRun: () => void;
  onDeploy: () => void;
  onExport: () => void;
  hasFiles: boolean;
}

export function DeployBar({
  buildStatus,
  onRun,
  onDeploy,
  onExport,
  hasFiles,
}: DeployBarProps) {
  const statusColors: Record<BuildStatus["phase"], string> = {
    idle: "bg-slate-500",
    generating: "bg-primary animate-pulse",
    building: "bg-blue-500 animate-pulse",
    deploying: "bg-purple-500 animate-pulse",
    complete: "bg-emerald-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center justify-between px-4 h-12 border-t border-slate-800 bg-card-dark/50 shrink-0">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${statusColors[buildStatus.phase]}`}
        />
        <span className="text-xs text-slate-400 font-display">
          {buildStatus.message}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onExport}
          disabled={!hasFiles}
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export
        </Button>
        <Button
          size="sm"
          onClick={onRun}
          disabled={!hasFiles || buildStatus.phase === "generating"}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          Run
        </Button>
        <Button
          size="sm"
          onClick={onDeploy}
          disabled={!hasFiles || buildStatus.phase !== "idle" && buildStatus.phase !== "complete"}
        >
          <span className="material-symbols-outlined text-sm">
            rocket_launch
          </span>
          Deploy
        </Button>
      </div>
    </div>
  );
}
