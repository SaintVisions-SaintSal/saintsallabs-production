import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/cards/portfolio
 * Returns the authenticated user's card portfolio from Supabase.
 * Auth: Bearer JWT required.
 */
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized — Bearer JWT required" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("cards_portfolio")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Portfolio GET] Supabase error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }

  // Calculate summary stats
  const totalCards = (data || []).reduce(
    (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
    0
  );
  const totalCost = (data || []).reduce(
    (sum: number, item: { purchase_price?: number; quantity?: number }) =>
      sum + (item.purchase_price || 0) * (item.quantity || 1),
    0
  );
  const totalValue = (data || []).reduce(
    (sum: number, item: { current_price?: number; purchase_price?: number; quantity?: number }) =>
      sum +
      (item.current_price || item.purchase_price || 0) * (item.quantity || 1),
    0
  );

  return NextResponse.json({
    cards: data || [],
    summary: {
      totalCards,
      totalCost: Math.round(totalCost * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      gainLoss: Math.round((totalValue - totalCost) * 100) / 100,
      gainLossPercent:
        totalCost > 0
          ? Math.round(((totalValue - totalCost) / totalCost) * 10000) / 100
          : 0,
    },
  });
}

/**
 * POST /api/cards/portfolio
 * Add a card to the portfolio.
 * Body: { cardId, name, set, purchasePrice, quantity, condition, imageUrl? }
 * Auth: Bearer JWT required.
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized — Bearer JWT required" },
      { status: 401 }
    );
  }

  let body: {
    cardId?: string;
    name?: string;
    set?: string;
    purchasePrice?: number;
    quantity?: number;
    condition?: string;
    imageUrl?: string;
    currentPrice?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cardId, name, set, purchasePrice, quantity, condition, imageUrl, currentPrice } =
    body;

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cards_portfolio")
    .insert({
      user_id: user.id,
      card_id: cardId || null,
      card_name: name,
      card_set: set || null,
      card_image_url: imageUrl || null,
      purchase_price: purchasePrice ?? null,
      current_price: currentPrice ?? purchasePrice ?? null,
      quantity: quantity || 1,
      condition: condition || "NM",
    })
    .select()
    .single();

  if (error) {
    console.error("[Portfolio POST] Supabase error:", error);
    return NextResponse.json(
      { error: "Failed to add card to portfolio" },
      { status: 500 }
    );
  }

  return NextResponse.json({ card: data, success: true }, { status: 201 });
}

/**
 * DELETE /api/cards/portfolio
 * Remove a card from portfolio.
 * Body: { id: uuid } or query param ?id=uuid
 * Also handles body with method: "DELETE" as a workaround.
 * Auth: Bearer JWT required.
 */
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized — Bearer JWT required" },
      { status: 401 }
    );
  }

  // Support both query param and body
  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");

  if (!id) {
    try {
      const body = await request.json();
      id = body.id;
    } catch {
      // ignore parse errors
    }
  }

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("cards_portfolio")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // ensure user owns this record

  if (error) {
    console.error("[Portfolio DELETE] Supabase error:", error);
    return NextResponse.json(
      { error: "Failed to remove card from portfolio" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
