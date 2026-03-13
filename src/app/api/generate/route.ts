import { NextResponse, type NextRequest } from "next/server";
import { generateProject, editProject } from "@/lib/builder/generator";
import type { ProjectFile } from "@/types/project";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, projectId, framework = "nextjs", existingFiles } = body as {
      prompt: string;
      projectId?: string;
      framework?: "nextjs" | "react" | "html";
      existingFiles?: ProjectFile[];
    };

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (existingFiles && existingFiles.length > 0) {
      const updatedFiles = await editProject({
        existingFiles,
        editInstruction: prompt,
      });

      return NextResponse.json({
        projectId: projectId ?? crypto.randomUUID(),
        files: updatedFiles,
        previewUrl: `localhost:3000`,
      });
    }

    const result = await generateProject({
      prompt,
      framework,
    });

    return NextResponse.json({
      projectId: result.projectId,
      files: result.files,
      previewUrl: `localhost:3000`,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate project" },
      { status: 500 }
    );
  }
}
