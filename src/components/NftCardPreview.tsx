"use client";

import { SITE } from "@/lib/site";

/**
 * Live preview of the profile-identity NFT: a simple, collectible card built
 * from a fomo.family profile (avatar, name, handle). This is the artwork/metadata
 * a mint would carry. Warm espresso plate to match the Vibz mark.
 */
export function NftCardPreview({
  name,
  handle,
  avatar,
  wallet,
  verified,
}: {
  name?: string;
  handle?: string;
  avatar?: string;
  wallet?: string | null;
  verified?: boolean;
}) {
  const h = (handle || "").replace(/^@+/, "");
  const displayName = name?.trim() || (h ? `@${h}` : "Your profile");

  return (
    <div
      className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border p-5"
      style={{
        background: "radial-gradient(120% 90% at 50% 0%, #2a1f16 0%, #201810 45%, #17100b 100%)",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow: "0 40px 90px -50px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <span className="wordmark text-sm">VIBZ</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--ink-4)" }}>
          Identity
        </span>
      </div>

      {/* avatar */}
      <div className="mt-5 flex justify-center">
        <div
          className="h-28 w-28 overflow-hidden rounded-2xl border"
          style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)" }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">🫥</div>
          )}
        </div>
      </div>

      {/* name + handle */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-1.5 font-display text-lg font-black" style={{ color: "var(--ink-1)" }}>
          <span className="truncate">{displayName}</span>
          {verified && <span title="Verified on fomo.family" style={{ color: "var(--ink-2)" }}>✓</span>}
        </div>
        {h && <div className="mt-0.5 font-mono text-xs" style={{ color: "var(--ink-3)" }}>@{h}</div>}
      </div>

      {/* footer meta */}
      <div className="mt-5 flex items-center justify-between border-t pt-3 text-[10px]" style={{ borderColor: "rgba(255,255,255,0.10)", color: "var(--ink-4)" }}>
        <span className="uppercase tracking-wider">On-chain identity</span>
        <span className="font-mono">
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : SITE.chain}
        </span>
      </div>
    </div>
  );
}
