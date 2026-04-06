import { type NextRequest } from "next/server";
import { withGHLAgent, OPTIONS, type GHLAgentRequest } from "@/lib/ghl/agent-middleware";
import { generateCompletion } from "@/lib/ai/claude";
import { ENTITY_ADVISOR_PROMPT } from "@/lib/ai/agent-prompts";

export const runtime = "nodejs";

/**
 * POST /api/launchpad/entity-advisor
 *
 * GHL Agent Studio webhook — Business Formation sub-agent.
 * Handles entity structuring, incorporation, and business setup questions.
 *
 * Auth: x-sal-key header
 * Body: { message, contactId?, locationId?, conversationId? }
 * Response: { message }
 */
export async function POST(request: NextRequest) {
  return withGHLAgent(request, async (req: GHLAgentRequest) => {
    const response = await generateCompletion({
      model: "claude-sonnet-4-6",
      systemPrompt: ENTITY_ADVISOR_PROMPT,
      userPrompt: req.message,
      maxTokens: 4096,
    });

    return response;
  });
}

export { OPTIONS };
