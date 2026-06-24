"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { InlineStarRating } from "./InlineStarRating";
import { GifModal } from "./GifModal";
import { useAlbumStore } from "@/store/albumStore";
import { useAveragesStore } from "@/store/averagesStore";
import { getVisitorId } from "@/lib/visitorId";
import type { Album } from "@/types";

interface AlbumListCardProps {
  album: Album;
  allAlbums: Album[];
}

const FALLBACK_IMG = "/miles-davis.png";

export function AlbumListCard({ album, allAlbums }: AlbumListCardProps) {
  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [artworkError, setArtworkError] = useState(false);

  const commentCount = useAlbumStore((s) => (s.comments[album.id] ?? []).length);
  const rating       = useAlbumStore((s) => s.ratings[album.id] ?? 0);

  const average    = useAveragesStore((s) => s.averages[album.id] ?? 0);
  const setAverage = useAveragesStore((s) => s.setAverage);

  // Animate the score circle counting up/down to the community average
  const [displayAvg, setDisplayAvg] = useState(0);
  const animRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetAvg = Math.round(average); // integer for animation steps

  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current);
    if (targetAvg === displayAvg) return;
    const step = targetAvg > displayAvg ? 1 : -1;
    animRef.current = setInterval(() => {
      setDisplayAvg((prev) => {
        const next = prev + step;
        if (next === targetAvg) clearInterval(animRef.current!);
        return next;
      });
    }, 80);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAvg]);

  // Submit the user's rating to the server whenever it changes (skip initial mount)
  const prevRating = useRef<number | null>(null);
  useEffect(() => {
    if (prevRating.current === null) { prevRating.current = rating; return; }
    if (prevRating.current === rating) return;
    prevRating.current = rating;

    const userId = getVisitorId();
    if (!userId) return;
    fetch("/api/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: album.id, userId, rating }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.average === "number") setAverage(album.id, data.average);
        else setAverage(album.id, null);
      })
      .catch(() => {});
  }, [rating, album.id, setAverage]);

  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${album.title} Miles Davis`
  )}`;

  return (
    <>
      <div className="flex flex-col sm:flex-row group overflow-hidden rounded sm:rounded-none">
        {/* Album art */}
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-square sm:aspect-auto sm:w-[38%] sm:min-h-60 shrink-0 overflow-hidden block"
          aria-label={`Listen to ${album.title} on Spotify`}
        >
          {album.artworkUrl && !artworkError ? (
            <Image
              src={album.artworkUrl}
              alt={album.title}
              fill
              className="object-cover transition-opacity duration-200 group-hover:opacity-90"
              sizes="(max-width: 640px) 100vw, 38vw"
              onError={() => setArtworkError(true)}
            />
          ) : (
            <Image
              src={FALLBACK_IMG}
              alt="Miles Davis"
              fill
              className="object-cover object-top transition-opacity duration-200 group-hover:opacity-90"
              sizes="(max-width: 640px) 100vw, 38vw"
            />
          )}
        </a>

        {/* Content + action strip */}
        <div className="flex flex-1 min-w-0">

          {/* Content panel */}
          <div className="flex-1 bg-white flex flex-col justify-between p-5 min-w-0">
            <div>
              <p className="text-[#3a7cc5] font-bold text-sm tracking-wide">Miles Davis</p>
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#3a7cc5] font-bold text-base sm:text-lg leading-snug mt-0.5 hover:underline"
              >
                {album.title}{album.year ? ` (${album.year})` : ""}
              </a>

              {/* Label tags */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {album.label && (
                  <span className="px-2 py-0.5 bg-zinc-200 text-zinc-600 text-xs rounded">{album.label}</span>
                )}
                <span className="px-2 py-0.5 bg-zinc-200 text-zinc-600 text-xs rounded">Jazz</span>
                {album.year >= 1969 && album.year <= 1975 && (
                  <span className="px-2 py-0.5 bg-zinc-200 text-zinc-600 text-xs rounded">Fusion</span>
                )}
                {album.year >= 1951 && album.year <= 1961 && (
                  <span className="px-2 py-0.5 bg-zinc-200 text-zinc-600 text-xs rounded">Hard Bop</span>
                )}
              </div>

              {/* Description */}
              {album.description && (
                <p className="mt-3 text-zinc-500 text-xs leading-relaxed italic">
                  {album.description}
                </p>
              )}

              {/* Star rating */}
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-semibold">
                  Your rating
                </p>
                <InlineStarRating albumId={album.id} />
              </div>
            </div>

            <p className="text-zinc-400 text-xs mt-3">
              Miles Davis Discography{album.year ? ` · ${album.year}` : ""}
            </p>
          </div>

          {/* Action strip */}
          <div className="w-12 sm:w-14 shrink-0 flex flex-col items-center py-4 gap-4 bg-zinc-100 border-l border-zinc-200">
            {/* Community average */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                {displayAvg > 0 ? displayAvg : "—"}
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`text-[9px] leading-none ${rating >= s ? "text-amber-400" : "text-zinc-300"}`}
                  >★</span>
                ))}
              </div>
            </div>

            {/* GIF comments */}
            <button
              onClick={() => setGifModalOpen(true)}
              className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              aria-label={`${commentCount} GIF reactions`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {commentCount > 0 && (
                <span className="text-[10px] text-zinc-500 font-medium">{commentCount}</span>
              )}
            </button>
          </div>

        </div>
      </div>

      {gifModalOpen && (
        <GifModal album={album} allAlbums={allAlbums} onClose={() => setGifModalOpen(false)} />
      )}
    </>
  );
}
