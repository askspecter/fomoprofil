import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { ethUsd } from "@/lib/eth-price";
import { getKv } from "@/lib/kv";
import { readPrice, priceCacheKey, PRICE_TTL, type Cached } from "@/lib/pons/price";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/v2/prices?tokens=0x..,0x..
 * Market cap for a batch of tokens, for the feed cards. Reads run through the
 * batched RPC client and each token's ETH-denominated market cap is cached, so
 * a whole feed page costs at most one batched RPC round trip. The USD figure is
 * computed at response time from a single shared ETH price, so every card is
 * consistently in USD (never a mix of ETH and USD). Best-effort: a token that
 * can't be read is simply omitted.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokens = (searchParams.get("tokens") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is Address => isAddress(t))
    .slice(0, 24);

  if (tokens.length === 0) return NextResponse.json({ prices: {} });

  const kv = getKv();
  const cached: Record<string, Cached> = {};
  const misses: Address[] = [];

  if (kv) {
    await Promise.all(
      tokens.map(async (t) => {
        try {
          const hit = await kv.get<Cached>(priceCacheKey(t));
          if (hit && typeof hit.marketCapEth === "number") cached[t.toLowerCase()] = hit;
          else misses.push(t);
        } catch {
          misses.push(t);
        }
      }),
    );
  } else {
    misses.push(...tokens);
  }

  await Promise.all(
    misses.map(async (t) => {
      const p = await readPrice(t).catch(() => null);
      if (!p) return;
      cached[t.toLowerCase()] = p;
      if (kv) {
        try {
          await kv.set(priceCacheKey(t), p, { ex: PRICE_TTL });
        } catch {
          // ignore
        }
      }
    }),
  );

  // One shared ETH price for the whole batch → consistent USD everywhere.
  const usd = Object.keys(cached).length > 0 ? await ethUsd() : null;
  const prices: Record<string, { marketCapEth: number; marketCapUsd: number | null }> = {};
  for (const [k, v] of Object.entries(cached)) {
    // Default to native when unknown (older cache entries, or the overwhelming
    // majority of ETH-paired coins) so USD is shown consistently, never a mix.
    const native = v.isNative !== false;
    prices[k] = {
      marketCapEth: v.marketCapEth,
      marketCapUsd: native && usd != null ? v.marketCapEth * usd : null,
    };
  }

  return NextResponse.json({ prices, ethUsd: usd });
}
