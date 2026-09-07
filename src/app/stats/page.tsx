"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  launches: number;
  marketCapUsd: number | null;
  marketCapEth: number;
  raisedUsd: number | null;
  raisedEth: number;
  burn: { amount: number; pct: number | null } | null;
  updatedAt: number;
}

function usd(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function eth(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K ETH`;
  if (n >= 1) return `${n.toFixed(2)} ETH`;
  return `${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ETH`;
}

function num(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-2 font-display text-4xl font-black tracking-tight">
        <span className="grad-text">{value}</span>
      </div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/stats", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && setS(d))
        .catch(() => !cancelled && setError(true));
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
        Dime <span className="grad-text">stats</span>
      </h1>
      <p className="mt-2 text-sm text-zinc-600">Live protocol totals, straight from the chain and Dime records.</p>

      {s === null ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Tile label="Profiles tokenized" value={num(s.launches)} />
            <Tile label="Total market cap" value={usd(s.marketCapUsd)} sub={eth(s.marketCapEth)} />
            <Tile
              label="Total raised on curves"
              value={usd(s.raisedUsd)}
              sub={eth(s.raisedEth)}
            />
            {s.burn ? (
              <Tile
                label="$DIME burned"
                value={num(s.burn.amount)}
                sub={s.burn.pct != null ? `${s.burn.pct.toFixed(2)}% of supply · buyback & burn` : "buyback & burn"}
              />
            ) : (
              <Tile label="$DIME burned" value="—" sub="Set the $DIME token to track burns" />
            )}
          </div>
          <p className="mt-4 text-[11px] text-zinc-500">
            Market cap and total raised cover coins currently on the curve. Updates every 30 seconds.
          </p>
        </>
      )}

      {error && s === null && (
        <p className="mt-6 text-sm text-red-600">Couldn’t load stats right now.</p>
      )}

      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-ghost">← Home</Link>
        <Link href="/create" className="btn-brand">Launch my profile →</Link>
      </div>
    </div>
  );
}
