import { NextResponse } from "next/server";
import { getAddress, isAddress, parseAbi, zeroAddress, type Address } from "viem";
import { getKv } from "@/lib/kv";
import { getCurveState, getLaunchedTokenV2 } from "@/lib/pons/readerV2";
import { ponsClient } from "@/lib/pons/reader";
import { ethUsd } from "@/lib/eth-price";

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
 * The whole summary is cached in KV for a minute, so viewing the page never
 * hammers the RPC.
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

  // Aggregate market cap + total raised across coins still on the curve.
  let mcEth = 0;
  let raisedEth = 0;
  await Promise.all(
    tokens.map(async (t) => {
      try {
        const rec = await getLaunchedTokenV2(t);
        if (!rec.exists || rec.phase !== 0 || !rec.curve || rec.curve === zeroAddress) return;
        const [curve, supplyRaw] = await Promise.all([
          getCurveState(rec.curve),
          ponsClient().readContract({ address: t, abi: erc20, functionName: "totalSupply" }).catch(() => null),
        ]);
        if (supplyRaw != null) mcEth += curve.spotPrice * (Number(supplyRaw as bigint) / 1e18);
        raisedEth += Number(curve.realQuoteReserve) / 1e18;
      } catch {
        // best-effort per token
      }
    }),
  );

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
      await kv.set(STATS_KEY, summary, { ex: 60 });
    } catch {
      // ignore
    }
  }

  return NextResponse.json(summary);
}
