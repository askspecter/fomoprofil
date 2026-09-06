import Link from "next/link";
import { TokenFeed } from "@/components/TokenFeed";

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Explore <span className="grad-text">profiles</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-600">Profile coins launched on Dime, newest first.</p>
        </div>
        <Link href="/create" className="btn-brand shrink-0">Launch yours →</Link>
      </div>
      <TokenFeed limit={48} />
    </div>
  );
}
