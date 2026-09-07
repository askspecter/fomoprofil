import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import {
  fetchLeaderboard,
  fomoConfigured,
  isLeaderboardWindow,
  FomoResolveError,
  type FomoLeaderRow,
} from "@/lib/fomo/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/fomo/leaderboard?window=24h&limit=50
 * Ranked FOMO traders for the window, each with real wallets so a row can be
 * tokenized (fees route to that trader). Cached briefly in KV so the shared
 * request quota isn't spent on every page view.
 */
const CACHE_TTL_SECONDS = 60; // leaderboard is "real-time-ish"; a 60s cache is plenty.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const windowParam = searchParams.get("window") ?? "24h";
  const window = isLeaderboardWindow(windowParam) ? windowParam : "24h";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 100);

  if (!fomoConfigured()) {
    return NextResponse.json(
      { error: "Leaderboard is not configured on the server.", traders: [] },
      { status: 503 },
    );
  }

  const kv = getKv();
  const key = `fomo:leaderboard:${window}:${limit}`;

  if (kv) {
    try {
      const cached = await kv.get<{ capturedAt: string | null; traders: FomoLeaderRow[] }>(key);
      if (cached) return NextResponse.json({ window, ...cached, cached: true });
    } catch {
      // best-effort cache
    }
  }

  try {
    const data = await fetchLeaderboard(window, limit);
    if (kv) {
      try {
        await kv.set(key, { capturedAt: data.capturedAt, traders: data.traders }, { ex: CACHE_TTL_SECONDS });
      } catch {
        // ignore
      }
    }
    return NextResponse.json({ ...data, cached: false });
  } catch (err) {
    if (err instanceof FomoResolveError) {
      return NextResponse.json({ error: err.message, traders: [] }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load the leaderboard.";
    return NextResponse.json({ error: message, traders: [] }, { status: 500 });
  }
}
