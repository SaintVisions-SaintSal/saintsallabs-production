"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FileTreeNode } from "@/types/builder";
import type { ProjectFile } from "@/types/project";

interface FileTreeProps {
  files: ProjectFile[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

function buildTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const dirs = new Map<string, FileTreeNode>();

  for (const file of files) {
    const parts = file.path.split("/");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (i === parts.length - 1) {
        const node: FileTreeNode = {
          name: part,
          path: file.path,
          type: "file",
          language: file.language,
        };
        const parent = dirs.get(parentPath);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          root.push(node);
        }
      } else if (!dirs.has(currentPath)) {
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          type: "directory",
          children: [],
        };
        dirs.set(currentPath, node);
        const parent = dirs.get(parentPath);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          root.push(node);
        }
      }
    }
  }

  return root;
}

function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelectFile,
}: {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = node.path === selectedPath;

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="material-symbols-outlined text-sm">
            {expanded ? "expand_more" : "chevron_right"}
          </span>
          <span className="material-symbols-outlined text-sm text-primary/70">
            folder
          </span>
          <span className="font-display">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={cn(
        "flex items-center gap-1 w-full px-2 py-1 text-xs transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <span className="material-symbols-outlined text-sm text-slate-500">
        description
      </span>
      <span className="font-display">{node.name}</span>
    </button>
  );
}

export function FileTree({ files, selectedPath, onSelectFile }: FileTreeProps) {
  const tree = buildTree(files);

  return (
    <div className="overflow-y-auto">
      {tree.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 font-display">
            No files generated yet
          </p>
        </div>
      ) : (
        tree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        ))
      )}
    </div>
  );
}
