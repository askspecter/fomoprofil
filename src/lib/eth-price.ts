import { getKv } from "./kv";

/**
 * ETH/USD spot price for denominating market caps in USD. Cached in KV (shared
 * across serverless invocations) so every card and page uses the SAME price and
 * USD figures are consistent. Falls back to a second source and to the last
 * known value, so a flaky feed never leaves some coins in USD and others in ETH.
 */
const FRESH = "ethusd:fresh";
const LAST = "ethusd:last";
let mem: { usd: number; at: number } | null = null;

async function fromCoinbase(): Promise<number | null> {
  try {
    const r = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const d = (await r.json()) as { data?: { amount?: string } };
    const n = Number(d?.data?.amount);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

async function fromLlama(): Promise<number | null> {
  try {
    const r = await fetch("https://coins.llama.fi/prices/current/coingecko:ethereum", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const d = (await r.json()) as { coins?: Record<string, { price?: number }> };
    const n = d?.coins?.["coingecko:ethereum"]?.price;
    return typeof n === "number" && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export async function ethUsd(): Promise<number | null> {
  if (mem && Date.now() - mem.at < 60_000) return mem.usd;

  const kv = getKv();
  if (kv) {
    try {
      const cached = await kv.get<number>(FRESH);
      if (cached && cached > 0) {
        mem = { usd: cached, at: Date.now() };
        return cached;
      }
    } catch {
      // ignore
    }
  }

  const usd = (await fromCoinbase()) ?? (await fromLlama());
  if (usd) {
    mem = { usd, at: Date.now() };
    if (kv) {
      try {
        await kv.set(FRESH, usd, { ex: 60 });
        await kv.set(LAST, usd); // durable last-known
      } catch {
        // ignore
      }
    }
    return usd;
  }

  // Both sources failed: use the durable last-known so USD stays consistent.
  if (kv) {
    try {
      const last = await kv.get<number>(LAST);
      if (last && last > 0) return last;
    } catch {
      // ignore
    }
  }
  return mem?.usd ?? null;
}
