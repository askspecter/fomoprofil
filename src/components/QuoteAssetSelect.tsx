"use client";

import { useEffect, useRef, useState } from "react";
import { AssetLogo } from "./AssetLogo";

export interface QuoteAsset {
  asset: string;
  symbol: string;
  name: string;
}

/**
 * "Paired asset" picker - a solid dark dropdown showing ticker + full name.
 * Backgrounds are set with explicit opaque colors (not Tailwind's bg-white,
 * which the dark theme remaps to a near-transparent tint) so the open menu
 * reads as a real floating panel instead of bleeding through the fields below.
 */
export function QuoteAssetSelect({
  assets,
  value,
  onChange,
}: {
  assets: QuoteAsset[];
  value: string;
  onChange: (asset: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = assets.find((a) => a.asset.toLowerCase() === value.toLowerCase()) ?? assets[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {selected && <AssetLogo symbol={selected.symbol} size={24} />}
        <span className="font-bold" style={{ color: "var(--ink-1)" }}>{selected?.symbol}</span>
        <span className="truncate text-xs" style={{ color: "var(--ink-4)" }}>{selected?.name}</span>
        <span className="ml-auto text-xs" style={{ color: "var(--ink-4)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="thin-scroll absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl p-1"
          style={{
            background: "#17130f",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 30px 70px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {assets.map((a) => {
            const active = a.asset.toLowerCase() === value.toLowerCase();
            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                key={a.asset}
                onClick={() => {
                  onChange(a.asset);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition"
                style={{
                  background: active ? "rgba(255,255,255,0.10)" : "transparent",
                  color: "var(--ink-1)",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <AssetLogo symbol={a.symbol} size={26} />
                <span className="font-bold">{a.symbol}</span>
                <span className="ml-auto truncate text-xs" style={{ color: "var(--ink-4)" }}>{a.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
