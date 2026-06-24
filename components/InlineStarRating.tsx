"use client";

import { useState } from "react";
import { useAlbumStore } from "@/store/albumStore";
import { hasSetUsername } from "@/lib/identity";

function getLabel(v: number): string {
  if (v <= 0) return "";
  if (v < 20) return "Skip";
  if (v < 40) return "Meh";
  if (v < 60) return "Solid";
  if (v < 75) return "Great";
  if (v < 90) return "Excellent";
  return "Essential";
}

interface Props {
  albumId: string;
  compact?: boolean;
}

export function InlineStarRating({ albumId, compact = false }: Props) {
  const [nudge, setNudge] = useState(false);
  const rating    = useAlbumStore((s) => s.ratings[albumId] ?? 0);
  const setRating = useAlbumStore((s) => s.setRating);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!hasSetUsername()) return;
    setRating(albumId, Number(e.target.value));
  }

  function handleInteract() {
    if (!hasSetUsername()) {
      setNudge(true);
      setTimeout(() => setNudge(false), 2500);
    }
  }

  const trackBg = rating > 0
    ? `linear-gradient(to right, #f59e0b ${rating}%, #27272a ${rating}%)`
    : "#27272a";

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 flex-1" onClick={handleInteract}>
        <span className={`text-sm font-bold tabular-nums w-7 text-right shrink-0 leading-none ${rating > 0 ? "text-amber-400" : "text-zinc-600"}`}>
          {rating > 0 ? rating : "—"}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={rating}
          onChange={handleChange}
          className="rating-slider flex-1 h-1.5 rounded-full appearance-none focus:outline-none"
          style={{ background: trackBg }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Your rating</p>
        <div className="flex items-center gap-1.5">
          {rating > 0 && <span className="text-zinc-500 text-[11px]">{getLabel(rating)}</span>}
          <span className={`text-xl font-bold leading-none tabular-nums ${rating > 0 ? "text-amber-400" : "text-zinc-600"}`}>
            {rating > 0 ? rating : "—"}
          </span>
        </div>
      </div>
      <div onClick={handleInteract}>
        <input
          type="range"
          min={0}
          max={100}
          value={rating}
          onChange={handleChange}
          className="rating-slider w-full h-1.5 rounded-full appearance-none focus:outline-none"
          style={{ background: trackBg }}
        />
      </div>
      <p className="text-[11px] mt-1.5 h-3.5 text-zinc-400">
        {nudge ? "Set a username to rate" : ""}
      </p>
    </div>
  );
}
