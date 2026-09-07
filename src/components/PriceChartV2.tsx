"use client";

import { useEffect, useState } from "react";

interface Point {
  block: number;
  price: number;
  priceUsd: number | null;
}

/**
 * Price + market cap for a profile coin, taken from the live curve state (which
 * always loads), with a trade-history chart layered on when events are indexed.
 * The price never depends on the slower event scan, so this card is never blank.
 */
export function PriceChartV2({
  token,
  priceEth,
  marketCapEth,
  quoteSymbol = "ETH",
}: {
  token: string;
  priceEth?: number | null;
  marketCapEth?: number | null;
  quoteSymbol?: string;
}) {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => !cancelled && setPoints((p) => p ?? []), 6000); // never hang on the pulse
    fetch(`/api/v2/token/chart?address=${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setPoints(d.points ?? []))
      .catch(() => !cancelled && setPoints([]))
      .finally(() => clearTimeout(t));
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [token]);

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Price</h2>
          <div className="mt-1 text-2xl font-black tracking-tight text-zinc-900">
            {priceEth != null && priceEth > 0 ? `${fmt(priceEth)} ${quoteSymbol}` : `— ${quoteSymbol}`}
          </div>
        </div>
        {marketCapEth != null && marketCapEth > 0 && (
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Market cap</div>
            <div className="mt-1 font-bold text-zinc-900">{fmt(marketCapEth)} {quoteSymbol}</div>
          </div>
        )}
      </div>

      {points === null ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-white/5" />
      ) : (
        <Chart points={points} />
      )}
    </section>
  );
}

function Chart({ points }: { points: Point[] }) {
  const vals = points.map((p) => p.price);
  const W = 600;
  const H = 160;
  const pad = 10;

  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const range = max - min || 1;
  const flat = vals.length < 2;

  const pointFor = (v: number, i: number, n: number) => {
    const x = pad + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad * 2));
    const y = flat ? H * 0.62 : pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  };

  const drawn = flat
    ? [pointFor(0, 0, 2), pointFor(0, 1, 2)]
    : vals.map((v, i) => pointFor(v, i, vals.length));

  const line = drawn.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`;

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pxfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9b8ff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#a9b8ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pxline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8fd0ff" />
            <stop offset="0.6" stopColor="#a9b8ff" />
            <stop offset="1" stopColor="#c9a2ff" />
          </linearGradient>
        </defs>
        {!flat && <path d={area} fill="url(#pxfill)" stroke="none" />}
        <path d={line} fill="none" stroke="url(#pxline)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-1 text-[10px] text-zinc-500">
        {flat ? "The line fills in as the curve trades." : `${points.length} curve trades · from on-chain events`}
      </p>
    </div>
  );
}

function fmt(x: number): string {
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return x.toFixed(12).replace(/0+$/, "").replace(/\.$/, "");
}
