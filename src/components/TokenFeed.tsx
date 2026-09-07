"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/** A profile coin launched through Dime (from /api/launches). */
interface LaunchItem {
  token: string;
  name: string;
  symbol: string;
  logo: string;
  handle?: string;
  deployer: string;
  createdAt: number;
}

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function ago(ts: number): string {
  if (!ts) return "";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Feed of profile coins launched through Dime (not the whole Pons chain).
 * Sourced from Dime's own launch records, so only tokens created here appear.
 */
function fmtEth(x: number): string {
  if (x >= 1000) return `${(x / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return x.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function TokenFeed({ limit = 48 }: { limit?: number }) {
  const [items, setItems] = useState<LaunchItem[] | null>(null);
  const [mcaps, setMcaps] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/launches?limit=${limit}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setItems(d.items ?? []))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [limit]);

  // Enrich cards with market cap (best-effort, one batched request).
  useEffect(() => {
    if (!items || items.length === 0) return;
    let cancelled = false;
    const tokens = items.map((i) => i.token).join(",");
    fetch(`/api/v2/prices?tokens=${tokens}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.prices) return;
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(d.prices as Record<string, { marketCapEth: number }>)) {
          if (v && typeof v.marketCapEth === "number") next[k] = v.marketCapEth;
        }
        setMcaps(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-zinc-600">No profiles launched on Dime yet. Be the first.</p>
        <Link href="/create" className="btn-brand mt-4 inline-flex">Launch my profile →</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it.token} className="card card-hover flex flex-col p-4">
          <Link href={`/launch/${it.token}`} className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-white">
              {it.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.logo} alt={it.symbol ?? "token"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg">🫥</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-zinc-900">{it.name || short(it.token)}</div>
              {it.symbol && <div className="font-mono text-xs text-pink">${it.symbol}</div>}
            </div>
            {mcaps[it.token.toLowerCase()] != null && (
              <div className="shrink-0 text-right">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">MC</div>
                <div className="text-xs font-bold text-zinc-900">{fmtEth(mcaps[it.token.toLowerCase()])} ETH</div>
              </div>
            )}
          </Link>

          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
            {it.handle ? (
              <a
                href={`https://fomo.family/${it.handle.replace(/^@+/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="truncate font-medium text-pink hover:underline"
                title="Fee recipient · fomo.family profile"
              >
                @{it.handle.replace(/^@+/, "")}
              </a>
            ) : (
              <span className="font-mono">by {short(it.deployer)}</span>
            )}
            <span>{ago(it.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
