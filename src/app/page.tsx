import Link from "next/link";
import { SITE } from "@/lib/site";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ── Hero ── */}
      <section className="relative pt-16 sm:pt-24">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-pink" /> Profile coins on {SITE.poweredBy}
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl">
            Tokenize your <span className="grad-text">fomo.family</span> profile.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600">
            Turn your fomo.family profile into a coin and launch it on the {SITE.poweredBy} bonding
            curve on {SITE.chain}. Your name, ticker, bio and avatar are drafted for you. You launch in
            one tap, non-custodial.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/create" className="btn-brand">Launch my profile →</Link>
            <Link href="/feed" className="btn-ghost">Explore profiles</Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Fair launch, bonding curve, graduates to Uniswap V4 at ~{V2_GRADUATION_THRESHOLD_ETH} ETH.
            Your wallet signs every transaction.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          {
            n: "1",
            t: "Drop your handle",
            d: "Paste your fomo.family handle. We draft a profile coin — name, ticker, one-line hook, lore and an avatar.",
          },
          {
            n: "2",
            t: "Review and tune",
            d: "Edit anything, pick a paired asset (ETH or an RWA), add socials, optionally seed a first buy.",
          },
          {
            n: "3",
            t: "Launch on Pons",
            d: "Deploy to the bonding curve in one signed transaction. Trading opens instantly on your curve.",
          },
        ].map((s) => (
          <div key={s.n} className="card card-hover p-6">
            <div className="step-badge">{s.n}</div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.d}</p>
          </div>
        ))}
      </section>

      {/* ── Why the bonding curve ── */}
      <section className="mt-16 card p-6 sm:p-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-pink" /> The bonding curve</div>
            <h2 className="mt-3 text-2xl font-bold text-zinc-900">A fair launch for every profile</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Every profile coin starts on a {SITE.poweredBy} bonding curve that holds the full
              supply. As people buy in, the curve fills, and once it reaches its threshold it
              auto-graduates into a permanently-locked Uniswap V4 pool. Creators are paid in ETH.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-zinc-700">
            {[
              "Fair launch — no pre-sale, no team allocation on the curve.",
              "Graduates to Uniswap V4 at the configured threshold.",
              "Pair against ETH, or an RWA (USDG, NVDA, AAPL, and more).",
              "Non-custodial: your wallet signs, we never hold funds.",
              "Optional protocol buybacks and an atomic first buy.",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 rounded-xl border border-ink-line bg-white/50 p-3">
                <span className="mt-0.5 text-pink">✦</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mt-16 mb-4 flex flex-col items-center rounded-3xl border border-ink-line bg-white/50 p-10 text-center backdrop-blur">
        <h2 className="max-w-2xl text-3xl font-black text-zinc-900">Your profile is worth a coin.</h2>
        <p className="mt-3 max-w-lg text-sm text-zinc-600">
          Launch it in under a minute. We do the heavy lifting; you keep control of every field and
          every signature.
        </p>
        <Link href="/create" className="btn-brand mt-6">Launch my profile →</Link>
      </section>

      <p className="mb-8 text-center text-[11px] text-zinc-400">
        {SITE.name} is a third-party interface to the {SITE.poweredBy} protocol, not an official{" "}
        {SITE.poweredBy} or fomo.family product. Not financial advice.
      </p>
    </div>
  );
}
