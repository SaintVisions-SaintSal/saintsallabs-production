import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = createAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/builder/projects
 * List all projects for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, title, description, framework, files, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[GET /api/builder/projects] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: projects ?? [] });
  } catch (err) {
    console.error("[GET /api/builder/projects] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/builder/projects
 * Save a new project for the authenticated user.
 * Body: { title: string; description?: string; framework?: string; files: ProjectFile[] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, framework = "nextjs", files } = body as {
      title: string;
      description?: string;
      framework?: string;
      files: unknown[];
    };

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(files)) {
      return NextResponse.json(
        { error: "Files must be an array" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() ?? null,
        framework,
        files,
      })
      .select("id, title, description, framework, files, created_at, updated_at")
      .single();

    if (error) {
      console.error("[POST /api/builder/projects] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/builder/projects] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
