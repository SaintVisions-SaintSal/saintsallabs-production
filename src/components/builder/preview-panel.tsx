"use client";

import { useMemo } from "react";
import type { ProjectFile } from "@/types/project";
import { createSandboxHtml } from "@/lib/builder/sandbox";

interface PreviewPanelProps {
  files: ProjectFile[];
  isBuilding: boolean;
  previewUrl?: string;
}

export function PreviewPanel({ files, isBuilding, previewUrl }: PreviewPanelProps) {
  const sandboxHtml = useMemo(() => {
    if (files.length === 0) return null;
    return createSandboxHtml(files);
  }, [files]);

  const iframeSrc = useMemo(() => {
    if (!sandboxHtml) return undefined;
    return `data:text/html;charset=utf-8,${encodeURIComponent(sandboxHtml)}`;
  }, [sandboxHtml]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-800 shrink-0">
        <span className="material-symbols-outlined text-primary text-lg">
          preview
        </span>
        <span className="text-sm font-display font-medium text-slate-200">
          Preview
        </span>
      </div>

      {/* URL Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex-1 bg-slate-800/50 rounded px-3 py-1 text-xs text-slate-400 font-mono">
          {previewUrl || "localhost:3000"}
        </div>
        <button className="text-slate-500 hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

      {/* Preview content */}
      <div className="flex-1 bg-slate-900 overflow-hidden">
        {isBuilding ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">
                  progress_activity
                </span>
              </div>
              <p className="text-sm text-slate-400 font-display">Building preview...</p>
              <p className="text-xs text-slate-500 mt-1">This may take a moment</p>
            </div>
          </div>
        ) : iframeSrc ? (
          <iframe
            src={iframeSrc}
            title="Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="material-symbols-outlined text-slate-700 text-4xl">
                web
              </span>
              <p className="text-xs text-slate-500 font-display mt-2">
                Preview will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
