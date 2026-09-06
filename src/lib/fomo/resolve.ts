import { getAddress, isAddress, type Address } from "viem";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  fomo.family profile resolution (server-side only).
 *
 *  Resolves a fomo.family handle to the trader's REAL main wallets and public
 *  profile (display name, avatar, bio) via the FOMO API (api.fomoapi.io).
 *  The resolved EVM wallet is used as the on-chain creator-fee recipient for a
 *  profile launch, so a profile coin's creator fees route to that person's
 *  fomo.family wallet.
 *
 *  Requires a server-side FOMO_API_KEY (Bearer). The key never reaches the
 *  browser — only this module and the /api/fomo route read it.
 *
 *  NOTE ON QUOTA: the FOMO free tier meters handle→wallet resolution separately
 *  (25 resolutions / month). Callers should cache results (see the /api/fomo
 *  route) so the same handle isn't resolved repeatedly.
 * ─────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = (process.env.FOMO_API_BASE_URL || "https://api.fomoapi.io").replace(/\/+$/, "");

export interface FomoProfile {
  /** Canonical handle as FOMO reports it. */
  handle: string;
  /** Display name, or the handle when none is set. */
  displayName: string;
  /** Profile bio / description (may be empty). */
  bio: string;
  /** Profile picture URL (may be empty). */
  avatar: string;
  /** Cover photo URL (may be empty). */
  coverPhoto: string;
  /** The trader's real main wallets, resolved past FOMO's throwaway signer. */
  wallets: { evm: Address | null; solana: string | null };
  /** FOMO verification flag. */
  verified: boolean;
  followers: number | null;
  accountAgeDays: number | null;
}

/** A resolution error with an HTTP-ish status so the route can map it cleanly. */
export class FomoResolveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FomoResolveError";
  }
}

/** Whether resolution is even possible (an API key is configured). */
export function fomoConfigured(): boolean {
  return Boolean(process.env.FOMO_API_KEY?.trim());
}

/** Strip a leading @ and surrounding whitespace. The API is case-insensitive. */
export function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function toAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !isAddress(value)) return null;
  return getAddress(value);
}

/**
 * Resolve a fomo.family handle to its profile + real wallets.
 * Throws FomoResolveError for missing key (503), unknown handle (404),
 * bad key (401) and rate limits (429).
 */
export async function resolveFomoProfile(rawHandle: string): Promise<FomoProfile> {
  const key = process.env.FOMO_API_KEY?.trim();
  if (!key) {
    throw new FomoResolveError(
      "Profile detection is not configured on the server (set FOMO_API_KEY).",
      503,
    );
  }

  const handle = cleanHandle(rawHandle);
  if (handle.length < 2) {
    throw new FomoResolveError("Enter a fomo.family handle (at least 2 characters).", 400);
  }

  const url = `${BASE_URL}/v2/users/${encodeURIComponent(handle)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { authorization: `Bearer ${key}`, accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    throw new FomoResolveError("Couldn't reach the FOMO API. Try again.", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 404) {
    throw new FomoResolveError(`No fomo.family profile found for @${handle}.`, 404);
  }
  if (res.status === 401) {
    throw new FomoResolveError("The FOMO API key is invalid.", 401);
  }
  if (res.status === 429) {
    throw new FomoResolveError("FOMO API rate/resolution limit reached. Try later.", 429);
  }
  if (!res.ok) {
    throw new FomoResolveError(`FOMO API error (${res.status}).`, 502);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const walletsRaw = (data.wallets ?? {}) as Record<string, unknown>;

  return {
    handle: typeof data.handle === "string" ? data.handle : handle,
    displayName:
      (typeof data.displayName === "string" && data.displayName.trim()) ||
      (typeof data.handle === "string" ? data.handle : handle),
    bio: typeof data.description === "string" ? data.description : "",
    avatar: typeof data.profilePictureLink === "string" ? data.profilePictureLink : "",
    coverPhoto: typeof data.coverPhotoLink === "string" ? data.coverPhotoLink : "",
    wallets: {
      evm: toAddress(walletsRaw.evm),
      solana: typeof walletsRaw.solana === "string" ? walletsRaw.solana : null,
    },
    verified: data.verified === true,
    followers: typeof data.followers === "number" ? data.followers : null,
    accountAgeDays: typeof data.accountAgeDays === "number" ? data.accountAgeDays : null,
  };
}
