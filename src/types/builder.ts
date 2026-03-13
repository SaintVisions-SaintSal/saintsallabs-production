import type { ProjectFile } from "./project";

export interface GenerateRequest {
  prompt: string;
  projectId?: string;
  framework: "nextjs" | "react" | "html";
  existingFiles?: ProjectFile[];
}

export interface GenerateResponse {
  projectId: string;
  files: ProjectFile[];
  previewUrl: string;
}

export interface DeployRequest {
  projectId: string;
}

export interface DeployResponse {
  deploymentUrl: string;
  status: "queued" | "building" | "ready" | "error";
}

export interface BuildStatus {
  phase: "idle" | "generating" | "building" | "deploying" | "complete" | "error";
  message: string;
  progress?: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  language?: string;
}
