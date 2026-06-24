"use client";

import { useState, useMemo } from "react";
import { AlbumListCard } from "./AlbumListCard";
import { useAlbumStore } from "@/store/albumStore";
import type { Batch, SortOrder, EraFilter } from "@/types";

interface FeedProps {
  batches: Batch[];
}

const ERA_TABS: { label: string; value: EraFilter }[] = [
  { label: "ALL TIME", value: "all" },
  { label: "50s", value: "50s" },
  { label: "60s", value: "60s" },
  { label: "70s", value: "70s" },
  { label: "80s+", value: "80s+" },
];

const SORT_TABS: { label: string; value: SortOrder }[] = [
  { label: "NEW", value: "new" },
  { label: "TOP", value: "top" },
  { label: "COMMENTS", value: "comments" },
  { label: "STARS", value: "stars" },
];

function getEra(year: number): EraFilter {
  if (year < 1960) return "50s";
  if (year < 1970) return "60s";
  if (year < 1980) return "70s";
  return "80s+";
}

export function Feed({ batches }: FeedProps) {
  const [eraFilter, setEraFilter] = useState<EraFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("stars");
  const ratings = useAlbumStore((s) => s.ratings);
  const comments = useAlbumStore((s) => s.comments);

  // For now we handle a single batch (Miles Davis Discography)
  const batch = batches[0];

  const filteredAndSorted = useMemo(() => {
    let albums = batch.albums.filter((a) =>
      eraFilter === "all" ? true : a.year > 0 && getEra(a.year) === eraFilter
    );

    return [...albums].sort((a, b) => {
      switch (sortOrder) {
        case "new":
          return b.year - a.year;
        case "top":
          return (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0);
        case "comments":
          return (
            (comments[b.id]?.length ?? 0) - (comments[a.id]?.length ?? 0)
          );
        case "stars":
          return a.year - b.year;
      }
    });
  }, [batch.albums, eraFilter, sortOrder, ratings, comments]);

  const ratedCount = batch.albums.filter((a) => ratings[a.id]).length;
  const totalGifs = Object.values(comments).reduce(
    (n, arr) => n + arr.length,
    0
  );

  return (
    <div>
      {/* Batch title row */}
      <div className="flex items-center justify-center py-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold tracking-wide">
            {batch.name}
          </span>
          <span className="text-zinc-600 text-sm">▾</span>
        </div>
      </div>

      {/* Era filter tabs */}
      <div className="flex items-center border-b border-zinc-900 overflow-x-auto">
        <span className="text-zinc-700 px-3 text-sm shrink-0">▾</span>
        {ERA_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setEraFilter(value)}
            className={`px-4 py-3 text-xs font-semibold tracking-widest shrink-0 transition-colors cursor-pointer border-b-2 -mb-px ${
              eraFilter === value
                ? "text-red-500 border-red-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto px-4 flex items-center gap-3 text-xs text-zinc-600 shrink-0">
          <span>{ratedCount} rated</span>
          <span>{totalGifs} GIFs</span>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center border-b border-zinc-900">
        {SORT_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSortOrder(value)}
            className={`px-5 py-2.5 text-xs tracking-widest font-medium transition-colors cursor-pointer ${
              sortOrder === value
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Album list */}
      <div>
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            No albums in this era yet.
          </div>
        ) : (
          filteredAndSorted.map((album, index) => (
            <AlbumListCard key={album.id} album={album} rank={index + 1} />
          ))
        )}
      </div>
    </div>
  );
}
