import { NextResponse } from "next/server";
import { getAddress, isAddress, parseAbi, type Address } from "viem";
import { getKv } from "@/lib/kv";
import { ponsClient } from "@/lib/pons/reader";
import { ethUsd } from "@/lib/eth-price";
import { readPrice, priceCacheKey, type Cached } from "@/lib/pons/price";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/stats
 * Live protocol totals for the /stats page and milestone posts:
 *  - profiles tokenized (count of Dime launches)
 *  - aggregate market cap of coins still on the curve
 *  - total raised into the curves (a proxy for cumulative buy volume)
 *  - $DIME bought back and burned, when the token + burn address are configured
 *
 * Per-token figures come from the same price cache the feed warms; misses are
 * read one at a time (not in a burst) so the RPC is never overwhelmed. The
 * summary is cached in KV for a minute.
 */
const LAUNCH_KEY = "fomo:launches";
const STATS_KEY = "stats:summary";
const DEAD = "0x000000000000000000000000000000000000dEaD";
const erc20 = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
]);

export async function GET() {
  const kv = getKv();
  if (kv) {
    try {
      const cached = await kv.get<Record<string, unknown>>(STATS_KEY);
      if (cached) return NextResponse.json({ ...cached, cached: true });
    } catch {
      // ignore
    }
  }

  // Launches (count + token addresses) from Dime's own records.
  let launches = 0;
  let tokens: Address[] = [];
  if (kv) {
    try {
      const raw = (await kv.lrange<string>(LAUNCH_KEY, 0, 499)) ?? [];
      const recs = raw
        .map((r) => {
          try {
            return typeof r === "string" ? (JSON.parse(r) as { token?: string }) : (r as { token?: string });
          } catch {
            return null;
          }
        })
        .filter((r): r is { token: string } => !!r && typeof r.token === "string" && isAddress(r.token));
      launches = recs.length;
      tokens = recs.map((r) => getAddress(r.token)).slice(0, 120);
    } catch {
      // ignore
    }
  }

  const usd = await ethUsd();

  // Aggregate market cap + total raised, one token at a time (cache first).
  let mcEth = 0;
  let raisedEth = 0;
  let priced = 0;
  for (const t of tokens) {
    let p: Cached | null = null;
    if (kv) {
      try {
        p = await kv.get<Cached>(priceCacheKey(t));
      } catch {
        // ignore
      }
    }
    if (!p) {
      p = await readPrice(t).catch(() => null);
      if (p && kv) {
        try {
          await kv.set(priceCacheKey(t), p, { ex: 300 });
        } catch {
          // ignore
        }
      }
    }
    if (p) {
      mcEth += p.marketCapEth;
      raisedEth += typeof p.raisedEth === "number" ? p.raisedEth : 0;
      priced++;
    }
  }

  // $DIME buyback + burn: balance held at the burn address.
  let burn: { amount: number; pct: number | null } | null = null;
  const dime = process.env.NEXT_PUBLIC_DIME_TOKEN?.trim();
  const burnAddr = process.env.NEXT_PUBLIC_BURN_ADDRESS?.trim() || DEAD;
  if (dime && isAddress(dime) && isAddress(burnAddr)) {
    try {
      const [burned, supply] = await Promise.all([
        ponsClient().readContract({ address: getAddress(dime), abi: erc20, functionName: "balanceOf", args: [getAddress(burnAddr)] }),
        ponsClient().readContract({ address: getAddress(dime), abi: erc20, functionName: "totalSupply" }),
      ]);
      const b = Number(burned as bigint) / 1e18;
      const s = Number(supply as bigint) / 1e18;
      burn = { amount: b, pct: s > 0 ? (b / s) * 100 : null };
    } catch {
      // ignore
    }
  }

  const summary = {
    launches,
    marketCapEth: mcEth,
    marketCapUsd: usd != null ? mcEth * usd : null,
    raisedEth,
    raisedUsd: usd != null ? raisedEth * usd : null,
    burn,
    ethUsd: usd,
    updatedAt: Date.now(),
  };

  if (kv) {
    try {
      // Cache the good summary for a minute; if nothing priced (transient RPC
      // failure) cache only briefly so it recomputes soon instead of showing 0.
      await kv.set(STATS_KEY, summary, { ex: priced > 0 ? 60 : 10 });
    } catch {
      // ignore
    }
  }

  return NextResponse.json(summary);
}
