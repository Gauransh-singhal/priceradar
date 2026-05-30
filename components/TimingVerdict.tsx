import type { ReactNode } from "react";

type Verdict = "BUY_NOW" | "WAIT" | "MONITOR";

interface Props {
  verdict: Verdict;
  reason: string;
}

const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; pillBg: string; pillText: string; icon: ReactNode }
> = {
  BUY_NOW: {
    label: "BUY NOW",
    pillBg: "#006C49",
    pillText: "#fff",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  WAIT: {
    label: "WAIT",
    pillBg: "#FFBF00",
    pillText: "#000",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  MONITOR: {
    label: "MONITOR",
    pillBg: "#EF4444",
    pillText: "#fff",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
};

export default function TimingVerdict({ verdict, reason }: Props) {
  const cfg = VERDICT_CONFIG[verdict];

  return (
    <div
      className="border-l-2 border-r-2 border-b-2 border-black bg-white px-5 py-4"
      style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Pill badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest uppercase"
          style={{
            backgroundColor: cfg.pillBg,
            color: cfg.pillText,
            borderRadius: "4px",
          }}
        >
          {cfg.icon}
          {cfg.label}
        </span>

        {/* Reason */}
        <p className="text-xs text-gray-500 leading-relaxed flex-1 min-w-[180px]">
          {reason}
        </p>
      </div>

      {/* Disclaimer */}
      <p
        className="mt-3 text-[8px] tracking-widest uppercase text-gray-300"
        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
      >
        BASED ON SEASONAL PATTERNS · NOT FINANCIAL ADVICE
      </p>
    </div>
  );
}
