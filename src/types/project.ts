export interface Project {
  id: string;
  name: string;
  description: string;
  framework: "nextjs" | "react" | "html";
  files: ProjectFile[];
  deployUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  lastEditedBy: "ai" | "user";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  generationId?: string;
}

export interface BuilderSession {
  projectId: string;
  chatHistory: ChatMessage[];
  currentFiles: ProjectFile[];
}
