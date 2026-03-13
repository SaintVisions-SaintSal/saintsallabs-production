import { NextResponse, type NextRequest } from "next/server";
import { deployToVercel } from "@/lib/builder/deployer";
import type { ProjectFile } from "@/types/project";

export const runtime = "nodejs";

// In-memory store for demo purposes — replace with database in production
const projectStore = new Map<string, ProjectFile[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body as { projectId: string };

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.VERCEL_API_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "VERCEL_API_ACCESS_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const files = projectStore.get(projectId);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files found for this project. Generate code first." },
        { status: 404 }
      );
    }

    const result = await deployToVercel({
      projectName: `sal-project-${projectId.slice(0, 8)}`,
      files,
    });

    return NextResponse.json({
      deploymentUrl: result.deploymentUrl,
      status: result.status,
      deploymentId: result.deploymentId,
    });
  } catch (error) {
    console.error("Deploy API error:", error);
    return NextResponse.json(
      { error: "Deployment failed" },
      { status: 500 }
    );
  }
}
