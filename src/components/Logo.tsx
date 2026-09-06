/**
 * Dime brand mark — an inline SVG "coin + spark" glyph on the signature
 * pink gradient, so the logo ships with the code (no binary asset to host) and
 * reads cleanly at any size.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      <svg viewBox="0 0 48 48" className="h-full w-full" role="img" aria-label="Dime">
        <defs>
          <linearGradient id="fomoLogo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff5fa5" />
            <stop offset="0.55" stopColor="#ec0e7b" />
            <stop offset="1" stopColor="#b00a5e" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#fomoLogo)" />
        {/* stylized F / profile spark */}
        <path
          d="M18 13h14a2 2 0 0 1 0 4H22v6h8a2 2 0 0 1 0 4h-8v8a2 2 0 0 1-4 0V15a2 2 0 0 1 0-2z"
          fill="#fff"
        />
        <circle cx="33" cy="31" r="3.4" fill="#fff" />
      </svg>
    </span>
  );
}
