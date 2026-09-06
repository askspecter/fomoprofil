"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FeedItem {
  token: string;
  curve: string;
  deployer: string;
  name: string | null;
  symbol: string | null;
  logo: string;
  phase: number | null;
  phaseLabel: string;
  progress: number | null;
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feed?limit=36", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setItems(d.items ?? []);
        if (d.error) setError(d.error);
      })
      .catch(() => !cancelled && setError("Couldn’t load the feed."));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Explore <span className="grad-text">profiles</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-600">Recent profile coins launched on the Pons v2 curve.</p>
        </div>
        <Link href="/create" className="btn-brand shrink-0">Launch yours →</Link>
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-zinc-600">{error ?? "No profiles yet. Be the first to launch."}</p>
          <Link href="/create" className="btn-brand mt-4 inline-flex">Launch my profile →</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.token} href={`/launch/${it.token}`} className="card card-hover flex flex-col p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-white">
                  {it.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.logo} alt={it.symbol ?? "token"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">🫥</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-zinc-900">{it.name ?? short(it.token)}</div>
                  {it.symbol && <div className="font-mono text-xs text-pink">${it.symbol}</div>}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="chip">{it.phaseLabel || "on curve"}</span>
                <span className="font-mono">by {short(it.deployer)}</span>
              </div>

              {it.progress !== null && it.phase === 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full bg-pink"
                      style={{ width: `${Math.min(100, Math.max(2, it.progress * 100)).toFixed(0)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[10px] text-zinc-400">
                    {(it.progress * 100).toFixed(1)}% to graduation
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
