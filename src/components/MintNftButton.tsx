"use client";

import { isAddress } from "viem";
import { SITE } from "@/lib/site";

/**
 * Mint-as-NFT action for the profile studio. Turning a fomo.family profile into
 * an on-chain identity NFT ships as soon as the profile-NFT (ERC-721) contract
 * is wired — set NEXT_PUBLIC_VIBZ_NFT. Until then this is a clear "launching
 * soon" state so the option is visible without pretending to mint.
 */
export function MintNftButton({ ready }: { ready: boolean }) {
  const configured = isAddress(SITE.nftAddress);

  return (
    <div className="space-y-2">
      <button className="btn-brand w-full" disabled title={configured ? undefined : "Launching soon"}>
        {configured ? "Mint as NFT" : "Mint as NFT · launching soon"}
      </button>
      <p className="text-xs text-zinc-500">
        {configured
          ? "Ready to mint. Connect your wallet and confirm the transaction."
          : "Profile NFTs are launching soon on vibz.family. Detect your profile now so it's ready to mint on day one."}
      </p>
      {!ready && configured && (
        <p className="text-xs text-zinc-500">Detect your fomo.family profile first.</p>
      )}
    </div>
  );
}
