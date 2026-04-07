import { NextRequest, NextResponse } from "next/server";
import { generateCompletion } from "@/lib/ai/claude";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalyzeRequestBody {
  address?: string;
  zipCode?: string;
  propertyType?: string;
  askingPrice?: number;
  units?: number;
  grossIncome?: number;
  expenses?: number;
}

interface RentCastResponse {
  rent?: number;
  rentRangeLow?: number;
  rentRangeHigh?: number;
  latitude?: number;
  longitude?: number;
  listings?: unknown[];
  [key: string]: unknown;
}

interface ClaudeAnalysis {
  capRate?: number;
  cashOnCash?: number;
  noi?: number;
  grm?: number;
  onePercentRule?: boolean;
  dealRating?: "A" | "B" | "C" | "D" | "F";
  ratingReason?: string;
  recommendation?: string;
  redFlags?: string[];
  strengths?: string[];
  [key: string]: unknown;
}

async function fetchRentEstimate(
  address: string
): Promise<RentCastResponse | null> {
  const apiKey = process.env.RENTCAST_API;
  if (!apiKey) return null;

  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.rentcast.io/v1/avm/rent/long-term?address=${encodedAddress}`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `RentCast API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as RentCastResponse;
    return data;
  } catch (error) {
    console.error("RentCast fetch error:", error);
    return null;
  }
}

function buildUserPrompt(body: AnalyzeRequestBody, rentEstimate: RentCastResponse | null): string {
  const lines: string[] = ["Analyze this real estate investment deal:"];

  if (body.address) lines.push(`Address: ${body.address}`);
  if (body.zipCode) lines.push(`Zip Code: ${body.zipCode}`);
  if (body.propertyType) lines.push(`Property Type: ${body.propertyType}`);
  if (body.askingPrice != null)
    lines.push(`Asking Price: $${body.askingPrice.toLocaleString()}`);
  if (body.units != null) lines.push(`Units: ${body.units}`);
  if (body.grossIncome != null)
    lines.push(
      `Monthly Gross Income: $${body.grossIncome.toLocaleString()}`
    );
  if (body.expenses != null)
    lines.push(`Monthly Expenses: $${body.expenses.toLocaleString()}`);

  if (rentEstimate) {
    lines.push("");
    lines.push("RentCast Market Rent Data:");
    if (rentEstimate.rent != null)
      lines.push(`  Market Rent Estimate: $${rentEstimate.rent}/month`);
    if (rentEstimate.rentRangeLow != null && rentEstimate.rentRangeHigh != null)
      lines.push(
        `  Rent Range: $${rentEstimate.rentRangeLow} - $${rentEstimate.rentRangeHigh}/month`
      );
  }

  lines.push("");
  lines.push(
    "Return ONLY valid JSON with the fields described in your system prompt. No markdown, no explanation — just the JSON object."
  );

  return lines.join("\n");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: userData, error: authError } =
    await supabaseAdmin.auth.getUser(token);

  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: "Unauthorized: invalid token" },
      { status: 401 }
    );
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await req.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 1. RentCast API call (if address provided)
  let rentEstimate: RentCastResponse | null = null;
  if (body.address) {
    rentEstimate = await fetchRentEstimate(body.address);
  }

  // 2. Claude analysis
  let analysis: ClaudeAnalysis | null = null;
  try {
    const systemPrompt =
      "You are SaintSal Real Estate Analyst, powered by SaintVision Technologies. You analyze real estate investment deals with precision. When given property data, you calculate: Cap Rate, Cash-on-Cash return, NOI, GRM, 1% rule check, and give a Deal Rating (A/B/C/D/F) with reasoning. Format your response as JSON with fields: capRate, cashOnCash, noi, grm, onePercentRule (boolean), dealRating, ratingReason, recommendation, redFlags (array), strengths (array).";

    const userPrompt = buildUserPrompt(body, rentEstimate);

    const raw = await generateCompletion({
      model: "claude-3-5-sonnet-20241022",
      systemPrompt,
      userPrompt,
      maxTokens: 1024,
    });

    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    analysis = JSON.parse(cleaned) as ClaudeAnalysis;
  } catch (error) {
    console.error("Claude analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: String(error) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    analysis,
    rentEstimate,
    address: body.address ?? null,
    propertyType: body.propertyType ?? null,
  });
}
