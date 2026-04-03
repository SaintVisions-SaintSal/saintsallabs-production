import { type NextRequest } from "next/server";
import { withGHLAgent, type GHLAgentRequest } from "@/lib/ghl/agent-middleware";
import { generateCompletion } from "@/lib/ai/claude";
import { GENERAL_INQUIRY_PROMPT } from "@/lib/ai/agent-prompts";

export const runtime = "nodejs";

/**
 * POST /api/mcp/chat
 *
 * GHL Agent Studio webhook — General Inquiry sub-agent.
 * The "SAL Intelligence" catch-all for general questions.
 * This is the MCP gateway endpoint that all GHL agents can route to.
 *
 * Auth: x-sal-key header
 * Body: { message, contactId?, locationId?, conversationId? }
 * Response: { message }
 */
export async function POST(request: NextRequest) {
  return withGHLAgent(request, async (req: GHLAgentRequest) => {
    const response = await generateCompletion({
      model: "claude-sonnet-4-6",
      systemPrompt: GENERAL_INQUIRY_PROMPT,
      userPrompt: req.message,
      maxTokens: 4096,
    });

    return response;
  });
}
