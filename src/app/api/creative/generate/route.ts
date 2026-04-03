import { type NextRequest } from "next/server";
import { withGHLAgent, type GHLAgentRequest } from "@/lib/ghl/agent-middleware";
import { generateCompletion } from "@/lib/ai/claude";
import { SOCIAL_MEDIA_PROMPT } from "@/lib/ai/agent-prompts";

export const runtime = "nodejs";

/**
 * POST /api/creative/generate
 *
 * GHL Agent Studio webhook — Social Media sub-agent.
 * Handles social content creation, captions, hashtags, and strategy.
 *
 * Auth: x-sal-key header
 * Body: { message, contactId?, locationId?, conversationId? }
 * Response: { message }
 */
export async function POST(request: NextRequest) {
  return withGHLAgent(request, async (req: GHLAgentRequest) => {
    const response = await generateCompletion({
      model: "claude-sonnet-4-6",
      systemPrompt: SOCIAL_MEDIA_PROMPT,
      userPrompt: req.message,
      maxTokens: 4096,
    });

    return response;
  });
}
