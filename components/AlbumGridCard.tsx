"use client";

import { useState } from "react";
import Image from "next/image";
import { GifModal } from "./GifModal";
import { useAlbumStore } from "@/store/albumStore";
import { useAveragesStore } from "@/store/averagesStore";
import type { Album } from "@/types";

const FALLBACK_IMG = "/miles-davis.png";

export function AlbumGridCard({ album, allAlbums }: { album: Album; allAlbums: Album[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [artErr, setArtErr] = useState(false);
  const rating       = useAlbumStore((s) => s.ratings[album.id] ?? 0);
  const average      = useAveragesStore((s) => s.averages[album.id] ?? 0);
  const commentCount = useAveragesStore((s) => s.commentCounts[album.id] ?? 0);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="relative aspect-square w-full overflow-hidden rounded bg-zinc-900 cursor-pointer group block"
        title={`${album.title} (${album.year})`}
      >
        <Image
          src={artErr || !album.artworkUrl ? FALLBACK_IMG : album.artworkUrl}
          alt={album.title}
          fill
          className="object-cover transition-opacity duration-150 group-hover:opacity-70"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
          onError={() => setArtErr(true)}
        />

        {/* Community average badge */}
        {average > 0 && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
            {Math.round(average)}
          </div>
        )}

        {/* Comment count */}
        {commentCount > 0 && (
          <div className="absolute top-1 left-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
            {commentCount}
          </div>
        )}

        {/* Rating bar — 5 segments, always present, amber when rated */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-px p-px">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-0.75 rounded-sm transition-colors ${
                rating >= s ? "bg-amber-400/90" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
          <p className="text-white text-[11px] font-semibold leading-snug line-clamp-2">{album.title}</p>
          <p className="text-zinc-400 text-[10px]">
            {album.year || "—"}
            {album.type !== "studio" && <span className="ml-1 text-zinc-600 capitalize">{album.type}</span>}
          </p>
        </div>
      </button>

      {modalOpen && (
        <GifModal album={album} allAlbums={allAlbums} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
