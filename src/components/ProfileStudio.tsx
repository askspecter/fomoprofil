"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { zeroAddress } from "viem";
import { QuoteAssetSelect, type QuoteAsset } from "./QuoteAssetSelect";
import { DeployButton } from "./DeployButton";
import { MintNftButton } from "./MintNftButton";
import { uploadLogo } from "@/lib/upload";
import { V2_GRADUATION_THRESHOLD_ETH } from "@/lib/pons";
import type { LaunchInput } from "@/lib/pons";

interface LaunchOptions {
  launchFee: string;
  canLaunch: boolean | null;
  configs: { id: string }[];
  quoteAssets: QuoteAsset[];
}

const ETH_ASSET: QuoteAsset = {
  asset: zeroAddress,
  symbol: "ETH",
  name: "Ether",
};

/**
 * Full paired-asset list (ETH + Pons RWA / stock quote tokens), used as the
 * client fallback so the picker always shows the same set Pons offers, even if
 * the live launch-options read is slow or returns only ETH. The deploy path
 * still validates the chosen asset on-chain, so an un-approved pick just fails
 * the simulation rather than launching wrongly.
 */
const FALLBACK_QUOTE_ASSETS: QuoteAsset[] = [
  ETH_ASSET,
  { asset: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", symbol: "USDG", name: "Global Dollar" },
  { asset: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", symbol: "NVDA", name: "NVIDIA" },
  { asset: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa", symbol: "SPCX", name: "SpaceX Class A" },
  { asset: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", symbol: "GOOGL", name: "Alphabet Class A" },
  { asset: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", symbol: "TSLA", name: "Tesla" },
  { asset: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E", symbol: "GME", name: "GameStop" },
  { asset: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", symbol: "AAPL", name: "Apple" },
  { asset: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", symbol: "SPY", name: "S&P 500 ETF" },
  { asset: "0xB90A19fF0Af67f7779afF50A882A9CfF42446400", symbol: "SNDK", name: "SanDisk" },
  { asset: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC", symbol: "AMD", name: "Advanced Micro Devices" },
  { asset: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", symbol: "AMZN", name: "Amazon" },
  { asset: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", symbol: "MSFT", name: "Microsoft" },
  { asset: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", symbol: "META", name: "Meta Platforms" },
  { asset: "0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5", symbol: "CRCL", name: "Circle" },
  { asset: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b", symbol: "COIN", name: "Coinbase" },
  { asset: "0xfF080c8ce2E5feadaCa0Da81314Ae59D232d4afD", symbol: "MU", name: "Micron" },
  { asset: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a", symbol: "PLTR", name: "Palantir" },
];

/** What the user is tokenizing: their fomo.family profile, or their feed. */
export type LaunchKind = "profile" | "feed" | "nft";

/** Kind-specific copy so one studio serves every launch type. */
const KIND_COPY: Record<LaunchKind, { noun: string; Noun: string; hook: string; seedSuffix: string }> = {
  profile: {
    noun: "profile",
    Noun: "Profile",
    hook: "Who is this profile?",
    seedSuffix: "",
  },
  feed: {
    noun: "feed",
    Noun: "Feed",
    hook: "What's this feed about?",
    seedSuffix: " Feed",
  },
  nft: {
    noun: "profile",
    Noun: "NFT",
    hook: "Who is this profile?",
    seedSuffix: "",
  },
};

/** Normalize a handle for display + ticker seeding. */
function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

export function ProfileStudio({
  initialHandle = "",
  initialKind = "profile",
}: {
  initialHandle?: string;
  initialKind?: LaunchKind;
}) {
  const { address } = useAccount();

  // ── What we're launching: a fomo.family profile, or a feed ──
  const [kind, setKind] = useState<LaunchKind>(initialKind);
  const copy = KIND_COPY[kind];

  // ── Profile seed inputs ──
  const [handle, setHandle] = useState(cleanHandle(initialHandle));
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  // ── Resolved fomo.family profile (real data + creator-fee wallet) ──
  const [fomo, setFomo] = useState<{
    handle: string;
    displayName: string;
    verified: boolean;
    wallet: string | null;
  } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [feeWallet, setFeeWallet] = useState<`0x${string}` | undefined>(undefined);

  // Editable launch fields
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [initialBuy, setInitialBuy] = useState("");
  const [buyback, setBuyback] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Launch options (live from the factory) ──
  const [options, setOptions] = useState<LaunchOptions | null>(null);
  const [pairToken, setPairToken] = useState<string>(zeroAddress);

  useEffect(() => {
    const url = address ? `/api/v2/launch-options?address=${address}` : "/api/v2/launch-options";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: LaunchOptions) => setOptions(d))
      .catch(() => setOptions(null));
  }, [address]);

  // Prefilled via /create?handle=… (e.g. the Tokenize button on the leaderboard):
  // auto-detect the profile on first load.
  useEffect(() => {
    if (cleanHandle(initialHandle).length >= 2) detectProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quoteAssets = useMemo<QuoteAsset[]>(() => {
    const list = options?.quoteAssets ?? [];
    // Use the live list only when it actually carries the paired-asset set.
    // Otherwise fall back to the full Pons RWA / stock list so the picker is
    // never just ETH.
    return list.length > 1 ? list : FALLBACK_QUOTE_ASSETS;
  }, [options]);

  /**
   * Detect the real fomo.family profile behind the handle: prefill name, bio
   * and avatar from live data, and capture the profile's EVM wallet so creator
   * fees route to that person at launch.
   */
  async function detectProfile() {
    const h = cleanHandle(handle);
    if (h.length < 2) {
      setDetectError("Enter your fomo.family handle first.");
      return;
    }
    setDetectError(null);
    setDetecting(true);
    try {
      const res = await fetch(`/api/fomo/${encodeURIComponent(h)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't detect that profile.");
      const p = data.profile as {
        handle: string;
        displayName: string;
        bio: string;
        avatar: string;
        verified: boolean;
        wallets: { evm: string | null };
      };
      setFomo({ handle: p.handle, displayName: p.displayName, verified: p.verified, wallet: p.wallets.evm });
      // Prefill real profile data - everything stays editable before launch.
      if (p.displayName) {
        setDisplayName(p.displayName);
        setName((prev) => prev || `${p.displayName}${copy.seedSuffix}`);
      }
      if (p.bio) {
        setBio(p.bio);
        setDescription((prev) => prev || p.bio.split("\n")[0].slice(0, 280));
      }
      if (p.avatar) setAvatar(p.avatar);
      setFeeWallet((p.wallets.evm as `0x${string}`) ?? undefined);
    } catch (err) {
      setFomo(null);
      setFeeWallet(undefined);
      setDetectError(err instanceof Error ? err.message : "Couldn't detect that profile.");
    } finally {
      setDetecting(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setAvatar(url);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const launchConfigId = options?.configs?.[0]?.id ? Number(options.configs[0].id) : 0;

  const launchInput: LaunchInput = {
    version: "v2",
    name: name.trim() || cleanHandle(handle),
    ticker: ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
    description: description.trim(),
    imageUri: avatar,
    creatorFeeRecipient: feeWallet,
    quoteAsset: "ETH",
    pairToken: pairToken as `0x${string}`,
    launchConfigId,
    buybackEnabled: buyback,
    initialBuyEth: initialBuy && Number(initialBuy) > 0 ? initialBuy : undefined,
    twitter: twitter.trim() || undefined,
    website: website.trim() || undefined,
  };

  const isNativePair = pairToken.toLowerCase() === zeroAddress.toLowerCase();
  const canDeploy = launchInput.ticker.length >= 2 && launchInput.name.length >= 1;
  const feeEth = options?.launchFee ? Number(options.launchFee) / 1e18 : null;

  return (
    <div className="space-y-6">
      {/* ── Launch type: profile vs feed ── */}
      <div className="card p-4 sm:p-5">
        <div className="eyebrow mb-3">What do you want to tokenize?</div>
        <div className="segbar" role="tablist" aria-label="Launch type">
          {(["profile", "feed", "nft"] as LaunchKind[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              data-active={kind === k}
              className="segbtn"
              onClick={() => setKind(k)}
            >
              {k === "profile" ? "Fomo Profile" : k === "feed" ? "Fomo Feed" : "Fomo NFT"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {kind === "profile"
            ? "Launch a coin for your fomo.family profile: your identity, avatar and bio."
            : kind === "feed"
              ? "Launch a coin for your fomo.family feed: the stream you post and curate."
              : "Mint your fomo.family profile as an NFT. Your profile. Your NFT. Your on-chain identity."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
      {/* ── Left: detect fomo.family profile + editable seed ── */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">
          <span className="step-badge">1</span> Your fomo.family {copy.noun}
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          Drop your fomo.family handle and detect your {copy.noun}. We pull your name, avatar and bio
          straight from fomo.family, and route creator fees to your {copy.noun}’s wallet. Everything
          stays editable before you launch.
        </p>

        <label className="mt-5 block text-xs font-semibold text-zinc-500">Handle</label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-zinc-400">@</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="yourname"
            className="field"
          />
        </div>

        <button className="btn-brand mt-4 w-full" onClick={detectProfile} disabled={detecting}>
          {detecting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {detecting ? "Detecting…" : fomo ? `Re-detect ${copy.noun}` : `Detect my fomo.family ${copy.noun}`}
        </button>
        {detectError && <p className="mt-2 text-xs text-red-600">{detectError}</p>}
        {fomo && (
          <div className="mt-3 rounded-xl border border-ink-line bg-white/50 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
              @{fomo.handle}
              {fomo.verified && <span className="text-pink" title="Verified on fomo.family">✓</span>}
            </div>
            {fomo.wallet ? (
              <p className="mt-1 text-zinc-500">
                Creator fees route to this profile’s wallet:{" "}
                <span className="font-mono text-zinc-700">
                  {fomo.wallet.slice(0, 6)}…{fomo.wallet.slice(-4)}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-amber-600">
                No EVM wallet on this profile, so fees fall back to your connected wallet.
              </p>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-semibold text-zinc-500">Display name (optional)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="field mt-1" />
        </div>

        <label className="mt-3 block text-xs font-semibold text-zinc-500">Bio (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A line or two about you."
          rows={3}
          className="field mt-1 resize-none"
        />
        <p className="mt-2 text-[11px] text-zinc-400">
          Detect fills these from fomo.family, or type them in by hand. Set the coin name, ticker and
          avatar on the right, then launch.
        </p>
      </section>

      {/* ── Right: editable package + launch ── */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">
          <span className="step-badge">2</span> Review and launch
        </div>

        {/* Avatar */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-line bg-white">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">🫥</span>
            )}
          </div>
          <div className="text-sm">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : avatar ? "Replace avatar" : "Upload avatar"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            <p className="mt-1 text-[11px] text-zinc-400">PNG/JPG. Auto-compressed for on-chain use.</p>
          </div>
        </div>

        {kind !== "nft" ? (
        <>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Coin name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Your ${copy.noun} coin`} className="field mt-1" maxLength={40} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Ticker</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
              placeholder="TICKER"
              className="field mt-1 font-mono"
              maxLength={10}
            />
          </div>
        </div>

        <label className="mt-3 block text-xs font-semibold text-zinc-500">One-line hook</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={copy.hook} className="field mt-1" maxLength={280} />

        {/* Paired asset */}
        <label className="mt-4 block text-xs font-semibold text-zinc-500">Paired asset (quote)</label>
        <div className="mt-1">
          <QuoteAssetSelect assets={quoteAssets} value={pairToken} onChange={setPairToken} />
        </div>

        {/* Socials */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">X / Twitter (optional)</label>
            <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" className="field mt-1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500">Website (optional)</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="field mt-1" />
          </div>
        </div>

        {/* Initial buy + buyback */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-500">
              Initial buy {isNativePair ? "(ETH, optional)" : "(native only)"}
            </label>
            <input
              value={initialBuy}
              onChange={(e) => setInitialBuy(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.0"
              inputMode="decimal"
              className="field mt-1 font-mono disabled:opacity-50"
              disabled={!isNativePair}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-600">
            <input type="checkbox" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} className="h-5 w-5 accent-pink" />
            Enable protocol buybacks
          </label>
        </div>

        {/* Launch summary */}
        <div className="mt-4 space-y-1 rounded-xl border border-ink-line bg-white/50 p-3 text-xs text-zinc-500">
          <div className="flex justify-between"><span>Launch type</span><span className="font-semibold text-zinc-700">Fomo {copy.Noun}</span></div>
          <div className="flex justify-between"><span>Launch model</span><span className="font-semibold text-zinc-700">Pons · bonding curve</span></div>
          <div className="flex justify-between"><span>Graduates to</span><span className="text-zinc-700">Uniswap V4 (~{V2_GRADUATION_THRESHOLD_ETH} ETH)</span></div>
          {feeWallet && (
            <div className="flex justify-between">
              <span>Creator fees →</span>
              <span className="font-mono text-zinc-700">{feeWallet.slice(0, 6)}…{feeWallet.slice(-4)}</span>
            </div>
          )}
          {feeEth !== null && <div className="flex justify-between"><span>Launch fee</span><span className="font-mono text-zinc-700">{feeEth} ETH</span></div>}
          {options?.canLaunch === false && (
            <div className="pt-1 text-amber-600">This wallet isn’t whitelisted for launches yet, so the launch would revert.</div>
          )}
        </div>

        <div className="mt-4">
          <DeployButton input={launchInput} handle={cleanHandle(handle) || undefined} kind={kind} disabled={!canDeploy} />
        </div>
        </>
        ) : (
        <>
          {/* NFT identity preview */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-zinc-500">NFT name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your profile NFT" className="field mt-1" maxLength={60} />
          </div>
          <label className="mt-3 block text-xs font-semibold text-zinc-500">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={copy.hook} className="field mt-1" maxLength={280} />

          <div className="mt-4 space-y-1 rounded-xl border border-ink-line bg-white/50 p-3 text-xs text-zinc-500">
            <div className="flex justify-between"><span>Type</span><span className="font-semibold text-zinc-700">Fomo NFT · on-chain identity</span></div>
            <div className="flex justify-between"><span>Standard</span><span className="text-zinc-700">ERC-721</span></div>
            <div className="flex justify-between"><span>Chain</span><span className="text-zinc-700">{`Robinhood Chain`}</span></div>
            {feeWallet && (
              <div className="flex justify-between">
                <span>Identity wallet</span>
                <span className="font-mono text-zinc-700">{feeWallet.slice(0, 6)}…{feeWallet.slice(-4)}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <MintNftButton ready={!!fomo} />
          </div>
        </>
        )}
      </section>
      </div>
    </div>
  );
}
