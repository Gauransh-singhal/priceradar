"use client";

const PLATFORM_ABBR: Record<string, string> = {
  Flipkart: "FKRT",
  BigBasket: "BGBT",
  JioMart: "JIOM",
  Croma: "CRMA",
  "Reliance Digital": "RELD",
  "Vijay Sales": "VJSL",
  Blinkit: "BLNK",
  "Amazon (converted)": "AMZN",
  "Apollo Pharmacy": "APLO",
  "Tata 1mg": "1MGX",
  Nike: "NIKE",
};

function abbr(name: string): string {
  return PLATFORM_ABBR[name] ?? name.slice(0, 4).toUpperCase();
}

interface ChartEntry {
  platform: string;
  price: number | null;
}

interface Props {
  results: ChartEntry[];
}

export default function PriceSpreadChart({ results }: Props) {
  const valid = results.filter(
    (r): r is { platform: string; price: number } => r.price !== null
  );

  if (valid.length === 0) return null;

  const prices = valid.map((r) => r.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const spread = maxPrice - minPrice;

  const cheapest = valid.reduce((a, b) => (a.price < b.price ? a : b));

  function barWidth(price: number): number {
    if (maxPrice === minPrice) return 100;
    return 15 + ((price - minPrice) / (maxPrice - minPrice)) * 85;
  }

  return (
    <div
      className="border border-gray-200 overflow-hidden"
      style={{ borderRadius: "4px", fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-black">
        <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white">
          Price Spread Analysis
        </span>
      </div>

      {/* Chart rows */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        {results.map((entry) => {
          const hasData = entry.price !== null;
          const isLowest = hasData && entry.price === minPrice;
          const isHighest = hasData && entry.price === maxPrice;
          const width = hasData ? barWidth(entry.price!) : 0;

          return (
            <div key={entry.platform} className="flex items-center gap-3">
              {/* Platform abbr */}
              <span className="w-10 shrink-0 text-[9px] font-black tracking-widest uppercase text-gray-400">
                {abbr(entry.platform)}
              </span>

              {/* Bar track */}
              <div className="flex-1 h-6 bg-gray-50 rounded-sm overflow-hidden">
                {hasData ? (
                  <div
                    className={`h-full ${
                      isLowest
                        ? "bg-[#006C49]"
                        : isHighest
                        ? "bg-black"
                        : "bg-[#E2E2E2]"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                ) : (
                  <div className="h-full flex items-center px-2">
                    <span className="text-[7px] font-black tracking-widest text-gray-300 uppercase">
                      NO DATA
                    </span>
                  </div>
                )}
              </div>

              {/* Price + LOWEST badge */}
              <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                {isLowest && (
                  <span
                    className="text-[7px] font-black tracking-widest bg-[#006C49] text-white px-1.5 py-0.5"
                    style={{ borderRadius: "2px" }}
                  >
                    LOWEST
                  </span>
                )}
                <span
                  className="text-xs text-right leading-none"
                  style={{
                    fontFamily: "var(--font-geist-mono, monospace)",
                    color: !hasData ? "#d1d5db" : isLowest ? "#006C49" : "#000",
                    minWidth: "72px",
                  }}
                >
                  {hasData ? `₹${entry.price!.toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market spread callout */}
      {spread > 0 && (
        <div className="px-4 pb-4 pt-2">
          <div className="bg-[#006C49] px-4 py-3" style={{ borderRadius: "4px" }}>
            <span
              className="text-[9px] font-black tracking-widest text-white uppercase"
              style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
            >
              MARKET SPREAD: ₹{spread.toLocaleString("en-IN")} — BUY FROM{" "}
              {cheapest.platform.toUpperCase()} TO SAVE MAX
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
