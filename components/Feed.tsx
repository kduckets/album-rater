"use client";

import { useState, useMemo, useEffect } from "react";
import { AlbumListCard } from "./AlbumListCard";
import { AlbumGridCard } from "./AlbumGridCard";
import { useAlbumStore } from "@/store/albumStore";
import { useAveragesStore } from "@/store/averagesStore";
import type { Album, Batch, SortOrder, EraFilter } from "@/types";

interface FeedProps {
  batches: Batch[];
  allDiscography?: Album[];
}

const ERA_TABS: { label: string; value: EraFilter }[] = [
  { label: "ALL TIME", value: "all" },
  { label: "50s",      value: "50s"    },
  { label: "60s",      value: "60s"    },
  { label: "70s",      value: "70s"    },
  { label: "80s",      value: "80s"    },
  { label: "90s",      value: "90s"    },
  { label: "2000s+",   value: "2000s+" },
];

const SORT_TABS: { label: string; value: SortOrder }[] = [
  { label: "CHRON",    value: "stars"    },
  { label: "NEW",      value: "new"      },
  { label: "TOP",      value: "top"      },
  { label: "COMMENTS", value: "comments" },
];

const COLUMBIA_LABELS = new Set([
  "Columbia", "Columbia/Legacy", "CBS", "CBS Special Products", "CBS/Sony", "Legacy",
]);

type ViewMode    = "classic" | "grid";
type TypeFilter  = "all" | "studio" | "live" | "compilation";
type LabelFilter = "all" | "Columbia" | "Prestige" | "Blue Note" | "Other";
type StatusFilter = "all" | "rated" | "unrated";

function getLabelGroup(label?: string): "Columbia" | "Prestige" | "Blue Note" | "Other" {
  if (!label) return "Other";
  if (COLUMBIA_LABELS.has(label)) return "Columbia";
  if (label === "Prestige") return "Prestige";
  if (label === "Blue Note") return "Blue Note";
  return "Other";
}

function getEra(year: number): EraFilter {
  if (year < 1960) return "50s";
  if (year < 1970) return "60s";
  if (year < 1980) return "70s";
  if (year < 1990) return "80s";
  if (year < 2000) return "90s";
  return "2000s+";
}

export function Feed({ batches, allDiscography }: FeedProps) {
  const [viewMode, setViewMode]         = useState<ViewMode>("classic");
  const [eraFilter, setEraFilter]       = useState<EraFilter>("all");
  const [sortOrder, setSortOrder]       = useState<SortOrder>("stars");
  const [labelFilter, setLabelFilter]   = useState<LabelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const ratings  = useAlbumStore((s) => s.ratings);
  const comments = useAlbumStore((s) => s.comments);

  const averages       = useAveragesStore((s) => s.averages);
  const lastCommentAt  = useAveragesStore((s) => s.lastCommentAt);
  const fetchAverages  = useAveragesStore((s) => s.fetchAverages);

  const batch      = batches[0];
  const gridSource = batch.albums; // studio albums only in both views

  useEffect(() => {
    fetchAverages(gridSource.map((a) => a.id));
  }, [gridSource, fetchAverages]);

  // Classic view: studio albums
  const filteredAndSorted = useMemo(() => {
    const filtered = batch.albums.filter((a) =>
      eraFilter === "all" ? true : a.year > 0 && getEra(a.year) === eraFilter
    );
    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case "new":      return b.year - a.year;
        case "top":      return (averages[b.id] ?? 0) - (averages[a.id] ?? 0);
        case "comments": return (lastCommentAt[b.id] ?? 0) - (lastCommentAt[a.id] ?? 0);
        case "stars":    return a.year - b.year;
      }
    });
  }, [batch.albums, eraFilter, sortOrder, averages, lastCommentAt]);

  // Grid view: full discography with extra filters
  const gridAlbums = useMemo(() => {
    let list = gridSource;
    if (eraFilter !== "all")
      list = list.filter((a) => a.year > 0 && getEra(a.year) === eraFilter);
    if (labelFilter !== "all")
      list = list.filter((a) => getLabelGroup(a.label) === labelFilter);
    if (statusFilter === "rated")
      list = list.filter((a) => (ratings[a.id] ?? 0) > 0);
    if (statusFilter === "unrated")
      list = list.filter((a) => !(ratings[a.id] ?? 0));
    return [...list].sort((a, b) => {
      switch (sortOrder) {
        case "new":      return b.year - a.year;
        case "top":      return (averages[b.id] ?? 0) - (averages[a.id] ?? 0);
        case "comments": return (lastCommentAt[b.id] ?? 0) - (lastCommentAt[a.id] ?? 0);
        case "stars":    return a.year - b.year;
      }
    });
  }, [gridSource, eraFilter, labelFilter, statusFilter, sortOrder, averages, lastCommentAt, ratings]);

  const ratedCount = batch.albums.filter((a) => ratings[a.id]).length;
  const totalGifs  = Object.values(comments).reduce((n, arr) => n + arr.length, 0);

  return (
    <div>
      {/* Batch title */}
      <div className="flex items-center justify-center py-3 border-b border-zinc-900">
        <span className="text-white font-semibold tracking-wide">{batch.name}</span>
        <span className="text-zinc-600 text-sm ml-2">▾</span>
      </div>

      {/* Era filter */}
      <div className="flex items-center border-b border-zinc-900 overflow-x-auto overflow-y-hidden" style={{ touchAction: "pan-x" }}>
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
          {viewMode === "classic" ? (
            <>
              <span>{batch.albums.length} albums</span>
              <span>{ratedCount} rated</span>
              {totalGifs > 0 && <span>{totalGifs} GIFs</span>}
            </>
          ) : (
            <span>{gridAlbums.length} of {gridSource.length}</span>
          )}
        </div>
      </div>

      {/* Sort tabs + view toggle */}
      <div className="flex items-center border-b border-zinc-900">
        {SORT_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSortOrder(value)}
            className={`px-5 py-2.5 text-xs tracking-widest font-medium transition-colors cursor-pointer ${
              sortOrder === value ? "text-white" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto pr-3 flex items-center gap-0.5">
          <button
            onClick={() => setViewMode("classic")}
            title="Classic"
            aria-label="Classic view"
            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === "classic" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            {/* List icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Grid"
            aria-label="Grid view"
            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === "grid" ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            {/* Grid icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Grid-only filter chips */}
      {viewMode === "grid" && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-900 overflow-x-auto overflow-y-hidden"
          style={{ touchAction: "pan-x" }}
        >
          {(["all", "Columbia", "Prestige", "Blue Note", "Other"] as LabelFilter[]).map((l) => (
            <button
              key={l}
              onClick={() => setLabelFilter(l)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
                labelFilter === l ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {l === "all" ? "All labels" : l}
            </button>
          ))}

          <span className="text-zinc-800 shrink-0">·</span>

          {(["all", "rated", "unrated"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
                statusFilter === s
                  ? s === "all" ? "bg-white text-black" : "bg-amber-400 text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {viewMode === "classic" ? (
        <div className="flex flex-col gap-3 py-3 px-2 sm:px-0">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 text-sm">No studio albums in this era.</div>
          ) : (
            filteredAndSorted.map((album) => (
              <AlbumListCard key={album.id} album={album} allAlbums={batch.albums} />
            ))
          )}
        </div>
      ) : (
        <div className="px-2 sm:px-3 py-3">
          {gridAlbums.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 text-sm">No albums match these filters.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-2">
              {gridAlbums.map((album) => (
                <AlbumGridCard key={album.id} album={album} allAlbums={gridSource} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
