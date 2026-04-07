"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  calculateCapRate,
  calculateNOI,
  calculateGRM,
  checkOnePercentRule,
  formatCurrency,
  getDealRating,
} from "@/lib/realestate/analyzer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Property {
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

interface AnalysisResult {
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
}

interface AnalyzeResponse {
  analysis: AnalysisResult;
  rentEstimate: { rent?: number; rentRangeLow?: number; rentRangeHigh?: number } | null;
  address: string | null;
  propertyType: string | null;
}

interface SearchFormState {
  query: string;
  city: string;
  state: string;
  propertyType: string;
}

interface AnalyzeFormState {
  address: string;
  askingPrice: string;
  units: string;
  grossIncome: string;
  expenses: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = ["", "Multifamily", "SFR", "Commercial", "Land"] as const;

function capRateColor(rate: number): string {
  if (rate >= 0.08) return "text-green-400";
  if (rate >= 0.05) return "text-yellow-400";
  return "text-red-400";
}

function dealRatingColor(rating: "A" | "B" | "C" | "D" | "F" | undefined): string {
  switch (rating) {
    case "A": return "bg-green-600 text-white";
    case "B": return "bg-emerald-600 text-white";
    case "C": return "bg-yellow-600 text-white";
    case "D": return "bg-orange-600 text-white";
    case "F": return "bg-red-700 text-white";
    default:  return "bg-zinc-700 text-zinc-300";
  }
}

function listingStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "Active") return "default";
  if (status === "Pending") return "secondary";
  return "outline";
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 animate-pulse">
      <CardContent className="p-5 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
        <div className="h-8 bg-zinc-800 rounded w-full mt-4" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Property card
// ---------------------------------------------------------------------------

function PropertyCard({
  property,
  onAnalyze,
}: {
  property: Property;
  onAnalyze: (p: Property) => void;
}) {
  const capRatePct = property.capRate
    ? property.capRate < 1
      ? property.capRate * 100
      : property.capRate
    : 0;

  const capRateDecimal = capRatePct / 100;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-100 leading-snug">
              {property.address}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
          <Badge variant={listingStatusVariant(property.listingStatus)} className="shrink-0 text-xs">
            {property.listingStatus}
          </Badge>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
            {property.propertyType}
          </Badge>
          {property.units > 1 && (
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
              {property.units} units
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-zinc-500 uppercase tracking-wide text-[10px]">Est. Value</p>
            <p className="text-zinc-200 font-medium">{formatCurrency(property.estimatedValue)}</p>
          </div>
          <div>
            <p className="text-zinc-500 uppercase tracking-wide text-[10px]">Est. Rent/mo</p>
            <p className="text-zinc-200 font-medium">{formatCurrency(property.estimatedRent)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 uppercase tracking-wide text-[10px]">Cap Rate</p>
            <p className={`font-semibold text-sm ${capRateColor(capRateDecimal)}`}>
              {capRatePct.toFixed(2)}%
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => onAnalyze(property)}
        >
          Analyze
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Analysis result panel
// ---------------------------------------------------------------------------

function AnalysisResultCard({ result }: { result: AnalysisResult }) {
  const capRatePct =
    result.capRate != null
      ? result.capRate < 1
        ? result.capRate * 100
        : result.capRate
      : null;

  const cashOnCashPct =
    result.cashOnCash != null
      ? result.cashOnCash < 1
        ? result.cashOnCash * 100
        : result.cashOnCash
      : null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-zinc-100 text-base">Deal Analysis</CardTitle>
          {result.dealRating && (
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${dealRatingColor(result.dealRating)}`}
            >
              {result.dealRating}
            </span>
          )}
        </div>
        {result.ratingReason && (
          <p className="text-xs text-zinc-400 mt-1">{result.ratingReason}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {capRatePct != null && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Cap Rate</p>
              <p className={`text-lg font-bold ${capRateColor(capRatePct / 100)}`}>
                {capRatePct.toFixed(2)}%
              </p>
            </div>
          )}
          {cashOnCashPct != null && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wide">Cash-on-Cash</p>
              <p className="text-lg font-bold text-zinc-100">{cashOnCashPct.toFixed(2)}%</p>
            </div>
          )}
          {result.noi != null && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wide">NOI (annual)</p>
              <p className="text-lg font-bold text-zinc-100">{formatCurrency(result.noi)}</p>
            </div>
          )}
          {result.grm != null && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wide">GRM</p>
              <p className="text-lg font-bold text-zinc-100">{result.grm.toFixed(1)}x</p>
            </div>
          )}
          {result.onePercentRule != null && (
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wide">1% Rule</p>
              <p className={`text-lg font-bold ${result.onePercentRule ? "text-green-400" : "text-red-400"}`}>
                {result.onePercentRule ? "Pass" : "Fail"}
              </p>
            </div>
          )}
        </div>

        {/* Recommendation */}
        {result.recommendation && (
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">Recommendation</p>
            <p className="text-sm text-zinc-300">{result.recommendation}</p>
          </div>
        )}

        {/* Strengths */}
        {result.strengths && result.strengths.length > 0 && (
          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide mb-2">Strengths</p>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red flags */}
        {result.redFlags && result.redFlags.length > 0 && (
          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wide mb-2">Red Flags</p>
            <ul className="space-y-1">
              {result.redFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="text-red-400 mt-0.5 shrink-0">⚑</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RealEstatePage() {
  // Search state
  const [searchForm, setSearchForm] = useState<SearchFormState>({
    query: "",
    city: "",
    state: "",
    propertyType: "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Analyze state
  const [analyzeForm, setAnalyzeForm] = useState<AnalyzeFormState>({
    address: "",
    askingPrice: "",
    units: "",
    grossIncome: "",
    expenses: "",
  });
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [rentEstimate, setRentEstimate] = useState<AnalyzeResponse["rentEstimate"]>(null);

  // Handle search
  const handleSearch = useCallback(async () => {
    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchForm.query) params.set("query", searchForm.query);
      if (searchForm.city) params.set("city", searchForm.city);
      if (searchForm.state) params.set("state", searchForm.state);
      if (searchForm.propertyType) params.set("propertyType", searchForm.propertyType);
      params.set("limit", "9");

      const res = await fetch(`/api/realestate/search?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { properties: Property[] };
      setProperties(data.properties ?? []);
    } catch (err) {
      setSearchError(String(err instanceof Error ? err.message : err));
    } finally {
      setSearchLoading(false);
    }
  }, [searchForm]);

  // Pre-fill analyzer from a property card
  const handleAnalyzeFromCard = useCallback((p: Property) => {
    setAnalyzeForm({
      address: `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`,
      askingPrice: String(p.estimatedValue),
      units: String(p.units),
      grossIncome: String(p.estimatedRent),
      expenses: "",
    });
    // Scroll to analyzer
    document.getElementById("deal-analyzer")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle analyze submission
  const handleAnalyze = useCallback(async () => {
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalysisResult(null);
    setRentEstimate(null);

    try {
      // Get auth token from localStorage (standard JWT pattern)
      const token =
        typeof window !== "undefined"
          ? (localStorage.getItem("sb-access-token") ?? localStorage.getItem("supabase.auth.token") ?? "")
          : "";

      // If no token found, try to do a local calculation fallback
      const askingPrice = parseFloat(analyzeForm.askingPrice) || 0;
      const units = parseInt(analyzeForm.units, 10) || 1;
      const grossIncome = parseFloat(analyzeForm.grossIncome) || 0;
      const expenses = parseFloat(analyzeForm.expenses) || 0;

      if (token) {
        const res = await fetch("/api/realestate/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address: analyzeForm.address || undefined,
            askingPrice: askingPrice || undefined,
            units: units || undefined,
            grossIncome: grossIncome || undefined,
            expenses: expenses || undefined,
          }),
        });

        if (!res.ok) {
          if (res.status === 401) throw new Error("Session expired. Please sign in again.");
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as AnalyzeResponse;
        setAnalysisResult(data.analysis);
        setRentEstimate(data.rentEstimate);
      } else {
        // Local calculation fallback (no AI narrative, just numbers)
        if (!askingPrice) {
          throw new Error("Please enter an asking price to analyze the deal.");
        }
        const noi = calculateNOI(grossIncome, expenses);
        const capRate = calculateCapRate(noi, askingPrice);
        const grm = calculateGRM(askingPrice, grossIncome * 12);
        const onePercentRule = checkOnePercentRule(askingPrice, grossIncome);
        const dealRating = getDealRating(capRate);

        setAnalysisResult({
          capRate,
          noi,
          grm,
          onePercentRule,
          dealRating,
          ratingReason: "Local calculation (sign in for AI analysis)",
          recommendation: onePercentRule
            ? "Deal passes the 1% rule — warrants further due diligence."
            : "Deal does not pass the 1% rule. Verify income/expense assumptions.",
          strengths: onePercentRule ? ["Meets 1% rule"] : [],
          redFlags: !onePercentRule ? ["Does not meet 1% rule"] : [],
        });
      }
    } catch (err) {
      setAnalyzeError(String(err instanceof Error ? err.message : err));
    } finally {
      setAnalyzeLoading(false);
    }
  }, [analyzeForm]);

  const isEmpty = !searchLoading && hasSearched && properties.length === 0 && !searchError;
  const showEmptyDefault = !hasSearched && !analysisResult;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Real Estate</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Search investment properties and analyze deals with AI-powered insights.
          </p>
        </div>

        {/* Top section: Search + Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Property Search */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-zinc-100 text-base">Search Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Keywords (e.g. duplex near downtown)"
                value={searchForm.query}
                onChange={(e) => setSearchForm((s) => ({ ...s, query: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="City"
                  value={searchForm.city}
                  onChange={(e) => setSearchForm((s) => ({ ...s, city: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
                />
                <Input
                  placeholder="State (e.g. TX)"
                  value={searchForm.state}
                  onChange={(e) =>
                    setSearchForm((s) => ({ ...s, state: e.target.value.toUpperCase().slice(0, 2) }))
                  }
                  maxLength={2}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
                />
              </div>

              <select
                value={searchForm.propertyType}
                onChange={(e) => setSearchForm((s) => ({ ...s, propertyType: e.target.value }))}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="">All Property Types</option>
                {PROPERTY_TYPES.filter(Boolean).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleSearch}
                disabled={searchLoading}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
              >
                {searchLoading ? "Searching…" : "Search Properties"}
              </Button>

              {searchError && (
                <p className="text-xs text-red-400 mt-1">{searchError}</p>
              )}
            </CardContent>
          </Card>

          {/* Right: Quick Deal Analyzer */}
          <Card className="bg-zinc-900 border-zinc-800" id="deal-analyzer">
            <CardHeader className="pb-3">
              <CardTitle className="text-zinc-100 text-base">Quick Deal Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Property Address"
                value={analyzeForm.address}
                onChange={(e) => setAnalyzeForm((s) => ({ ...s, address: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Asking Price ($)"
                  value={analyzeForm.askingPrice}
                  onChange={(e) => setAnalyzeForm((s) => ({ ...s, askingPrice: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
                />
                <Input
                  type="number"
                  placeholder="Units"
                  value={analyzeForm.units}
                  onChange={(e) => setAnalyzeForm((s) => ({ ...s, units: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
                />
              </div>

              <Input
                type="number"
                placeholder="Monthly Gross Income ($)"
                value={analyzeForm.grossIncome}
                onChange={(e) => setAnalyzeForm((s) => ({ ...s, grossIncome: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
              />
              <Input
                type="number"
                placeholder="Monthly Expenses ($)"
                value={analyzeForm.expenses}
                onChange={(e) => setAnalyzeForm((s) => ({ ...s, expenses: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500"
              />

              <Button
                onClick={handleAnalyze}
                disabled={analyzeLoading}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
              >
                {analyzeLoading ? "Analyzing…" : "Analyze Deal"}
              </Button>

              {analyzeError && (
                <p className="text-xs text-red-400 mt-1">{analyzeError}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis result */}
        {analysisResult && (
          <div className="space-y-2">
            <AnalysisResultCard result={analysisResult} />
            {rentEstimate?.rent != null && (
              <p className="text-xs text-zinc-500 pl-1">
                RentCast market rent estimate: {formatCurrency(rentEstimate.rent)}/mo
                {rentEstimate.rentRangeLow != null && rentEstimate.rentRangeHigh != null
                  ? ` (range: ${formatCurrency(rentEstimate.rentRangeLow)} – ${formatCurrency(rentEstimate.rentRangeHigh)})`
                  : ""}
              </p>
            )}
          </div>
        )}

        {/* Results section */}
        <div>
          {searchLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!searchLoading && searchError && (
            <Card className="bg-zinc-900 border-red-900">
              <CardContent className="p-5">
                <p className="text-sm text-red-400">{searchError}</p>
              </CardContent>
            </Card>
          )}

          {isEmpty && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-10 text-center">
                <p className="text-zinc-500 text-sm">
                  No properties found. Try adjusting your search filters.
                </p>
              </CardContent>
            </Card>
          )}

          {showEmptyDefault && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-10 text-center">
                <p className="text-zinc-500 text-sm">
                  Search for properties or enter deal details to analyze.
                </p>
              </CardContent>
            </Card>
          )}

          {!searchLoading && properties.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-zinc-500">
                  {properties.length} {properties.length === 1 ? "property" : "properties"} found
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    onAnalyze={handleAnalyzeFromCard}
                  />
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
