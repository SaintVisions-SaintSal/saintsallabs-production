import { type NextRequest } from "next/server";
import { withGHLAgent, type GHLAgentRequest } from "@/lib/ghl/agent-middleware";
import { generateCompletion } from "@/lib/ai/claude";
import { CRM_MANAGEMENT_PROMPT } from "@/lib/ai/agent-prompts";

export const runtime = "nodejs";

/**
 * POST /api/ghl/contacts
 *
 * GHL Agent Studio webhook — CRM Management sub-agent.
 * Handles contact lookup, pipeline management, and CRM strategy questions.
 *
 * Auth: x-sal-key header
 * Body: { message, contactId?, locationId?, conversationId? }
 * Response: { message }
 */
export async function POST(request: NextRequest) {
  return withGHLAgent(request, async (req: GHLAgentRequest) => {
    // Build context-enriched prompt if contact ID is provided
    let enrichedMessage = req.message;
    if (req.contactId) {
      enrichedMessage = `[CRM Context: Contact ID ${req.contactId}${req.locationId ? `, Location ${req.locationId}` : ""}]\n\n${req.message}`;
    }

    const response = await generateCompletion({
      model: "claude-sonnet-4-6",
      systemPrompt: CRM_MANAGEMENT_PROMPT,
      userPrompt: enrichedMessage,
      maxTokens: 4096,
    });

    return response;
  });
}
