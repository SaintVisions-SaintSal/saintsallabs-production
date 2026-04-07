"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import type { ProjectFile } from "@/types/project";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SavedProject {
  id: string;
  title: string;
  description: string | null;
  framework: string;
  files: ProjectFile[];
  created_at: string;
  updated_at: string;
}

interface Props {
  /** Called when the user loads a project. Receives the project files and title. */
  onLoadProject: (files: ProjectFile[], title: string) => void;
  /** The files currently in the builder — used when saving. */
  currentFiles?: ProjectFile[];
  /** Current project title (optional) — pre-fills the save dialog. */
  currentTitle?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function frameworkLabel(framework: string): string {
  const map: Record<string, string> = {
    nextjs: "Next.js",
    react: "React",
    html: "HTML",
  };
  return map[framework] ?? framework;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectsPanel({
  onLoadProject,
  currentFiles = [],
  currentTitle = "",
}: Props) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active project (last loaded)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const res = await fetch("/api/builder/projects", { headers });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to load projects");
      }

      const json = await res.json();
      setProjects(json.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  function handleNewProject() {
    setActiveProjectId(null);
    onLoadProject([], "New Project");
  }

  function handleLoadProject(project: SavedProject) {
    setActiveProjectId(project.id);
    onLoadProject(project.files ?? [], project.title);
  }

  function openSaveDialog() {
    setSaveTitle(currentTitle || "");
    setSaveDescription("");
    setSaveError(null);
    setSaveDialogOpen(true);
  }

  async function handleSave() {
    const trimmedTitle = saveTitle.trim();
    if (!trimmedTitle) {
      setSaveError("Project title is required.");
      return;
    }

    if (currentFiles.length === 0) {
      setSaveError("No files to save. Generate some code first.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const headers = await getAuthHeader();

      // If there's an active project, update it; otherwise create a new one.
      if (activeProjectId) {
        const res = await fetch(`/api/builder/projects/${activeProjectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            title: trimmedTitle,
            description: saveDescription.trim() || null,
            files: currentFiles,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Failed to update project");
        }

        const json = await res.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === activeProjectId ? json.project : p))
        );
      } else {
        const res = await fetch("/api/builder/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            title: trimmedTitle,
            description: saveDescription.trim() || null,
            framework: "nextjs",
            files: currentFiles,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Failed to save project");
        }

        const json = await res.json();
        setProjects((prev) => [json.project, ...prev]);
        setActiveProjectId(json.project.id);
      }

      setSaveDialogOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(projectId);

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/builder/projects/${projectId}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error("Delete failed:", json.error);
        return;
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-700/50 shrink-0">
        <span className="text-sm font-display font-medium text-slate-200">
          Projects
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={openSaveDialog}
            title="Save current project"
            className="text-slate-400 hover:text-slate-100"
          >
            <SaveIcon />
            <span className="sr-only">Save</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewProject}
            title="New project"
            className="text-slate-400 hover:text-slate-100"
          >
            <PlusIcon />
            <span className="sr-only">New</span>
          </Button>
        </div>
      </div>

      {/* New Project shortcut */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewProject}
          className="w-full text-xs border-slate-700/50 text-slate-300 hover:text-slate-100 hover:border-slate-600"
        >
          <PlusIcon />
          New Project
        </Button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-slate-500">Loading projects…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-xs text-red-400">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchProjects}
              className="text-xs text-slate-400 hover:text-slate-100"
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <FolderIcon />
            </div>
            <p className="text-sm text-slate-400 font-display">
              No saved projects.
            </p>
            <p className="text-xs text-slate-500 mt-1">Build something.</p>
          </div>
        )}

        {!loading &&
          !error &&
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isDeleting = deletingId === project.id;

            return (
              <Card
                key={project.id}
                onClick={() => handleLoadProject(project)}
                className={[
                  "cursor-pointer transition-colors group",
                  isActive
                    ? "border-primary/40 bg-primary/5"
                    : "border-slate-700/50 hover:border-slate-600",
                ].join(" ")}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 font-display truncate">
                        {project.title}
                      </p>
                      {project.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      disabled={isDeleting}
                      title="Delete project"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 focus:opacity-100 shrink-0 mt-0.5 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? <SpinnerIcon /> : <TrashIcon />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="slate" className="text-xs">
                      {frameworkLabel(project.framework)}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {Array.isArray(project.files) ? project.files.length : 0}{" "}
                      {Array.isArray(project.files) && project.files.length === 1
                        ? "file"
                        : "files"}
                    </span>
                    <span className="text-xs text-slate-600 ml-auto">
                      {formatDate(project.updated_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent onClose={() => setSaveDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {activeProjectId ? "Update Project" : "Save Project"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="project-title"
                  className="text-xs font-medium text-slate-400 font-display"
                >
                  Title
                </label>
                <Input
                  id="project-title"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="My Awesome Project"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="project-description"
                  className="text-xs font-medium text-slate-400 font-display"
                >
                  Description{" "}
                  <span className="text-slate-600 font-normal">
                    (optional)
                  </span>
                </label>
                <Input
                  id="project-description"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="A short description…"
                />
              </div>

              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSaveDialogOpen(false)}
                  disabled={saving}
                  className="text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !saveTitle.trim()}
                >
                  {saving ? "Saving…" : activeProjectId ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons (avoids any icon library dependency)
// ---------------------------------------------------------------------------

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-600"
      aria-hidden="true"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin text-slate-500"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
