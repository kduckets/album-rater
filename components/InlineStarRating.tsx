"use client";

import { useState } from "react";
import { useAlbumStore } from "@/store/albumStore";
import { hasSetUsername } from "@/lib/identity";

interface InlineStarRatingProps {
  albumId: string;
}

const LABELS = ["", "Awful", "Meh", "Good", "Great", "Essential"];

export function InlineStarRating({ albumId }: InlineStarRatingProps) {
  const [hovered, setHovered]   = useState<number | null>(null);
  const [nudge, setNudge]       = useState(false);
  const rating    = useAlbumStore((s) => s.ratings[albumId] ?? 0);
  const setRating = useAlbumStore((s) => s.setRating);

  const display = hovered ?? rating;

  function handleClick(star: number) {
    if (!hasSetUsername()) {
      setNudge(true);
      setTimeout(() => setNudge(false), 2500);
      return;
    }
    setRating(albumId, rating === star ? 0 : star);
  }

  return (
    <div onMouseLeave={() => setHovered(null)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onClick={() => handleClick(star)}
            className="text-2xl leading-none transition-transform hover:scale-125 focus:outline-none cursor-pointer"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <span className={display >= star ? "text-amber-400" : "text-zinc-300"}>★</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] mt-1 h-3.5 text-zinc-400">
        {nudge ? "Set a username to rate" : display > 0 ? LABELS[display] : ""}
      </p>
    </div>
  );
}
