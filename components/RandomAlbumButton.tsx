"use client";

import { useState } from "react";
import { GifModal } from "./GifModal";
import type { Album } from "@/types";

interface Props { albums: Album[] }

export function RandomAlbumButton({ albums }: Props) {
  const [picked, setPicked] = useState<Album | null>(null);

  function roll() {
    if (!albums.length) return;
    const pool = albums.filter((a) => a.artworkUrl);
    setPicked(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <>
      <button
        onClick={roll}
        className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
        aria-label="Random album"
        title="Roll for a random album"
      >
        {/* Dice icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="3" ry="3"/>
          <circle cx="8"  cy="8"  r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="16" cy="8"  r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="8"  cy="16" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
      </button>

      {picked && (
        <GifModal album={picked} allAlbums={albums} onClose={() => setPicked(null)} />
      )}
    </>
  );
}
