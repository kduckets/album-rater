"use client";

export function ResetFeedButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("reset-feed"))}
      className="flex items-center gap-2 cursor-pointer group"
      aria-label="Back to feed"
    >
      <div className="relative w-8 h-8 shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/flockify.png"
          alt="Flockify420 logo"
          className="h-8 w-auto invert"
          style={{ maxWidth: "none" }}
        />
        <span className="absolute bottom-0 right-0 text-[6px] text-white/40 font-mono leading-none">420</span>
      </div>
      <span className="text-white font-bold text-sm tracking-wide">
        Flockify<span className="text-zinc-500 font-normal text-xs ml-0.5">4.2.0</span>
      </span>
    </button>
  );
}
