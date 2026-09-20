import { NextResponse } from "next/server";
import { isAddress, parseAbi, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { getKv } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v2/burn?address=0x...
 * Live burn stats for a token, read straight from chain: total supply plus the
 * balances held at the standard burn sinks (0x…dEaD and the zero address). The
 * burned figure is the sum of those sinks; circulating is supply minus burned.
 *
 * The public Robinhood RPC rate-limits hard, so we cache briefly and keep a
 * durable last-known copy to serve through rate-limit windows.
 */
const erc20 = parseAbi([
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
]);

const DEAD = "0x000000000000000000000000000000000000dEaD" as Address;
const ZERO = "0x0000000000000000000000000000000000000000" as Address;

const FRESH_TTL = 20; // seconds
const freshKey = (t: string) => `burn:v2:fresh:${t.toLowerCase()}`;
const lastKey = (t: string) => `burn:v2:last:${t.toLowerCase()}`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "The `address` param is not a valid address." }, { status: 400 });
  }
  const token = address as Address;
  const kv = getKv();

  if (kv) {
    try {
      const cached = await kv.get<Record<string, unknown>>(freshKey(token));
      if (cached) return NextResponse.json({ ...cached, cached: true });
    } catch {
      /* ignore cache read errors */
    }
  }

  try {
    const client = ponsClient();
    const [supplyRaw, decimals, deadRaw, zeroRaw] = await Promise.all([
      client.readContract({ address: token, abi: erc20, functionName: "totalSupply" }) as Promise<bigint>,
      client.readContract({ address: token, abi: erc20, functionName: "decimals" }) as Promise<number>,
      client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [DEAD] }).catch(() => 0n) as Promise<bigint>,
      client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [ZERO] }).catch(() => 0n) as Promise<bigint>,
    ]);

    const burnedRaw = deadRaw + zeroRaw;
    const div = 10 ** Number(decimals);
    const totalSupply = Number(supplyRaw) / div;
    const burned = Number(burnedRaw) / div;
    const circulating = Math.max(0, totalSupply - burned);
    const burnedPct = totalSupply > 0 ? (burned / totalSupply) * 100 : 0;

    const payload = {
      token,
      decimals: Number(decimals),
      totalSupply,
      burned,
      circulating,
      burnedPct,
      updatedAt: Date.now(),
    };

    if (kv) {
      try {
        await kv.set(freshKey(token), payload, { ex: FRESH_TTL });
        await kv.set(lastKey(token), payload);
      } catch {
        /* ignore cache write errors */
      }
    }
    return NextResponse.json(payload);
  } catch (err) {
    if (kv) {
      try {
        const last = await kv.get<Record<string, unknown>>(lastKey(token));
        if (last) return NextResponse.json({ ...last, stale: true });
      } catch {
        /* ignore */
      }
    }
    const raw = err instanceof Error ? err.message : "";
    const message = /rate limit|429|timeout|fetch failed/i.test(raw)
      ? "Robinhood Chain is busy right now. Try again in a moment."
      : raw || "Failed to read burn stats from chain.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
