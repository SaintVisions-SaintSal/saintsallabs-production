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

type RouteContext = { params: { id: string } };

/**
 * GET /api/builder/projects/[id]
 * Fetch a single project by ID. Only accessible by the owning user.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("id, title, description, framework, files, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error(`[GET /api/builder/projects/${params.id}] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/builder/projects/[id]
 * Update a project's title and/or files. Only accessible by the owning user.
 * Body: { title?: string; files?: ProjectFile[] }
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, files } = body as {
      title?: string;
      description?: string;
      files?: unknown[];
    };

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return NextResponse.json({ error: "Title must be a non-empty string" }, { status: 400 });
    }

    if (files !== undefined && !Array.isArray(files)) {
      return NextResponse.json({ error: "Files must be an array" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim() || null;
    if (files !== undefined) updates.files = files;

    const supabase = createAdminClient();

    // Verify ownership before updating
    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: project, error: updateError } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select("id, title, description, framework, files, created_at, updated_at")
      .single();

    if (updateError || !project) {
      console.error(`[PUT /api/builder/projects/${id}] Supabase error:`, updateError);
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error(`[PUT /api/builder/projects/${params.id}] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/builder/projects/[id]
 * Delete a project. Only accessible by the owning user.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(`[DELETE /api/builder/projects/${id}] Supabase error:`, deleteError);
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/builder/projects/${params.id}] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
