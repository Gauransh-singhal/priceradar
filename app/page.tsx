"use client";

import { useState, KeyboardEvent } from "react";

interface ProductResult {
  title: string;
  price: string;
  mrp: string;
  image: string | null;
  url: string;
}

interface PlatformResults {
  platform: string;
  results: ProductResult[];
  error?: string;
}

interface AnalysisResult {
  score: number;
  verdict: string;
  recommendation: "Buy Now" | "Wait" | "Compare More";
  bestPlatform: string;
  reasoning: string;
  savings: number;
}

function parsePrice(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(n) || n === 0 ? Infinity : n;
}

function formatPrice(price: string): string {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n === 0) return "—";
  return "₹" + n.toLocaleString("en-IN");
}

function getBestDeal(
  results: PlatformResults[]
): { platform: string; product: ProductResult } | null {
  const EXCLUDED_FROM_BEST_DEAL = new Set(["Amazon (converted)", "Vijay Sales", "Blinkit"]);
  const eligible = results.filter((r) => !EXCLUDED_FROM_BEST_DEAL.has(r.platform));

  // Collect all valid prices to compute a median for sanity-checking
  const allPrices = eligible
    .flatMap((r) => r.results.map((p) => parsePrice(p.price)))
    .filter((n) => n !== Infinity)
    .sort((a, b) => a - b);

  const median =
    allPrices.length === 0
      ? Infinity
      : allPrices.length % 2 === 1
      ? allPrices[Math.floor(allPrices.length / 2)]
      : (allPrices[allPrices.length / 2 - 1] + allPrices[allPrices.length / 2]) / 2;

  let best: { platform: string; product: ProductResult } | null = null;
  let bestPrice = Infinity;

  for (const r of eligible) {
    for (const p of r.results) {
      const price = parsePrice(p.price);
      // Skip prices that are less than 20% of the median — likely accessories or bad data
      if (price < bestPrice && price >= median * 0.2) {
        bestPrice = price;
        best = { platform: r.platform, product: p };
      }
    }
  }
  return best;
}

const PLATFORM_ABBR: Record<string, string> = {
  "Flipkart":           "FKRT",
  "BigBasket":          "BGBT",
  "JioMart":            "JIOM",
  "Croma":              "CRMA",
  "Reliance Digital":   "RELD",
  "Vijay Sales":        "VJSL",
  "Blinkit":            "BLNK",
  "Amazon (converted)": "AMZN",
  "Apollo Pharmacy":    "APLO",
  "Tata 1mg":           "1MGX",
  "Nike":               "NIKE",
};

function abbr(name: string): string {
  return PLATFORM_ABBR[name] ?? name.slice(0, 4).toUpperCase();
}

const CATEGORIES = [
  { name: "All",         icon: "grid"    },
  { name: "Electronics", icon: "monitor" },
  { name: "Grocery",     icon: "basket"  },
  { name: "Pharmacy",    icon: "plus"    },
  { name: "Fashion",     icon: "shirt"   },
];

function CategoryIcon({ name }: { name: string }) {
  const cls = "w-3.5 h-3.5 shrink-0";
  switch (name) {
    case "grid":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "monitor":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case "basket":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "plus":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case "shirt":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v2a3 3 0 006 0V4M7 4H4L2 9l4 2v9h12V11l4-2-2-5h-3M7 4h10" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults]         = useState<PlatformResults[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [category, setCategory]       = useState("All");
  const [searchedAt, setSearchedAt]   = useState<Date | null>(null);
  const [analysis, setAnalysis]       = useState<AnalysisResult | null>(null);
  const [analysing, setAnalysing]     = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResults([]);
    setHasSearched(true);
    setAnalysis(null);
    setAnalysisError("");
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      setResults(await res.json());
      setSearchedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyse() {
    setAnalysing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, results }),
      });
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      setAnalysis(await res.json());
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setAnalysing(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  const bestDeal = results.length > 0 ? getBestDeal(results) : null;

  function trackedAgo(): string {
    if (!searchedAt) return "just now";
    const mins = Math.floor((Date.now() - searchedAt.getTime()) / 60000);
    return mins === 0 ? "just now" : `${mins}m ago`;
  }

  function avgSavings(): number {
    const pcts: number[] = [];
    for (const r of results) {
      const top = r.results[0];
      if (!top) continue;
      const price = parsePrice(top.price);
      const mrp   = parsePrice(top.mrp);
      if (mrp !== Infinity && price !== Infinity && mrp > price) {
        pcts.push(((mrp - price) / mrp) * 100);
      }
    }
    if (pcts.length === 0) return 0;
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }

  function cheapestRanked(): Array<{ name: string; price: number; priceStr: string }> {
    return results
      .filter((r) => r.results[0])
      .map((r) => ({
        name:     r.platform,
        price:    parsePrice(r.results[0].price),
        priceStr: formatPrice(r.results[0].price),
      }))
      .filter((r) => r.price !== Infinity)
      .sort((a, b) => a.price - b.price);
  }

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-0 md:h-14 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">

          {/* Mobile: logo + bell in one row. Desktop: logo only (bell moves to end via md:contents) */}
          <div className="flex items-center justify-between md:contents">
            <span
              className="text-2xl shrink-0 leading-none"
              style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
            >
              <span className="text-black">Price</span>
              <span className="text-green-600">Radar</span>
            </span>
            {/* Bell — mobile only */}
            <button className="md:hidden w-9 h-9 flex items-center justify-center border-2 border-black hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>

          {/* Search — full width on mobile, constrained on desktop */}
          <div className="flex flex-1 md:max-w-2xl md:mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search for any product…"
              className="flex-1 min-w-0 px-4 py-2 text-sm border-2 border-r-0 border-black bg-white outline-none focus:border-green-600 transition-colors text-black placeholder:text-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-5 py-2 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase border-2 border-black hover:bg-green-600 hover:border-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "…" : "Search"}
            </button>
          </div>

          {/* Bell — desktop only */}
          <button className="hidden md:flex shrink-0 w-9 h-9 items-center justify-center border-2 border-black hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Category Tabs ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-2.5 md:px-5 md:py-3 text-[11px] font-bold tracking-[0.12em] uppercase border-b-2 transition-colors whitespace-nowrap ${
                  category === cat.name
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-400 hover:text-black hover:border-gray-300"
                }`}
              >
                <CategoryIcon name={cat.icon} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 gap-5">
            <div className="w-9 h-9 rounded-full border-4 border-gray-200 border-t-green-600 animate-spin" />
            <p className="text-gray-400 text-xs tracking-widest uppercase text-center leading-relaxed">
              Scanning {category} platforms…
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 border-2 border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results: single col on mobile, 70/30 on lg+ */}
        {!loading && results.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Main ── */}
            <div className="w-full lg:flex-[7] min-w-0 space-y-10">

              {/* Best Deal Hero */}
              {bestDeal && (
                <section>
                  <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-col md:flex-row">

                      {/* Image */}
                      <div className="relative md:w-52 h-52 md:h-auto bg-gray-50 flex items-center justify-center shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-black">
                        <span className="absolute top-2 left-2 text-[9px] font-black tracking-widest bg-black text-white px-1.5 py-0.5 z-10">
                          {abbr(bestDeal.platform)}
                        </span>
                        {bestDeal.product.image ? (
                          <img
                            src={bestDeal.product.image}
                            alt={bestDeal.product.title}
                            className="w-full h-full object-contain p-6"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <span className="text-6xl font-black text-gray-200">
                            {bestDeal.platform[0]}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase bg-green-600 text-white px-2.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Best Price Found
                          </span>
                          <span className="text-[10px] text-gray-400 tracking-widest uppercase">
                            Tracked {trackedAgo()}
                          </span>
                        </div>

                        <p className="text-black font-semibold text-lg md:text-xl leading-snug line-clamp-3">
                          {bestDeal.product.title}
                        </p>

                        <div className="flex flex-wrap items-end gap-4 mt-auto">
                          <span
                            className="text-5xl text-black leading-none"
                            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                          >
                            {formatPrice(bestDeal.product.price)}
                          </span>
                          {parsePrice(bestDeal.product.mrp) > parsePrice(bestDeal.product.price) && (
                            <div className="flex flex-col gap-0.5 mb-1">
                              <span className="text-sm text-gray-400 line-through leading-tight">
                                {formatPrice(bestDeal.product.mrp)}
                              </span>
                              <span className="text-xs font-bold text-green-600 leading-tight">
                                Save ₹{(
                                  parsePrice(bestDeal.product.mrp) - parsePrice(bestDeal.product.price)
                                ).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>

                        <a
                          href={bestDeal.product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[11px] font-bold tracking-widest uppercase hover:bg-green-600 transition-colors"
                        >
                          Go to Store
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* AI Deal Analysis */}
              <section>
                {!analysis && !analysing && (
                  <div className="border-2 border-black">
                    <button
                      onClick={handleAnalyse}
                      className="w-full flex flex-col items-center justify-center gap-1.5 px-6 py-5 bg-black text-white hover:bg-green-600 transition-colors"
                    >
                      <span className="text-sm font-black tracking-[0.2em] uppercase">
                        ✦ Analyse This Deal
                      </span>
                      <span className="text-[10px] text-gray-400 tracking-widest">
                        AI-powered price analysis across all platforms
                      </span>
                    </button>
                    {analysisError && (
                      <p className="px-4 py-2 text-xs text-red-500 border-t border-red-200 bg-red-50">
                        {analysisError}
                      </p>
                    )}
                  </div>
                )}

                {analysing && (
                  <div className="border-2 border-black px-6 py-8 flex items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-black animate-spin shrink-0" />
                    <span className="text-xs font-bold tracking-widest uppercase text-gray-500">
                      Analysing prices with AI…
                    </span>
                  </div>
                )}

                {analysis && (
                  <div className="border-2 border-black overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-black">
                      <span className="text-xs font-black tracking-[0.2em] uppercase text-white">
                        AI Deal Analysis
                      </span>
                      <span
                        className={`text-xs font-black tracking-widest px-2.5 py-0.5 ${
                          analysis.score >= 7
                            ? "bg-green-500 text-white"
                            : analysis.score >= 5
                            ? "bg-yellow-400 text-black"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {analysis.score}/10
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Verdict + recommendation */}
                      <div className="flex flex-wrap items-start gap-3">
                        <p className="text-base font-semibold text-black leading-snug flex-1">
                          {analysis.verdict}
                        </p>
                        <span
                          className={`shrink-0 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 ${
                            analysis.recommendation === "Buy Now"
                              ? "bg-green-600 text-white"
                              : analysis.recommendation === "Wait"
                              ? "bg-yellow-400 text-black"
                              : "bg-gray-200 text-black"
                          }`}
                        >
                          {analysis.recommendation}
                        </span>
                      </div>

                      {/* Reasoning */}
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {analysis.reasoning}
                      </p>

                      {/* Best platform + savings */}
                      <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">
                            Best Platform
                          </p>
                          <span className="text-[9px] font-black tracking-widest bg-black text-white px-1.5 py-0.5">
                            {abbr(analysis.bestPlatform)}
                          </span>
                          <span className="ml-1.5 text-xs text-black font-semibold">
                            {analysis.bestPlatform}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">
                            Avg. Savings
                          </p>
                          <span
                            className="text-2xl text-green-600 leading-none"
                            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                          >
                            {analysis.savings}%
                          </span>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-[9px] text-gray-300 tracking-widest uppercase">
                        Analysis powered by Claude AI
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Platform Grid */}
              <section>
                <h2
                  className="text-lg tracking-[0.2em] uppercase text-black mb-4"
                  style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                >
                  Price Comparison
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {results.map((pr) => {
                    const top = pr.results[0];
                    return (
                      <div
                        key={pr.platform}
                        className="border-2 border-black bg-white flex flex-col hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b-2 border-black">
                          <span className="text-[9px] font-black tracking-widest uppercase bg-black text-white px-1.5 py-0.5">
                            {abbr(pr.platform)}
                          </span>
                          {pr.error ? (
                            <span className="text-[9px] font-bold tracking-widest uppercase text-red-500 border border-red-300 px-1.5 py-0.5">
                              Failed
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold tracking-widest uppercase text-green-600 border border-green-400 px-1.5 py-0.5">
                              Available
                            </span>
                          )}
                        </div>

                        {top ? (
                          <div className="flex flex-col flex-1 p-2 md:p-3 gap-2 md:gap-3">
                            {/* Image */}
                            <div className="h-24 md:h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                              {top.image ? (
                                <img
                                  src={top.image}
                                  alt={top.title}
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    const el = e.target as HTMLImageElement;
                                    el.style.display = "none";
                                    if (el.parentElement) {
                                      el.parentElement.innerHTML = `<span style="font-size:2rem;font-weight:700;color:#D1D5DB">${pr.platform[0]}</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-4xl font-bold text-gray-200">
                                  {pr.platform[0]}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-xs text-black font-medium leading-snug line-clamp-2 flex-1">
                              {top.title}
                            </p>

                            {/* Price row */}
                            <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-gray-100">
                              <div>
                                <p
                                  className="text-xl text-black leading-none tracking-wide"
                                  style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                                >
                                  {formatPrice(top.price)}
                                </p>
                                {parsePrice(top.mrp) > parsePrice(top.price) && (
                                  <p className="text-[10px] text-gray-400 line-through mt-0.5">
                                    {formatPrice(top.mrp)}
                                  </p>
                                )}
                              </div>
                              <a
                                href={top.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-black hover:text-green-600 transition-colors whitespace-nowrap"
                              >
                                View Deal
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center py-8 px-4">
                            <p className="text-xs text-gray-400 text-center">
                              {pr.error && pr.platform.includes("Amazon")
                                ? "Amazon unavailable — try again"
                                : (pr.error ?? "No results found")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* ── Savings Summary — below grid on mobile, sticky sidebar on lg+ ── */}
            <aside className="w-full lg:flex-[3] lg:sticky lg:top-20">
              <div className="border-2 border-black">
                <div className="px-4 py-3 border-b-2 border-black bg-black">
                  <h3 className="text-xs font-black tracking-[0.2em] uppercase text-white">
                    Savings Summary
                  </h3>
                </div>
                <div className="p-4 space-y-5">
                  {/* Avg savings */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 tracking-widest uppercase leading-tight">
                      Avg. Platform<br />Savings
                    </span>
                    <span
                      className="text-4xl text-green-600 leading-none"
                      style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                    >
                      {avgSavings()}%
                    </span>
                  </div>

                  {/* Cheapest ranked list */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-3">
                      Cheapest First
                    </p>
                    <ul className="space-y-2.5">
                      {cheapestRanked().map((p, i) => (
                        <li key={p.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-[9px] font-black w-3 text-center shrink-0 ${
                                i === 0 ? "text-green-600" : "text-gray-300"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="text-[8px] font-black tracking-widest bg-black text-white px-1.5 py-0.5 shrink-0">
                              {abbr(p.name)}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">{p.name}</span>
                          </div>
                          <span
                            className={`text-sm leading-none shrink-0 ${
                              i === 0 ? "text-green-600" : "text-black"
                            }`}
                            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                          >
                            {p.priceStr}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Pre-search landing */}
        {!loading && !hasSearched && (
          <div className="py-24 flex flex-col items-center gap-3 text-center">
            <span
              className="text-8xl md:text-9xl font-black text-gray-100 leading-none"
              style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
            >
              Price<span className="text-green-100">Radar</span>
            </span>
            <p className="text-gray-400 text-xs tracking-widest uppercase">
              Search above to compare prices across platforms
            </p>
          </div>
        )}

        {/* Post-search empty */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="py-28 text-center text-gray-400 text-sm tracking-widest uppercase">
            No results found
          </div>
        )}
      </div>
    </main>
  );
}
