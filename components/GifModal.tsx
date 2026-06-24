"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { GifCommentSection } from "./GifCommentSection";
import type { Album } from "@/types";

interface GifModalProps {
  album: Album;
  onClose: () => void;
}

export function GifModal({ album, onClose }: GifModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${album.title} Miles Davis`
  )}`;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-zinc-100 shrink-0">
          {album.artworkUrl && (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
              <Image
                src={album.artworkUrl}
                alt={album.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-zinc-400 text-xs">Miles Davis</p>
            <p className="font-bold text-zinc-900 text-sm truncate">
              {album.title}
              {album.year ? ` (${album.year})` : ""}
            </p>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1DB954] hover:underline font-medium"
            >
              Open in Spotify →
            </a>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shrink-0 cursor-pointer transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* GIF section — scrollable */}
        <div className="overflow-y-auto p-5">
          <GifCommentSection albumId={album.id} />
        </div>
      </div>
    </div>
  );
}
