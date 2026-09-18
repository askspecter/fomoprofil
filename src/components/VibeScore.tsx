"use client";

/**
 * Vibe Score — Vibz's signature 0-100 index for a coin. A single, opinionated
 * number blended from three live on-chain signals: curve momentum (how far
 * along the bonding curve, or graduated), how much supply has been burned, and
 * market size. It is a vibe indicator, not financial advice.
 */

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function computeVibeScore(input: {
  marketCapUsd?: number | null;
  marketCapEth?: number | null;
  burnedPct?: number | null;
  progress?: number | null; // 0..1 on the curve
  graduated?: boolean;
}): number {
  const momentum = input.graduated ? 100 : clamp((input.progress ?? 0) * 100);
  const burn = clamp((input.burnedPct ?? 0) * 5); // 20% burned -> full marks
  // Size on a log scale: prefer USD, fall back to a rough ETH->USD guess.
  const sizeUsd = input.marketCapUsd ?? (input.marketCapEth != null ? input.marketCapEth * 3000 : 0);
  const size = clamp((Math.log10(Math.max(sizeUsd, 1)) / 7) * 100); // ~$10M -> full marks
  return Math.round(0.4 * momentum + 0.25 * burn + 0.35 * size);
}

function tier(score: number): string {
  if (score >= 90) return "Legendary";
  if (score >= 70) return "On fire";
  if (score >= 40) return "Vibing";
  return "Warming up";
}

export function VibeScore(props: {
  marketCapUsd?: number | null;
  marketCapEth?: number | null;
  burnedPct?: number | null;
  progress?: number | null;
  graduated?: boolean;
  loading?: boolean;
}) {
  const ready = !props.loading;
  const score = ready ? computeVibeScore(props) : 0;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Vibe Score</div>
        <span className="chip">{ready ? tier(score) : "…"}</span>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="font-display text-5xl font-black grad-text tabular-nums leading-none">
          {ready ? score : "…"}
        </div>
        <div className="pb-1 text-sm text-zinc-500">/ 100</div>
      </div>

      {/* Meter */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${ready ? clamp(Math.max(3, score)) : 0}%`, background: "var(--holo)" }}
        />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Blended from live curve momentum, supply burned and market size. A vibe indicator, not
        financial advice.
      </p>
    </div>
  );
}
