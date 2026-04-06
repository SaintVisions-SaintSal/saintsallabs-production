import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { streamChat } from "@/lib/ai/claude";
import { getModelForTier } from "@/lib/ai/model-router";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { PlanTier } from "@/types/user";

export const runtime = "nodejs";

// Service-role client for reading profile tier
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [], planTier: clientTier } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
      planTier?: PlanTier;
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Try to get real tier from Supabase (via auth token in request)
    let planTier: PlanTier = clientTier || "free";
    try {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("tier")
            .eq("id", user.id)
            .single();
          if (profile?.tier) {
            planTier = profile.tier as PlanTier;
          }
        }
      }
    } catch {
      // Fall back to client-provided tier or free
    }

    const model = getModelForTier(planTier);

    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history,
      { role: "user", content: message },
    ];

    const stream = await streamChat({
      model,
      systemPrompt: CHAT_SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
