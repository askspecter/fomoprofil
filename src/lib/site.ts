/** Shared site constants (links, copy). */
export const SITE = {
  name: "Vibz",
  shortName: "Vibz",
  tagline: "Tokenize your fomo.family profile & feed.",
  description:
    "Turn your fomo.family profile or feed into a token. Vibz drafts your coin and launches it on the Pons bonding curve on Robinhood Chain, non-custodial. Your wallet signs every transaction.",
  company: "Vibz",
  chain: "Robinhood Chain",
  poweredBy: "Pons",
  ponsUrl: "https://ponsfamily.com",
  fomoUrl: "https://fomo.family",
  /** The official $VIBZ token contract on Robinhood Chain (env overrides the default CA). */
  tokenAddress: (process.env.NEXT_PUBLIC_VIBZ_TOKEN ?? "0x203284f913644ef2e2707cbb00e19ca8af50d4f3").trim(),
  tokenSymbol: "VIBZ",
  /**
   * Automatic buyback-and-burn cadence for $VIBZ: a burn runs every N minutes,
   * counting rounds from round 1 at this start time. Both are env-overridable so
   * the schedule can be re-anchored without a code change.
   */
  burnRoundStart: (process.env.NEXT_PUBLIC_VIBZ_BURN_START ?? "2026-09-20T00:00:00Z").trim(),
  burnRoundMinutes: Number(process.env.NEXT_PUBLIC_VIBZ_BURN_MINUTES ?? "10") || 10,
  /** The profile-NFT (ERC-721) contract. Blank until NFT minting launches. */
  nftAddress: (process.env.NEXT_PUBLIC_VIBZ_NFT ?? "").trim(),
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/vibz", label: "$VIBZ" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "Profile" },
] as const;
