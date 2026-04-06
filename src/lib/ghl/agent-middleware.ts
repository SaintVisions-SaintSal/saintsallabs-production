import { NextRequest, NextResponse } from "next/server";

/**
 * GHL Agent Studio Webhook Middleware
 *
 * All 6 sub-agent endpoints use this shared middleware for:
 * 1. x-sal-key header authentication
 * 2. GHL webhook request parsing (extracts user message + contact info)
 * 3. Standardized response format that GHL Agent Studio expects
 *
 * GHL Agent Studio sends POST with:
 * {
 *   "message": "user's message text",
 *   "contactId": "ghl_contact_id",
 *   "locationId": "location_id",
 *   "conversationId": "conversation_id",
 *   "type": "agent_message",
 *   ... other metadata
 * }
 *
 * GHL expects back:
 * {
 *   "message": "agent's response text",
 *   "actions": [] (optional — GHL custom actions to trigger)
 * }
 */

const VALID_KEYS = new Set([
  process.env.GHL_WEBHOOK_TOKEN || "saintvision_webhook_2025",
  process.env.SAL_GATEWAY_KEY || "saintvision_gateway_2025",
]);

export interface GHLAgentRequest {
  message: string;
  contactId?: string;
  locationId?: string;
  conversationId?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface GHLAgentResponse {
  message: string;
  actions?: Array<{
    type: string;
    data?: Record<string, unknown>;
  }>;
}

/**
 * Validates the x-sal-key header
 */
export function validateSalKey(request: NextRequest): boolean {
  const key =
    request.headers.get("x-sal-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!key) return false;
  return VALID_KEYS.has(key);
}

/**
 * Parses the incoming GHL Agent Studio webhook request.
 * Handles multiple payload formats — GHL can send in different shapes
 * depending on whether it's a webhook tool, custom action, or MCP tool.
 */
export function parseGHLRequest(body: Record<string, unknown>): GHLAgentRequest {
  // GHL Agent Studio webhook format
  if (body.message && typeof body.message === "string") {
    return {
      message: body.message as string,
      contactId: body.contactId as string | undefined,
      locationId: body.locationId as string | undefined,
      conversationId: body.conversationId as string | undefined,
      type: body.type as string | undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
    };
  }

  // GHL custom action format (nested payload)
  if (body.payload && typeof body.payload === "object") {
    const payload = body.payload as Record<string, unknown>;
    return {
      message: (payload.message || payload.text || payload.input || "") as string,
      contactId: (payload.contactId || body.contactId) as string | undefined,
      locationId: (payload.locationId || body.locationId) as string | undefined,
      conversationId: (payload.conversationId || body.conversationId) as string | undefined,
      type: "custom_action",
    };
  }

  // GHL workflow webhook format
  if (body.contact && typeof body.contact === "object") {
    const contact = body.contact as Record<string, unknown>;
    return {
      message: (body.message || body.text || body.input || "") as string,
      contactId: contact.id as string | undefined,
      locationId: body.locationId as string | undefined,
      type: "workflow_webhook",
    };
  }

  // Fallback — try to extract any message-like field
  const msg =
    body.message ||
    body.text ||
    body.input ||
    body.query ||
    body.prompt ||
    "";

  return {
    message: String(msg),
    contactId: body.contactId as string | undefined,
    locationId: body.locationId as string | undefined,
  };
}

/**
 * Formats the response in GHL Agent Studio expected format
 */
export function formatGHLResponse(
  message: string,
  actions?: GHLAgentResponse["actions"]
): NextResponse {
  return NextResponse.json({
    message,
    ...(actions && actions.length > 0 ? { actions } : {}),
  });
}

/**
 * Standard error response for GHL agents
 */
export function formatGHLError(
  error: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      message: `I encountered an issue processing your request. Please try again or contact support. (Error: ${error})`,
      error: true,
    },
    { status }
  );
}

/**
 * Full middleware wrapper — validates auth, parses request, handles errors.
 * Use this to wrap each agent endpoint handler.
 */
export async function withGHLAgent(
  request: NextRequest,
  handler: (req: GHLAgentRequest) => Promise<string>
): Promise<NextResponse> {
  // Auth check
  if (!validateSalKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized — invalid x-sal-key" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = parseGHLRequest(body);

    if (!parsed.message || parsed.message.trim() === "") {
      return formatGHLError("No message provided", 400);
    }

    console.log(
      `[GHL Agent] Request: contact=${parsed.contactId || "unknown"}, msg="${parsed.message.substring(0, 100)}..."`
    );

    const response = await handler(parsed);

    console.log(
      `[GHL Agent] Response: ${response.substring(0, 100)}...`
    );

    return formatGHLResponse(response);
  } catch (error) {
    console.error("[GHL Agent] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return formatGHLError(msg);
  }
}

/**
 * Standard OPTIONS response for CORS preflight
 * Add this to every GHL agent route: export { OPTIONS } from "@/lib/ghl/agent-middleware";
 */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-sal-key, Authorization",
    },
  });
}
