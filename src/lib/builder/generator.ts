import { generateCompletion } from "@/lib/ai/claude";
import { getModelForTier } from "@/lib/ai/model-router";
import { BUILDER_SYSTEM_PROMPT, BUILDER_EDIT_PROMPT } from "@/lib/ai/prompts";
import type { ProjectFile } from "@/types/project";
import type { PlanTier } from "@/types/user";
import { generateId } from "@/lib/utils";

export interface GenerateResult {
  projectId: string;
  files: ProjectFile[];
}

export async function generateProject({
  prompt,
  framework,
  planTier = "pro",
}: {
  prompt: string;
  framework: "nextjs" | "react" | "html";
  planTier?: PlanTier;
}): Promise<GenerateResult> {
  const model = getModelForTier(planTier);

  const userPrompt = `Generate a ${framework} project based on this description:\n\n${prompt}\n\nFramework: ${framework}`;

  const rawResponse = await generateCompletion({
    model,
    systemPrompt: BUILDER_SYSTEM_PROMPT,
    userPrompt,
  });

  const parsed = JSON.parse(rawResponse);

  const files: ProjectFile[] = parsed.files.map(
    (f: { path: string; content: string; language: string }) => ({
      path: f.path,
      content: f.content,
      language: f.language,
      lastEditedBy: "ai" as const,
    })
  );

  return {
    projectId: generateId(),
    files,
  };
}

export async function editProject({
  existingFiles,
  editInstruction,
  planTier = "pro",
}: {
  existingFiles: ProjectFile[];
  editInstruction: string;
  planTier?: PlanTier;
}): Promise<ProjectFile[]> {
  const model = getModelForTier(planTier);

  const filesDescription = existingFiles
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  const userPrompt = `Here are the current project files:\n\n${filesDescription}\n\nEdit instruction: ${editInstruction}`;

  const rawResponse = await generateCompletion({
    model,
    systemPrompt: BUILDER_EDIT_PROMPT,
    userPrompt,
    maxTokens: 8192,
  });

  const parsed = JSON.parse(rawResponse);

  return parsed.files.map(
    (f: { path: string; content: string; language: string }) => ({
      path: f.path,
      content: f.content,
      language: f.language,
      lastEditedBy: "ai" as const,
    })
  );
}
