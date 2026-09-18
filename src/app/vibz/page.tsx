"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress, zeroAddress, type Address } from "viem";
import { CurveTradeWidget } from "@/components/CurveTradeWidget";
import { VibeScore } from "@/components/VibeScore";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/site";
import { explorerToken, explorerUrl } from "@/lib/chain";

interface CurveData {
  quoteReserve: string;
  tokenReserve: string;
  sellableTokens: string;
  feeBps: string;
  creatorTaxBps: string;
  progress: number;
  graduated: boolean;
  readyToGraduate: boolean;
}
interface TokenData {
  token: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  deployer: string;
  curveAddress: string;
  pairToken: string;
  phase: number;
  phaseLabel: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  priceEth: number | null;
  marketCapEth: number | null;
  graduated?: boolean;
  curve: CurveData | null;
  error?: string;
}
interface BurnData {
  totalSupply: number;
  burned: number;
  circulating: number;
  burnedPct: number;
  error?: string;
}

const ADDRESS = SITE.tokenAddress;
const CONFIGURED = isAddress(ADDRESS);

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}
function compact(n: number | null | undefined, opts?: { money?: boolean }): string {
  if (n == null || !Number.isFinite(n)) return "N/A";
  const p = opts?.money ? "$" : "";
  const a = Math.abs(n);
  if (a >= 1e9) return `${p}${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${p}${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${p}${(n / 1e3).toFixed(1)}K`;
  if (opts?.money && a < 1) return `${p}${n.toFixed(a < 0.01 ? 6 : 4)}`;
  return `${p}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function VibzTokenPage() {
  const [data, setData] = useState<TokenData | null>(null);
  const [burn, setBurn] = useState<BurnData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!CONFIGURED) return;
    let cancelled = false;
    const load = () => {
      fetch(`/api/v2/token?address=${ADDRESS}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && !d.error && setData(d))
        .catch(() => {});
      fetch(`/api/v2/burn?address=${ADDRESS}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => !cancelled && !d.error && setBurn(d))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  function copyCa() {
    navigator.clipboard?.writeText(ADDRESS).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  // ── Not configured yet: honest placeholder until $VIBZ launches ──
  if (!CONFIGURED) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
        <div className="card p-8 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center">
            <Logo className="h-16 w-16" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-black text-zinc-900">
            <span className="grad-text">${SITE.tokenSymbol}</span> is coming
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-600">
            The official {SITE.tokenSymbol} token page goes live the moment {SITE.tokenSymbol} launches
            on the {SITE.poweredBy} bonding curve. Live price and live burn will read straight from the
            chain here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/create?type=profile" className="btn-brand">Launch a coin →</Link>
            <Link href="/" className="btn-ghost">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  const onCurve = !!data && data.phase === 0 && !!data.curve && !data.curve.graduated;
  const pairToken = ((data?.pairToken as Address) || zeroAddress) as Address;
  const isNative = !data?.pairToken || data.pairToken === zeroAddress;
  const price = isNative ? data?.priceUsd ?? null : data?.priceEth ?? null;
  const mcap = isNative ? data?.marketCapUsd ?? null : data?.marketCapEth ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:pt-14">
      {/* ── Hero ── */}
      <div className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <Logo className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="wordmark text-2xl">${SITE.tokenSymbol}</h1>
              <span className="chip chip-accent">Official token</span>
              {data && <span className="chip">{data.phaseLabel}</span>}
              {data?.curve?.readyToGraduate && <span className="chip chip-accent">ready to graduate</span>}
            </div>
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              The official {SITE.tokenSymbol} token, live on the {SITE.poweredBy} bonding curve on{" "}
              {SITE.chain}. Price and burn below read straight from the chain.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
              <button onClick={copyCa} className="inline-flex items-center gap-1 font-mono transition hover:text-pink" title="Copy contract address">
                CA {short(ADDRESS)} <span>{copied ? "✓ Copied" : "⧉"}</span>
              </button>
              <a href={explorerToken(ADDRESS)} target="_blank" rel="noreferrer" className="hover:text-pink">Explorer ↗</a>
              {data?.curveAddress && data.curveAddress !== zeroAddress && (
                <a href={`${explorerUrl}/address/${data.curveAddress}`} target="_blank" rel="noreferrer" className="hover:text-pink">
                  Curve {short(data.curveAddress)} ↗
                </a>
              )}
              <Link href={`/launch/${ADDRESS}`} className="hover:text-pink">Full chart & comments →</Link>
            </div>
          </div>
        </div>

        {/* Live stat tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Price" value={compact(price, { money: isNative })} live={!!data} />
          <Stat label="Market cap" value={compact(mcap, { money: isNative })} live={!!data} />
          <Stat label="Burned" value={burn ? `${burn.burnedPct.toFixed(2)}%` : "…"} live={!!burn} accent />
          <Stat label="Circulating" value={burn ? compact(burn.circulating) : "…"} live={!!burn} />
        </div>

        {/* Graduation moment */}
        {data?.graduated && (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/20 bg-white/[0.05] p-3 text-center">
            <div className="grad-text font-display text-sm font-black uppercase tracking-[0.28em] animate-glow-pulse">
              Graduated to Uniswap V4
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">This coin cleared the bonding curve. It now trades on a Uniswap V4 pool.</div>
          </div>
        )}

        {/* Bonding-curve progress */}
        {onCurve && data?.curve && (
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Bonding curve progress</span>
              <span>{(data.curve.progress * 100).toFixed(1)}% to graduation</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div className="h-full rounded-full bg-pink" style={{ width: `${Math.min(100, Math.max(2, data.curve.progress * 100)).toFixed(0)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Vibe Score (signature index) ── */}
      <div className="mt-6">
        <VibeScore
          marketCapUsd={data?.marketCapUsd ?? null}
          marketCapEth={data?.marketCapEth ?? null}
          burnedPct={burn?.burnedPct ?? null}
          progress={data?.curve?.progress ?? null}
          graduated={data?.graduated}
          loading={!data}
        />
      </div>

      {/* ── Body: burn + trade ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,0.85fr]">
        {/* Live burn */}
        <div className="card p-5 sm:p-6">
          <div className="eyebrow">Live burn</div>
          <p className="mt-2 text-sm text-zinc-600">
            Tokens sent to the burn address are gone forever. Read live from chain (0x…dEaD + zero
            address), refreshed every 15s.
          </p>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Total burned</div>
              <div className="font-display text-3xl font-black text-zinc-900">
                {burn ? compact(burn.burned) : "…"} <span className="text-base text-zinc-500">${SITE.tokenSymbol}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">of supply</div>
              <div className="font-display text-2xl font-black grad-text">{burn ? `${burn.burnedPct.toFixed(2)}%` : "…"}</div>
            </div>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-pink transition-all duration-700" style={{ width: `${burn ? Math.min(100, Math.max(0.5, burn.burnedPct)).toFixed(2) : 0}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-ink-line bg-white/50 p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Total supply</div>
              <div className="mt-0.5 font-mono font-semibold text-zinc-900">{burn ? compact(burn.totalSupply) : "…"}</div>
            </div>
            <div className="rounded-xl border border-ink-line bg-white/50 p-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Circulating</div>
              <div className="mt-0.5 font-mono font-semibold text-zinc-900">{burn ? compact(burn.circulating) : "…"}</div>
            </div>
          </div>
        </div>

        {/* Trade on the real Pons curve */}
        <div>
          {onCurve && data?.curve ? (
            <CurveTradeWidget
              curveAddress={data.curveAddress as Address}
              token={data.token as Address}
              symbol={data.symbol}
              decimals={data.decimals}
              pairToken={pairToken}
              curve={{
                quoteReserve: data.curve.quoteReserve,
                tokenReserve: data.curve.tokenReserve,
                sellableTokens: data.curve.sellableTokens,
                feeBps: data.curve.feeBps,
                creatorTaxBps: data.curve.creatorTaxBps,
              }}
            />
          ) : (
            <div className="card p-5 text-sm text-zinc-600">
              <h2 className="text-sm font-medium text-zinc-700">Trading</h2>
              <p className="mt-2">
                {data
                  ? `$${SITE.tokenSymbol} has graduated off the bonding curve. Trade it on the graduated Uniswap V4 pool via the explorer.`
                  : "Loading live curve state from Robinhood Chain…"}
              </p>
              <a href={explorerToken(ADDRESS)} target="_blank" rel="noreferrer" className="btn-ghost mt-3 inline-flex">
                View on explorer ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, live, accent }: { label: string; value: string; live: boolean; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-ink-line bg-white/50 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${live ? "bg-pink" : "bg-zinc-500"}`} title={live ? "live" : "loading"} />
      </div>
      <div className={`mt-0.5 font-display text-xl font-black ${accent ? "grad-text" : "text-zinc-900"}`}>{value}</div>
    </div>
  );
}
