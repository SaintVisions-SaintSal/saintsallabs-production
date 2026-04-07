import { NextRequest, NextResponse } from "next/server";
import { validateSalKey } from "@/lib/ghl/agent-middleware";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CardIdentification {
  cardName: string;
  set: string;
  year: string;
  condition: string;
  estimatedGrade: number;
  identifiedFeatures: string[];
  printingVariant: string;
  centering: string;
  corners: string;
  edges: string;
  surface: string;
}

interface PokemonTCGCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images?: {
    small?: string;
    large?: string;
  };
  set?: {
    name: string;
    id: string;
  };
  tcgplayer?: {
    prices?: {
      normal?: { low?: number; mid?: number; high?: number; market?: number };
      holofoil?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
      };
      reverseHolofoil?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
      };
    };
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
    };
  };
}

async function fetchCardPricing(cardName: string, setName?: string) {
  try {
    let q = `name:${cardName}*`;
    if (setName) q += ` set.name:${setName}*`;

    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=5&orderBy=-set.releaseDate`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) return null;

    const data = await res.json();
    const cards: PokemonTCGCard[] = data.data || [];

    if (cards.length === 0) return null;

    const card = cards[0];
    const tcgPrices = card.tcgplayer?.prices;
    const cmPrices = card.cardmarket?.prices;

    let prices = { low: null as number | null, mid: null as number | null, high: null as number | null, market: null as number | null };

    if (tcgPrices) {
      const priceData =
        tcgPrices.holofoil ||
        tcgPrices.normal ||
        tcgPrices.reverseHolofoil ||
        Object.values(tcgPrices)[0];
      if (priceData) {
        prices = {
          low: priceData.low ?? null,
          mid: priceData.mid ?? null,
          high: priceData.high ?? null,
          market: priceData.market ?? null,
        };
      }
    } else if (cmPrices) {
      prices = {
        low: cmPrices.lowPrice ?? null,
        mid: cmPrices.averageSellPrice ?? null,
        high: null,
        market: cmPrices.trendPrice ?? null,
      };
    }

    return {
      id: card.id,
      name: card.name,
      set: card.set?.name || "Unknown",
      setCode: card.set?.id || "",
      number: card.number || "",
      rarity: card.rarity || "Unknown",
      imageUrl: card.images?.small || card.images?.large || "",
      prices,
    };
  } catch {
    return null;
  }
}

function estimatePSAValue(grade: number, marketPrice: number | null): number | null {
  if (!marketPrice) return null;
  const multipliers: Record<number, number> = {
    10: 8.0,
    9: 3.5,
    8: 2.0,
    7: 1.4,
    6: 1.1,
    5: 0.9,
    4: 0.75,
    3: 0.6,
    2: 0.5,
    1: 0.35,
  };
  const multiplier = multipliers[Math.round(grade)] || 1.0;
  return Math.round(marketPrice * multiplier * 100) / 100;
}

export async function POST(request: NextRequest) {
  if (!validateSalKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized — invalid x-sal-key" },
      { status: 401 }
    );
  }

  let body: { imageUrl?: string; imageBase64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageUrl, imageBase64 } = body;

  if (!imageUrl && !imageBase64) {
    return NextResponse.json(
      { error: "imageUrl or imageBase64 is required" },
      { status: 400 }
    );
  }

  try {
    // Build image content for Claude Vision
    type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    
    type ImageContent =
      | { type: "image"; source: { type: "url"; url: string } }
      | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } };

    let imageContent: ImageContent;

    if (imageUrl) {
      imageContent = {
        type: "image",
        source: {
          type: "url",
          url: imageUrl,
        },
      };
    } else {
      // Parse base64: handle "data:image/jpeg;base64,..." format
      let mediaType: ImageMediaType = "image/jpeg";
      let base64Data = imageBase64!;

      if (imageBase64!.startsWith("data:")) {
        const [header, data] = imageBase64!.split(",");
        base64Data = data;
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          mediaType = mimeMatch[1] as ImageMediaType;
        }
      }

      imageContent = {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data,
        },
      };
    }

    const identifyPrompt = `Identify this trading card. Examine it carefully and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "cardName": "full card name",
  "set": "set name if visible, otherwise best guess",
  "year": "year of printing or set release",
  "condition": "one of: Poor/Fair/Good/VG/EX/NM/NM-MT/MT",
  "estimatedGrade": 8.5,
  "identifiedFeatures": ["notable feature 1", "feature 2"],
  "printingVariant": "e.g. Holofoil, Reverse Holo, Non-Holo, First Edition, etc.",
  "centering": "description of centering quality, e.g. 55/45 left-right",
  "corners": "description of corner wear",
  "edges": "description of edge condition",
  "surface": "description of surface condition including scratches, print lines, etc."
}`;

    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            imageContent as Anthropic.ImageBlockParam,
            {
              type: "text" as const,
              text: identifyPrompt,
            },
          ],
        },
      ],
    });

    const textBlock = claudeResponse.content.find(
      (block) => block.type === "text"
    );
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude Vision");
    }

    const rawText = textBlock.text.trim();

    // Extract JSON
    const jsonMatch =
      rawText.match(/```json\n?([\s\S]*?)\n?```/) ||
      rawText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;

    let identification: CardIdentification;
    try {
      identification = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Failed to parse card identification: ${rawText.slice(0, 200)}`);
    }

    // Calculate confidence based on grade certainty
    const confidence = Math.min(
      0.95,
      0.5 + (identification.estimatedGrade / 10) * 0.45
    );

    // Try to get pricing — attempt Pokémon TCG API first
    const pricing = await fetchCardPricing(
      identification.cardName,
      identification.set
    );

    // Calculate PSA estimated value
    const psaValue = estimatePSAValue(
      identification.estimatedGrade,
      pricing?.prices?.market ?? null
    );

    return NextResponse.json({
      identification,
      pricing,
      confidence,
      psaEstimatedValue: psaValue,
      meta: {
        model: "claude-sonnet-4-6",
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Card Scan] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to scan card";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
