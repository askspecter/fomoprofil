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
  /**
   * The official $VIBZ token contract on Robinhood Chain. Hardcoded (not read
   * from env) so the deployed site always shows the correct CA — a stale or
   * wrong NEXT_PUBLIC_VIBZ_TOKEN env value can no longer override it.
   */
  tokenAddress: "0x203284f913644ef2e2707cbb00e19ca8af50d4f3",
  tokenSymbol: "VIBZ",
  /**
   * Automatic buyback-and-burn cadence for $VIBZ: a burn runs every N minutes,
   * counting rounds from round 1 at this start time. Hardcoded (not read from
   * env) so round numbering is stable and can't be thrown off by a stale env
   * value — round 1 begins at burnRoundStart and increments every N minutes.
   */
  burnRoundStart: "2026-09-20T13:25:00Z",
  burnRoundMinutes: 10,
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
