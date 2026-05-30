"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "priceradar_recent";

interface Props {
  onSelect: (term: string) => void;
  refreshTrigger: number;
}

export default function RecentSearches({ onSelect, refreshTrigger }: Props) {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSearches(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setSearches([]);
    }
  }, [refreshTrigger]);

  if (searches.length === 0) return null;

  function remove(term: string) {
    const updated = searches.filter((s) => s !== term);
    setSearches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap"
      style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      {/* Label */}
      <span
        className="text-[9px] font-black tracking-widest uppercase text-gray-400 shrink-0"
        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
      >
        RECENT
      </span>

      {/* Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {searches.map((term) => (
          <div
            key={term}
            className="group flex items-center gap-1.5 border border-gray-200 bg-white px-2.5 py-1 hover:border-black transition-colors cursor-pointer"
            style={{ borderRadius: "4px" }}
            onClick={() => onSelect(term)}
          >
            {/* Clock icon */}
            <svg
              className="w-3 h-3 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <span className="text-xs text-gray-600 leading-none max-w-[140px] truncate">
              {term}
            </span>

            {/* Dismiss button */}
            <button
              className="w-3.5 h-3.5 flex items-center justify-center text-gray-300 hover:text-black transition-colors shrink-0 -mr-0.5"
              onClick={(e) => {
                e.stopPropagation();
                remove(term);
              }}
              aria-label={`Remove ${term}`}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
