"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TICKER_TEXT =
  "● CONCURRENTLY SCANNING 9 INDIAN PLATFORMS...  FKRT · AMZN · CRMA · BGBT · BLNK · JIOM · VJSL · RELD · NIKE  ●  CONCURRENTLY SCANNING 9 INDIAN PLATFORMS...  FKRT · AMZN · CRMA · BGBT · BLNK · JIOM · VJSL · RELD · NIKE  ";

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const tickerRef = useRef<HTMLDivElement>(null);

  function handleSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`/?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  // Continuous ticker animation via JS so it loops seamlessly
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let x = 0;
    let raf: number;
    function tick() {
      x -= 0.6;
      if (Math.abs(x) >= el!.scrollWidth / 2) x = 0;
      el!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span
            className="text-2xl leading-none"
            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
          >
            <span className="text-black">PriceRadar</span>
            <span className="text-green-600"> India</span>
          </span>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-green-600 transition-colors"
          >
            Launch App →
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center px-4 py-24 md:py-36 text-center overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, #D1D5DB 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundColor: "#FAFAFA",
        }}
      >
        {/* bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 w-full max-w-3xl">
          {/* Eyebrow */}
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-green-600 mb-4">
            ● Live · 9 Platforms · India
          </p>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-7xl md:text-8xl leading-none tracking-wide text-black mb-6"
            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
          >
            Stop Overpaying.{" "}
            <span className="text-green-600">Scan Everything</span>{" "}
            Simultaneously.
          </h1>

          {/* Subtext */}
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Compare prices across Flipkart, Amazon, Croma, BigBasket and 6 more
            platforms. AI-powered deal analysis included.
          </p>

          {/* Search bar */}
          <div className="flex shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search any product — ps5, iphone 17, whey protein…"
              className="flex-1 min-w-0 px-5 py-4 text-sm border-2 border-r-0 border-black bg-white outline-none focus:border-green-600 transition-colors text-black placeholder:text-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="px-6 py-4 bg-black text-white text-[11px] font-bold tracking-[0.2em] uppercase border-2 border-black hover:bg-green-600 hover:border-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Search
            </button>
          </div>

          {/* Ticker */}
          <div className="mt-8 overflow-hidden border-t border-b border-gray-200 py-2.5 -mx-4">
            <div ref={tickerRef} className="flex whitespace-nowrap will-change-transform">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                {TICKER_TEXT}
              </span>
              {/* Duplicate for seamless loop */}
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                {TICKER_TEXT}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="bg-gray-50 border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 md:gap-16">

          {/* Mock browser tabs illustration */}
          <div className="w-full md:w-1/2 shrink-0">
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              {/* Tab bar */}
              <div className="flex border-b-2 border-black overflow-hidden">
                {["Flipkart", "Amazon", "Croma", "BigBasket", "+ 5 more"].map((t, i) => (
                  <div
                    key={t}
                    className={`px-3 py-2 text-[9px] font-bold tracking-widest uppercase border-r border-gray-200 whitespace-nowrap shrink-0 ${
                      i === 0 ? "bg-white text-black" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {t}
                  </div>
                ))}
              </div>
              {/* Mock content rows */}
              <div className="p-4 space-y-3">
                {[
                  { label: "Flipkart", price: "₹49,990", w: "60%" },
                  { label: "Amazon",   price: "₹52,499", w: "75%" },
                  { label: "Croma",    price: "₹54,990", w: "55%" },
                  { label: "?",        price: "₹??",     w: "40%" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-[9px] font-black tracking-widest uppercase bg-black text-white px-1.5 py-0.5 w-12 text-center shrink-0">
                      {row.label}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{ width: row.w }}
                      />
                    </div>
                    <span className="text-xs font-bold text-black shrink-0 w-16 text-right">
                      {row.price}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 text-center pt-2 tracking-widest uppercase">
                  …still checking 5 more tabs
                </p>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="w-full md:w-1/2">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-4">
              [ The old way: 9 apps, 9 tabs, zero clarity ]
            </p>
            <h2
              className="text-4xl md:text-5xl text-black leading-tight mb-5"
              style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
            >
              Price fragmentation is the{" "}
              <span className="text-green-600">tax on your time.</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Searching manually means missing flash sales and price drops.
              PriceRadar consolidates everything into one search — nine platforms
              hit simultaneously, results back in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-green-600 mb-3 text-center">
            What you get
          </p>
          <h2
            className="text-4xl md:text-5xl text-black text-center mb-14"
            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
          >
            Everything. One Search.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "⚡",
                title: "Instant Cross-Platform Search",
                body: "Search once across 9 Indian platforms simultaneously. Results in under a minute.",
              },
              {
                icon: "🤖",
                title: "AI Deal Analysis",
                body: "Claude AI analyses prices and tells you if it's worth buying — score, verdict, and recommendation.",
              },
              {
                icon: "📊",
                title: "Category Intelligence",
                body: "Electronics, Grocery, Pharmacy, Fashion — right platforms queried every time, no noise.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <span className="text-3xl block mb-4">{card.icon}</span>
                <h3
                  className="text-xl text-black mb-3"
                  style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
                >
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-black border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col items-center text-center gap-8">
          <h2
            className="text-5xl md:text-7xl text-white leading-none"
            style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
          >
            Ready to stop{" "}
            <span className="text-green-500">overpaying?</span>
          </h2>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-green-500 hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]"
          >
            Launch PriceRadar →
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black border-t border-gray-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">
            PriceRadar India · Built for Anakin Build-a-thon 2026
          </span>
          <span className="text-[10px] text-gray-600 tracking-widest uppercase">
            Powered by Anakin Wire API
          </span>
        </div>
      </footer>
    </main>
  );
}
