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
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/create", label: "Launch" },
  { href: "/profile", label: "Profile" },
] as const;
