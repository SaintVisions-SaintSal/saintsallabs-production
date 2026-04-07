"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardPrices {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
}

interface CardResult {
  id: string;
  name: string;
  set: string;
  setCode: string;
  number: string;
  rarity: string;
  imageUrl: string;
  prices: CardPrices;
  condition: string;
  type: "pokemon" | "sports" | "other";
}

interface PortfolioCard {
  id: string;
  card_id: string | null;
  card_name: string;
  card_set: string | null;
  card_image_url: string | null;
  purchase_price: number | null;
  current_price: number | null;
  quantity: number;
  condition: string;
  created_at: string;
}

interface PortfolioSummary {
  totalCards: number;
  totalCost: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface ScanResult {
  identification: {
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
  };
  pricing: {
    name: string;
    set: string;
    rarity: string;
    imageUrl: string;
    prices: CardPrices;
  } | null;
  confidence: number;
  psaEstimatedValue: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | null, fallback = "N/A"): string {
  if (val === null || val === undefined) return fallback;
  return `$${val.toFixed(2)}`;
}

type BadgeColor = "amber" | "green" | "slate" | "red";

function rarityBadgeVariant(rarity: string): BadgeColor {
  const r = rarity.toLowerCase();
  if (
    r.includes("ultra") ||
    r.includes("secret") ||
    r.includes("rainbow") ||
    r.includes("1/1")
  ) {
    return "amber";
  }
  if (
    r.includes("holo") ||
    r.includes("vmax") ||
    r.includes("vstar") ||
    r.includes("gx") ||
    r.includes("ex")
  ) {
    return "amber";
  }
  if (
    r.includes("rare") ||
    r.includes("refractor") ||
    r.includes("prizm") ||
    r.includes("auto")
  ) {
    return "slate";
  }
  if (r.includes("uncommon")) {
    return "green";
  }
  return "slate";
}

function rarityExtraClass(rarity: string): string {
  const r = rarity.toLowerCase();
  if (
    r.includes("ultra") ||
    r.includes("secret") ||
    r.includes("rainbow") ||
    r.includes("1/1")
  ) {
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
  if (
    r.includes("holo") ||
    r.includes("vmax") ||
    r.includes("vstar") ||
    r.includes("gx")
  ) {
    return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  }
  if (r.includes("rare") || r.includes("refractor") || r.includes("prizm")) {
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
  if (r.includes("uncommon")) {
    return "bg-green-500/20 text-green-400 border-green-500/30";
  }
  return "bg-zinc-600/30 text-zinc-400 border-zinc-600/30";
}

function gradeColor(grade: number): string {
  if (grade >= 9) return "text-green-400";
  if (grade >= 7) return "text-yellow-400";
  if (grade >= 5) return "text-orange-400";
  return "text-red-400";
}

function conditionBadgeVariant(cond: string): BadgeColor {
  if (cond === "MT" || cond === "NM-MT") return "green";
  if (cond === "NM" || cond === "EX") return "slate";
  if (cond === "VG" || cond === "Good") return "amber";
  return "red";
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden animate-pulse">
      <div className="bg-zinc-800 h-44 w-full" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/4" />
        <div className="h-8 bg-zinc-800 rounded mt-3" />
      </div>
    </div>
  );
}

// ─── Add to Portfolio Dialog ──────────────────────────────────────────────────

interface AddToPortfolioDialogProps {
  card: CardResult | null;
  onClose: () => void;
  onAdd: (data: {
    purchasePrice: number;
    quantity: number;
    condition: string;
  }) => Promise<void>;
}

function AddToPortfolioDialog({
  card,
  onClose,
  onAdd,
}: AddToPortfolioDialogProps) {
  const [purchasePrice, setPurchasePrice] = useState(
    card?.prices.market?.toFixed(2) || ""
  );
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState("NM");
  const [adding, setAdding] = useState(false);

  const conditions = ["MT", "NM-MT", "NM", "EX", "VG", "Good", "Fair", "Poor"];

  async function handleAdd() {
    setAdding(true);
    try {
      await onAdd({
        purchasePrice: parseFloat(purchasePrice) || 0,
        quantity: parseInt(quantity) || 1,
        condition,
      });
      onClose();
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={!!card} onOpenChange={onClose}>
      <DialogContent
        onClose={onClose}
        className="bg-zinc-900 border-zinc-700 text-white max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Add to Portfolio</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {card && (
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-16 h-22 object-contain rounded"
                  />
                ) : (
                  <div className="w-16 h-22 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 text-xs">
                    No Image
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{card.name}</p>
                  <p className="text-sm text-zinc-400">{card.set}</p>
                  <p className="text-xs text-zinc-500">
                    Market: {fmt(card.prices.market)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">
                    Purchase Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">
                  Condition
                </label>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                        condition === c
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                >
                  {adding ? "Adding..." : "Add to Portfolio"}
                </Button>
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ─── Search Tab ───────────────────────────────────────────────────────────────

function SearchTab() {
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [results, setResults] = useState<CardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<CardResult | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const rarities = [
    "Common",
    "Uncommon",
    "Rare",
    "Rare Holo",
    "Ultra Rare",
    "Secret Rare",
  ];

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ query: query.trim() });
      if (setFilter) params.set("set", setFilter);
      if (rarityFilter) params.set("rarity", rarityFilter);
      const res = await fetch(`/api/cards/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.cards || []);
      setSource(data.source || "");
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPortfolio(data: {
    purchasePrice: number;
    quantity: number;
    condition: string;
  }) {
    if (!selectedCard) return;
    const res = await fetch("/api/cards/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: selectedCard.id,
        name: selectedCard.name,
        set: selectedCard.set,
        purchasePrice: data.purchasePrice,
        quantity: data.quantity,
        condition: data.condition,
        imageUrl: selectedCard.imageUrl,
        currentPrice: selectedCard.prices.market,
      }),
    });
    if (res.ok) {
      setAddSuccess(`${selectedCard.name} added to portfolio`);
      setTimeout(() => setAddSuccess(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Search Pokémon, sports cards..."
          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
        />
        <Button
          onClick={doSearch}
          disabled={loading || !query.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Searching
            </span>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          value={setFilter}
          onChange={(e) => setSetFilter(e.target.value)}
          placeholder="Filter by set..."
          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 w-40"
        />
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <option value="">All Rarities</option>
          {rarities.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {source && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              source === "pokemon_tcg"
                ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                : "border-purple-500/50 text-purple-400 bg-purple-500/10"
            }`}
          >
            {source === "pokemon_tcg" ? "Pokémon TCG Live Data" : "AI Generated"}
          </span>
        )}
      </div>

      {/* Success toast */}
      {addSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-2 text-sm">
          {addSuccess}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all group"
            >
              {/* Card image */}
              <div className="bg-zinc-800/50 flex items-center justify-center h-44 overflow-hidden">
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-zinc-600 text-xs text-center p-4">
                    <div className="text-3xl mb-2">🃏</div>
                    No Image
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <p className="font-semibold text-white text-sm leading-tight line-clamp-2">
                  {card.name}
                </p>
                <p className="text-xs text-zinc-400 line-clamp-1">
                  {card.set}
                  {card.number ? ` · #${card.number}` : ""}
                </p>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${rarityExtraClass(card.rarity)}`}
                >
                  {card.rarity}
                </span>

                {/* Prices */}
                <div className="grid grid-cols-3 gap-1 text-xs pt-1">
                  <div className="text-center">
                    <p className="text-zinc-500">Low</p>
                    <p className="text-zinc-300 font-medium">
                      {fmt(card.prices.low)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500">Mid</p>
                    <p className="text-zinc-300 font-medium">
                      {fmt(card.prices.mid)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500">Market</p>
                    <p className="text-amber-400 font-semibold">
                      {fmt(card.prices.market)}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setSelectedCard(card)}
                  className="w-full bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 text-xs transition-colors mt-1"
                >
                  + Add to Portfolio
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-zinc-400">No cards found</p>
          <p className="text-sm mt-1">
            Try a different search term or adjust filters
          </p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16 text-zinc-500">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-lg font-medium text-zinc-400">
            Search for cards to get started
          </p>
          <p className="text-sm mt-1">
            Search Pokémon, baseball, basketball, football cards and more
          </p>
        </div>
      )}

      {/* Add to portfolio dialog */}
      <AddToPortfolioDialog
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onAdd={handleAddToPortfolio}
      />
    </div>
  );
}

// ─── Scan Tab ─────────────────────────────────────────────────────────────────

function ScanTab() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setImageBase64(dataUrl);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function scanCard() {
    if (!imageBase64) return;
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/cards/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sal-key":
            typeof window !== "undefined"
              ? localStorage.getItem("sal_key") || ""
              : "",
        },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data as ScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan card");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-amber-500 bg-amber-500/10"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Card preview"
              className="max-h-64 mx-auto object-contain rounded-lg shadow-lg"
            />
            <p className="text-sm text-zinc-400">
              Click or drag to replace image
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">📸</div>
            <p className="text-lg font-medium text-zinc-300">
              Drop a card image here
            </p>
            <p className="text-sm text-zinc-500">
              or click to upload · JPG, PNG, WebP
            </p>
          </div>
        )}
      </div>

      {/* Scan button */}
      {preview && (
        <Button
          onClick={scanCard}
          disabled={scanning}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 text-base"
        >
          {scanning ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Analyzing Card...
            </span>
          ) : (
            "Scan Card"
          )}
        </Button>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Identity + confidence */}
          <Card className="bg-zinc-900/70 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">
                    {result.identification.cardName}
                  </CardTitle>
                  <p className="text-zinc-400 text-sm mt-0.5">
                    {result.identification.set}
                    {result.identification.year
                      ? ` · ${result.identification.year}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Confidence</p>
                  <p
                    className={`text-lg font-bold ${
                      result.confidence > 0.8
                        ? "text-green-400"
                        : result.confidence > 0.6
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {Math.round(result.confidence * 100)}%
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Grade + condition */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-sm">
                    Estimated Grade:
                  </span>
                  <span
                    className={`text-2xl font-black ${gradeColor(
                      result.identification.estimatedGrade
                    )}`}
                  >
                    {result.identification.estimatedGrade.toFixed(1)}
                  </span>
                  <span className="text-zinc-500 text-sm">/ 10</span>
                </div>
                <Badge variant={conditionBadgeVariant(result.identification.condition)}>
                  {result.identification.condition}
                </Badge>
                {result.identification.printingVariant && (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 border-purple-500/30">
                    {result.identification.printingVariant}
                  </span>
                )}
              </div>

              {/* PSA Value estimate */}
              {result.psaEstimatedValue && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-amber-400/70 mb-0.5">
                    PSA Graded Value Estimate (at this grade)
                  </p>
                  <p className="text-2xl font-bold text-amber-400">
                    {fmt(result.psaEstimatedValue)}
                  </p>
                </div>
              )}

              {/* Physical characteristics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Centering",
                    value: result.identification.centering,
                  },
                  { label: "Corners", value: result.identification.corners },
                  { label: "Edges", value: result.identification.edges },
                  { label: "Surface", value: result.identification.surface },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className="text-sm text-zinc-300">{value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Identified features */}
              {result.identification.identifiedFeatures?.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">
                    Identified Features
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.identification.identifiedFeatures.map(
                      (feat, i) => (
                        <Badge key={i} variant="slate">
                          {feat}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing from API */}
          {result.pricing && (
            <Card className="bg-zinc-900/70 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-medium">
                  Current Market Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Low", val: result.pricing.prices.low },
                    { label: "Mid", val: result.pricing.prices.mid },
                    { label: "High", val: result.pricing.prices.high },
                    { label: "Market", val: result.pricing.prices.market },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p
                        className={`font-bold mt-1 ${
                          label === "Market"
                            ? "text-amber-400"
                            : "text-zinc-200"
                        }`}
                      >
                        {fmt(val)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────

function PortfolioTab() {
  const [cards, setCards] = useState<PortfolioCard[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadPortfolio() {
    setLoading(true);
    try {
      const res = await fetch("/api/cards/portfolio");
      if (!res.ok) throw new Error("Failed to load portfolio");
      const data = await res.json();
      setCards(data.cards || []);
      setSummary(data.summary || null);
      setLoaded(true);
    } catch {
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  // Load on first render
  if (!loaded && !loading) {
    loadPortfolio();
  }

  async function removeCard(id: string) {
    setRemoving(id);
    try {
      await fetch(`/api/cards/portfolio?id=${id}`, { method: "DELETE" });
      const remaining = cards.filter((c) => c.id !== id);
      setCards(remaining);
      // Recalc summary
      const totalCards = remaining.reduce((s, c) => s + (c.quantity || 1), 0);
      const totalCost = remaining.reduce(
        (s, c) => s + (c.purchase_price || 0) * (c.quantity || 1),
        0
      );
      const totalValue = remaining.reduce(
        (s, c) =>
          s +
          (c.current_price || c.purchase_price || 0) * (c.quantity || 1),
        0
      );
      setSummary({
        totalCards,
        totalCost: Math.round(totalCost * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        gainLoss: Math.round((totalValue - totalCost) * 100) / 100,
        gainLossPercent:
          totalCost > 0
            ? Math.round(((totalValue - totalCost) / totalCost) * 10000) / 100
            : 0,
      });
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800"
            />
          ))}
        </div>
        <div className="h-48 bg-zinc-900 rounded-xl animate-pulse border border-zinc-800" />
      </div>
    );
  }

  if (loaded && cards.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <div className="text-5xl mb-4">📦</div>
        <p className="text-lg font-medium text-zinc-400">
          No cards in portfolio yet
        </p>
        <p className="text-sm mt-1">
          Search and add cards from the Search tab
        </p>
      </div>
    );
  }

  const gainLossPositive = (summary?.gainLoss || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Cards",
              value: summary.totalCards.toString(),
              color: "text-white",
            },
            {
              label: "Total Value",
              value: fmt(summary.totalValue),
              color: "text-amber-400",
            },
            {
              label: "Total Cost",
              value: fmt(summary.totalCost),
              color: "text-zinc-300",
            },
            {
              label: "Gain / Loss",
              value: `${gainLossPositive ? "+" : ""}${fmt(summary.gainLoss)} (${gainLossPositive ? "+" : ""}${summary.gainLossPercent}%)`,
              color: gainLossPositive ? "text-green-400" : "text-red-400",
            },
          ].map(({ label, value, color }) => (
            <Card key={label} className="bg-zinc-900/70 border-zinc-800">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portfolio table */}
      <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Card</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Set
                </th>
                <th className="text-left px-4 py-3 font-medium">Condition</th>
                <th className="text-right px-4 py-3 font-medium">Cost</th>
                <th className="text-right px-4 py-3 font-medium">Value</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">
                  G/L
                </th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">
                  Qty
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const cost = (card.purchase_price || 0) * card.quantity;
                const value =
                  (card.current_price || card.purchase_price || 0) *
                  card.quantity;
                const gl = value - cost;
                const glPositive = gl >= 0;

                return (
                  <tr
                    key={card.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {card.card_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={card.card_image_url}
                            alt={card.card_name}
                            className="w-8 h-11 object-contain rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-zinc-800 rounded flex-shrink-0 flex items-center justify-center text-zinc-600 text-xs">
                            🃏
                          </div>
                        )}
                        <span className="font-medium text-white text-sm leading-tight">
                          {card.card_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm hidden md:table-cell">
                      {card.card_set || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="slate">{card.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-sm">
                      {fmt(cost)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400 font-medium text-sm">
                      {fmt(value)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm hidden sm:table-cell">
                      <span
                        className={glPositive ? "text-green-400" : "text-red-400"}
                      >
                        {glPositive ? "+" : ""}
                        {fmt(gl)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-sm hidden sm:table-cell">
                      {card.quantity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeCard(card.id)}
                        disabled={removing === card.id}
                        className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                      >
                        {removing === card.id ? (
                          <span className="w-3 h-3 border border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                        ) : (
                          "×"
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CookinCardsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
          🃏
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            CookinCards
          </h1>
          <p className="text-sm text-zinc-400">
            Trading card search, pricing & portfolio tracker
          </p>
        </div>
      </div>

      {/* Tabs — using the project's custom Tabs component */}
      <Tabs
        tabs={[
          { id: "search", label: "Search", content: <SearchTab /> },
          { id: "scan", label: "Scan", content: <ScanTab /> },
          { id: "portfolio", label: "Portfolio", content: <PortfolioTab /> },
        ]}
        defaultTab="search"
      />
    </div>
  );
}
