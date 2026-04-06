import { type NextRequest } from "next/server";
import { withGHLAgent, OPTIONS, type GHLAgentRequest } from "@/lib/ghl/agent-middleware";
import { generateCompletion } from "@/lib/ai/claude";
import { PLATFORM_ENGINEERING_PROMPT } from "@/lib/ai/agent-prompts";

export const runtime = "nodejs";

/**
 * POST /api/builder/agent
 *
 * GHL Agent Studio webhook — Platform Engineering sub-agent.
 * Handles technical questions about web/mobile development,
 * architecture, and the SaintSalLabs Builder IDE.
 *
 * Auth: x-sal-key header
 * Body: { message, contactId?, locationId?, conversationId? }
 * Response: { message }
 */
export async function POST(request: NextRequest) {
  return withGHLAgent(request, async (req: GHLAgentRequest) => {
    const response = await generateCompletion({
      model: "claude-sonnet-4-6",
      systemPrompt: PLATFORM_ENGINEERING_PROMPT,
      userPrompt: req.message,
      maxTokens: 8192,
    });

    return response;
  });
}

export { OPTIONS };
