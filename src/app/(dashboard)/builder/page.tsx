"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "@/components/builder/chat-panel";
import { CodeEditor } from "@/components/builder/code-editor";
import { PreviewPanel } from "@/components/builder/preview-panel";
import { DeployBar } from "@/components/builder/deploy-bar";
import type { ChatMessage, ProjectFile } from "@/types/project";
import type { BuildStatus } from "@/types/builder";
import { generateId } from "@/lib/utils";

export default function BuilderPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    phase: "idle",
    message: "Ready",
  });

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setBuildStatus({ phase: "generating", message: "Generating code..." });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            framework: "nextjs",
            existingFiles: files.length > 0 ? files : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Generation failed");
        }

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `Generated ${data.files.length} file${data.files.length !== 1 ? "s" : ""}. Check the editor to review the code.`,
          timestamp: new Date().toISOString(),
          generationId: data.projectId,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setFiles(data.files);

        if (data.files.length > 0) {
          setSelectedPath(data.files[0].path);
        }

        setBuildStatus({ phase: "complete", message: "Generation complete" });
      } catch {
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content:
            "Sorry, there was an error generating the code. Please check your API key configuration and try again.",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setBuildStatus({ phase: "error", message: "Generation failed" });
      } finally {
        setIsGenerating(false);
      }
    },
    [files]
  );

  const handleUpdateFile = useCallback((path: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.path === path ? { ...f, content, lastEditedBy: "user" as const } : f
      )
    );
  }, []);

  const handleRun = useCallback(() => {
    setBuildStatus({ phase: "building", message: "Building preview..." });
    setTimeout(() => {
      setBuildStatus({ phase: "complete", message: "Preview ready" });
    }, 1500);
  }, []);

  const handleDeploy = useCallback(async () => {
    setBuildStatus({ phase: "deploying", message: "Deploying to Vercel..." });

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "current" }),
      });

      if (!response.ok) throw new Error("Deploy failed");

      const data = await response.json();
      setBuildStatus({
        phase: "complete",
        message: `Deployed: ${data.deploymentUrl}`,
      });
    } catch {
      setBuildStatus({ phase: "error", message: "Deployment failed" });
    }
  }, []);

  const handleExport = useCallback(() => {
    const exportData = JSON.stringify({ files }, null, 2);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-5.5rem)]">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat Panel */}
        <div className="w-full lg:w-80 h-64 lg:h-full shrink-0">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </div>

        {/* Code Editor */}
        <div className="flex-1 h-64 lg:h-full min-w-0">
          <CodeEditor
            files={files}
            selectedPath={selectedPath}
            onSelectFile={setSelectedPath}
            onUpdateFile={handleUpdateFile}
          />
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-96 h-64 lg:h-full shrink-0">
          <PreviewPanel
            files={files}
            isBuilding={buildStatus.phase === "building"}
          />
        </div>
      </div>

      <DeployBar
        buildStatus={buildStatus}
        onRun={handleRun}
        onDeploy={handleDeploy}
        onExport={handleExport}
        hasFiles={files.length > 0}
      />
    </div>
  );
}
