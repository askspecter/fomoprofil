"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/** One launched coin from /api/launches, enriched with a live market cap. */
interface Item {
  token: string;
  symbol: string;
  logo: string;
  handle?: string;
  createdAt: number;
}
interface Mc {
  eth: number;
  usd: number | null;
}

function fmtMc(m: Mc | undefined): string {
  if (!m) return "";
  if (m.usd != null && m.usd > 0) {
    const n = m.usd;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  }
  const e = m.eth;
  if (e >= 1) return `${e.toFixed(2)} ETH`;
  return `${e.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
}

/**
 * A live "trading floor" tape that streams the latest coins across the top of
 * the page: ticker, avatar and live market cap, scrolling in a seamless loop.
 * Feels alive without a heavy on-chain scan — it reuses the launch feed and the
 * batched price endpoint, refreshed on an interval.
 */
export function LiveTicker() {
  const [items, setItems] = useState<Item[]>([]);
  const [mcaps, setMcaps] = useState<Record<string, Mc>>({});

  useEffect(() => {
    let off = false;
    const load = () =>
      fetch(`/api/launches?limit=24`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !off && setItems(d.items ?? []))
        .catch(() => {});
    load();
    const id = setInterval(load, 20_000);
    return () => {
      off = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    let off = false;
    const tokens = items.map((i) => i.token).join(",");
    const load = () =>
      fetch(`/api/v2/prices?tokens=${tokens}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (off || !d.prices) return;
          const next: Record<string, Mc> = {};
          for (const [k, v] of Object.entries(d.prices as Record<string, { marketCapEth: number; marketCapUsd: number | null }>)) {
            if (v && typeof v.marketCapEth === "number") next[k] = { eth: v.marketCapEth, usd: v.marketCapUsd ?? null };
          }
          setMcaps(next);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15_000);
    return () => {
      off = true;
      clearInterval(id);
    };
  }, [items]);

  // Newest first; the track renders the list twice for a seamless loop.
  const row = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return [...sorted, ...sorted];
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="marquee-mask relative overflow-hidden rounded-full border border-ink-line bg-white/[0.03] py-2">
      <div className="marquee-track gap-6 px-4">
        {row.map((it, i) => {
          const mc = mcaps[it.token.toLowerCase()];
          return (
            <Link
              key={`${it.token}-${i}`}
              href={`/launch/${it.token}`}
              className="flex shrink-0 items-center gap-2 text-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-ink-line bg-white">
                {it.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px]">🫥</span>
                )}
              </span>
              <span className="font-mono font-bold text-zinc-900">${it.symbol || "COIN"}</span>
              {mc && <span className="font-mono text-xs text-pink">{fmtMc(mc)}</span>}
              <span className="text-zinc-500">·</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
