import { NextRequest, NextResponse } from "next/server";
import { generateCompletion } from "@/lib/ai/claude";

export const runtime = "nodejs";

interface PropertyResult {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  units: number;
  estimatedValue: number;
  estimatedRent: number;
  capRate: number;
  listingStatus: string;
  imageUrl: string | null;
}

interface SearchResponse {
  properties: PropertyResult[];
  count: number;
  query: string;
}

interface PropertyRadarProperty {
  id?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyType?: string;
  units?: number;
  estimatedValue?: number;
  estimatedRent?: number;
  capRate?: number;
  listingStatus?: string;
  [key: string]: unknown;
}

async function searchPropertyRadar(params: {
  query?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  limit: number;
}): Promise<PropertyResult[] | null> {
  const apiKey = process.env.PROPERTYRADAR_API_KEY;
  if (!apiKey) return null;

  try {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set("query", params.query);
    if (params.city) searchParams.set("city", params.city);
    if (params.state) searchParams.set("state", params.state);
    if (params.propertyType)
      searchParams.set("propertyType", params.propertyType);
    searchParams.set("limit", String(params.limit));

    const response = await fetch(
      `https://api.propertyradar.com/v1/properties?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `PropertyRadar API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as { properties?: PropertyRadarProperty[] };
    const rawProps = data.properties ?? [];

    return rawProps.map((p, i) => ({
      id: String(p.id ?? `pr-${i}`),
      address: String(p.address ?? ""),
      city: String(p.city ?? ""),
      state: String(p.state ?? ""),
      zipCode: String(p.zipCode ?? ""),
      propertyType: String(p.propertyType ?? ""),
      units: Number(p.units ?? 1),
      estimatedValue: Number(p.estimatedValue ?? 0),
      estimatedRent: Number(p.estimatedRent ?? 0),
      capRate: Number(p.capRate ?? 0),
      listingStatus: String(p.listingStatus ?? "Active"),
      imageUrl: null,
    }));
  } catch (error) {
    console.error("PropertyRadar fetch error:", error);
    return null;
  }
}

async function generateClaudeProperties(params: {
  query?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  limit: number;
}): Promise<PropertyResult[]> {
  const location = [params.city, params.state].filter(Boolean).join(", ") || "United States";
  const type = params.propertyType || "mixed";
  const searchContext = params.query || `${type} investment properties in ${location}`;

  const systemPrompt =
    "You are a real estate data engine. When asked to generate property search results, you return realistic, plausible property listings as a JSON array. Each property must have: id (string), address (string), city (string), state (string, 2-letter), zipCode (string), propertyType (one of: Multifamily, SFR, Commercial, Land), units (number), estimatedValue (number in USD), estimatedRent (number, monthly USD), capRate (number, percentage as decimal e.g. 0.072 for 7.2%), listingStatus (Active or Pending), imageUrl (null). Return ONLY the JSON array, no markdown, no explanation.";

  const userPrompt = `Generate ${params.limit} realistic real estate investment property listings for: ${searchContext}. Location focus: ${location}. Property type filter: ${type}. Make the data realistic for that market — prices, rents, and cap rates should reflect actual market conditions.`;

  const raw = await generateCompletion({
    model: "claude-3-5-sonnet-20241022",
    systemPrompt,
    userPrompt,
    maxTokens: 2048,
  });

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as PropertyResult[];
  return parsed;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("query") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const propertyType = searchParams.get("propertyType") ?? undefined;
  const limitRaw = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitRaw ?? "9", 10), 1), 50);

  const queryLabel = [query, city, state, propertyType].filter(Boolean).join(", ") || "all";

  let properties: PropertyResult[] | null = null;

  // Try PropertyRadar first if key exists
  if (process.env.PROPERTYRADAR_API_KEY) {
    properties = await searchPropertyRadar({ query, city, state, propertyType, limit });
  }

  // Fall back to Claude-generated results
  if (!properties || properties.length === 0) {
    try {
      properties = await generateClaudeProperties({ query, city, state, propertyType, limit });
    } catch (error) {
      console.error("Claude property generation error:", error);
      return NextResponse.json(
        { error: "Search failed", details: String(error) },
        { status: 500 }
      );
    }
  }

  const response: SearchResponse = {
    properties,
    count: properties.length,
    query: queryLabel,
  };

  return NextResponse.json(response);
}
