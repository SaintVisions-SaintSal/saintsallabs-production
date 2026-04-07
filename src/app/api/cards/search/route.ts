import { NextRequest, NextResponse } from "next/server";
import { generateCompletion } from "@/lib/ai/claude";

export const runtime = "nodejs";

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
      normal?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
      };
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

interface CardResult {
  id: string;
  name: string;
  set: string;
  setCode: string;
  number: string;
  rarity: string;
  imageUrl: string;
  prices: {
    low: number | null;
    mid: number | null;
    high: number | null;
    market: number | null;
  };
  condition: string;
  type: "pokemon" | "sports" | "other";
}

function isPokemonQuery(query: string): boolean {
  const pokemonIndicators = [
    "pokemon",
    "pikachu",
    "charizard",
    "mewtwo",
    "bulbasaur",
    "squirtle",
    "charmander",
    "eevee",
    "snorlax",
    "gengar",
    "machamp",
    "blastoise",
    "venusaur",
    "raichu",
    "gyarados",
    "dragonite",
    "mew",
    "lugia",
    "ho-oh",
    "rayquaza",
    "umbreon",
    "espeon",
    "vaporeon",
    "flareon",
    "jolteon",
    "sylveon",
    "garchomp",
    "lucario",
    "gardevoir",
    "haunter",
    "alakazam",
    "kadabra",
    "abra",
    "psyduck",
    "slowpoke",
    "magikarp",
    "ditto",
    "meowth",
    "persian",
    "growlithe",
    "arcanine",
    "ponyta",
    "rapidash",
    "lapras",
    "jigglypuff",
    "clefairy",
    "clefable",
    "vulpix",
    "ninetales",
    "poliwag",
    "geodude",
    "onix",
    "gastly",
    "cubone",
    "hitmonlee",
    "hitmonchan",
    "lickitung",
    "koffing",
    "rhyhorn",
    "chansey",
    "tangela",
    "kangaskhan",
    "horsea",
    "goldeen",
    "staryu",
    "starmie",
    "scyther",
    "jynx",
    "electabuzz",
    "magmar",
    "pinsir",
    "tauros",
    "magnemite",
    "magneton",
    "farfetchd",
    "doduo",
    "seel",
    "grimer",
    "shellder",
    "cloyster",
    "hypno",
    "voltorb",
    "electrode",
    "exeggcute",
    "exeggutor",
    "marowak",
    "drowzee",
    "krabby",
    "kingler",
    "tentacool",
    "tentacruel",
    "slowbro",
    "tcg",
    "base set",
    "fossil",
    "jungle",
    "team rocket",
    "gym",
    "neo",
    "e-card",
    "ex",
    "dp",
    "platinum",
    "heartgold",
    "soulsilver",
    "black white",
    "xy",
    "sun moon",
    "sword shield",
    "scarlet violet",
    "holo",
    "vmax",
    "vstar",
    "gx",
    "ex rare",
    "full art",
    "rainbow rare",
    "secret rare",
    "shiny",
  ];
  const lower = query.toLowerCase();
  return pokemonIndicators.some((indicator) => lower.includes(indicator));
}

function extractPrices(card: PokemonTCGCard) {
  const tcgPrices = card.tcgplayer?.prices;
  const cmPrices = card.cardmarket?.prices;

  if (tcgPrices) {
    const priceData =
      tcgPrices.holofoil ||
      tcgPrices.normal ||
      tcgPrices.reverseHolofoil ||
      Object.values(tcgPrices)[0];
    if (priceData) {
      return {
        low: priceData.low ?? null,
        mid: priceData.mid ?? null,
        high: priceData.high ?? null,
        market: priceData.market ?? null,
      };
    }
  }

  if (cmPrices) {
    return {
      low: cmPrices.lowPrice ?? null,
      mid: cmPrices.averageSellPrice ?? null,
      high: null,
      market: cmPrices.trendPrice ?? null,
    };
  }

  return { low: null, mid: null, high: null, market: null };
}

async function searchPokemonTCG(
  query: string,
  set: string,
  rarity: string,
  limit: number
): Promise<CardResult[]> {
  let q = `name:${query}*`;
  if (set) q += ` set.name:${set}*`;
  if (rarity) q += ` rarity:${rarity}`;

  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=${limit}&orderBy=-set.releaseDate`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!response.ok) {
    throw new Error(`Pokémon TCG API error: ${response.status}`);
  }

  const data = await response.json();
  const cards: PokemonTCGCard[] = data.data || [];

  return cards.map((card): CardResult => {
    const prices = extractPrices(card);
    return {
      id: card.id,
      name: card.name,
      set: card.set?.name || "Unknown Set",
      setCode: card.set?.id || "",
      number: card.number || "",
      rarity: card.rarity || "Unknown",
      imageUrl: card.images?.small || card.images?.large || "",
      prices,
      condition: "NM",
      type: "pokemon",
    };
  });
}

async function generateSportsCards(
  query: string,
  set: string,
  rarity: string,
  limit: number
): Promise<CardResult[]> {
  const systemPrompt = `You are a trading card expert with deep knowledge of sports cards, 
  including baseball, basketball, football, soccer, and other sports. 
  Generate realistic and accurate card data based on the query provided.`;

  const userPrompt = `Generate realistic trading card data for: "${query}"
${set ? `Set filter: ${set}` : ""}
${rarity ? `Rarity filter: ${rarity}` : ""}
Limit: ${limit} cards

Return ONLY a valid JSON array (no markdown, no explanation) with up to ${limit} cards matching this format:
[
  {
    "id": "unique_id",
    "name": "Player/Card Name",
    "set": "Card Set Name",
    "setCode": "SET_CODE",
    "number": "card number or variation code",
    "rarity": "Base|Rookie|Refractor|Prizm|Auto|Patch|1/1|Numbered",
    "imageUrl": "",
    "prices": {
      "low": 5.00,
      "mid": 12.50,
      "high": 25.00,
      "market": 10.75
    },
    "condition": "NM",
    "type": "sports"
  }
]

Be realistic with prices. Famous players/rookies should have higher values.
Include year in set name when possible. For rare cards, prices should be higher.`;

  const raw = await generateCompletion({
    model: "claude-sonnet-4-6",
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
  });

  // Extract JSON from response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI-generated card data");
  }

  const cards = JSON.parse(jsonMatch[0]) as CardResult[];
  return cards.slice(0, limit);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const set = searchParams.get("set") || "";
  const rarity = searchParams.get("rarity") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  if (!query.trim()) {
    return NextResponse.json(
      { error: "query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const isPokemon = isPokemonQuery(query);

    if (isPokemon) {
      const cards = await searchPokemonTCG(query, set, rarity, limit);
      return NextResponse.json({
        cards,
        count: cards.length,
        query,
        source: "pokemon_tcg",
      });
    } else {
      const cards = await generateSportsCards(query, set, rarity, limit);
      return NextResponse.json({
        cards,
        count: cards.length,
        query,
        source: "ai_generated",
      });
    }
  } catch (error) {
    console.error("[Cards Search] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to search cards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
