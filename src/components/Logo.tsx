/**
 * Vibz brand mark - the sculpted white infinity monogram. Shipped as a static
 * asset (public/vibz-logo.jpg) and rendered as an image so the exact artwork is
 * used. The warm near-black plate matches the app canvas so it sits seamlessly.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/vibz-logo.jpg" alt="Vibz" className="h-full w-full object-cover" />
    </span>
  );
}
