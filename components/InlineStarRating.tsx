"use client";

import { useState } from "react";
import { useAlbumStore } from "@/store/albumStore";

interface InlineStarRatingProps {
  albumId: string;
}

export function InlineStarRating({ albumId }: InlineStarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const rating = useAlbumStore((s) => s.ratings[albumId] ?? 0);
  const setRating = useAlbumStore((s) => s.setRating);

  const display = hovered ?? rating;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHovered(star)}
          onClick={() => setRating(albumId, rating === star ? 0 : star)}
          className="text-xl leading-none transition-transform hover:scale-110 focus:outline-none cursor-pointer"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          title={rating === star ? "Click to clear rating" : undefined}
        >
          <span className={display >= star ? "text-amber-400" : "text-zinc-300"}>
            ★
          </span>
        </button>
      ))}
      {rating > 0 && hovered === null && (
        <span className="ml-1.5 text-xs text-zinc-400">{rating}/5</span>
      )}
    </div>
  );
}
