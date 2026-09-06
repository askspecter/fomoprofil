/** Shared site constants (links, copy). */
export const SITE = {
  name: "FOMO Profile",
  shortName: "FOMO",
  tagline: "Tokenize your fomo.family profile.",
  description:
    "Turn your fomo.family profile into a token. FOMO Profile drafts your profile coin and launches it on the Pons bonding curve on Robinhood Chain, non-custodial — your wallet signs every transaction.",
  x: "https://x.com/ponsfamily",
  xHandle: "@ponsfamily",
  company: "FOMO Profile",
  chain: "Robinhood Chain",
  poweredBy: "Pons",
  ponsUrl: "https://ponsfamily.com",
  fomoUrl: "https://fomo.family",
} as const;

export const NAV = [
  { href: "/feed", label: "Explore" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "My Profile" },
  { href: "/docs", label: "Docs" },
] as const;
