"use client";

import { FileTree } from "./file-tree";
import type { ProjectFile } from "@/types/project";

interface CodeEditorProps {
  files: ProjectFile[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onUpdateFile: (path: string, content: string) => void;
}

export function CodeEditor({
  files,
  selectedPath,
  onSelectFile,
  onUpdateFile,
}: CodeEditorProps) {
  const selectedFile = files.find((f) => f.path === selectedPath);

  return (
    <div className="flex flex-col h-full border-r border-slate-800">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-800 shrink-0">
        <span className="material-symbols-outlined text-primary text-lg">
          code
        </span>
        <span className="text-sm font-display font-medium text-slate-200">
          Editor
        </span>
        {selectedPath && (
          <span className="text-xs text-slate-500 font-display ml-2">
            {selectedPath}
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File tree */}
        <div className="w-48 border-r border-slate-800 overflow-y-auto shrink-0">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-display font-medium">
            Explorer
          </div>
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        </div>

        {/* Code area */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            <div className="relative h-full">
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[10px] text-slate-500 font-display bg-card-dark px-2 py-0.5 rounded border border-slate-800">
                  {selectedFile.language}
                </span>
              </div>
              <textarea
                value={selectedFile.content}
                onChange={(e) =>
                  onUpdateFile(selectedFile.path, e.target.value)
                }
                className="w-full h-full bg-transparent text-slate-300 text-xs font-mono p-4 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="material-symbols-outlined text-slate-700 text-4xl">
                  code_off
                </span>
                <p className="text-xs text-slate-500 font-display mt-2">
                  Select a file to edit
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
