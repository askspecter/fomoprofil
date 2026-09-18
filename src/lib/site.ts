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
  /** The official $VIBZ token contract on Robinhood Chain (set via env). */
  tokenAddress: (process.env.NEXT_PUBLIC_VIBZ_TOKEN ?? "").trim(),
  tokenSymbol: "VIBZ",
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
