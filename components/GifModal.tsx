"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAlbumStore } from "@/store/albumStore";
import { useAveragesStore } from "@/store/averagesStore";
import { getVisitorId } from "@/lib/visitorId";
import { getDisplayName, setDisplayName, hasSetDisplayName } from "@/lib/displayName";
import type { Album, GifComment } from "@/types";

interface GifModalProps {
  album: Album;
  allAlbums: Album[];
  onClose: () => void;
}

const FALLBACK_IMG = "/miles-davis.png";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

function SaveIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function ChevronUp() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>; }
function ChevronDn() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>; }
function FlagIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>; }

type AddMode = "default" | "name-prompt" | "search" | "paste";

interface GifResult { id: string; title: string; url: string; preview: string }

export function GifModal({ album, allAlbums, onClose }: GifModalProps) {
  const [addMode, setAddMode]         = useState<AddMode>("default");
  const [pendingMode, setPendingMode] = useState<"search" | "paste" | null>(null);
  const [nameInput, setNameInput]     = useState("");
  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<GifResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [gifUrl, setGifUrl]           = useState("");
  const [preview, setPreview]         = useState("");
  const [pasteErr, setPasteErr]       = useState(false);
  const [artErr, setArtErr]           = useState(false);
  const [comments, setComments]       = useState<GifComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting]         = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const pasteRef    = useRef<HTMLInputElement>(null);
  const nameRef     = useRef<HTMLInputElement>(null);

  const rating     = useAlbumStore((s) => s.ratings[album.id] ?? 0);
  const setRating  = useAlbumStore((s) => s.setRating);
  const setCommentCount   = useAveragesStore((s) => s.setCommentCount);
  const setLastCommentAt  = useAveragesStore((s) => s.setLastCommentAt);

  const visitorId  = getVisitorId();

  // Fetch comments from server on mount
  useEffect(() => {
    setLoadingComments(true);
    fetch(`/api/comments?albumId=${encodeURIComponent(album.id)}`)
      .then((r) => r.json())
      .then((data) => { setComments(data.comments ?? []); })
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [album.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => { if (addMode === "search") searchRef.current?.focus(); }, [addMode]);
  useEffect(() => { if (addMode === "paste")  pasteRef.current?.focus();  }, [addMode]);
  useEffect(() => { if (addMode === "name-prompt") nameRef.current?.focus(); }, [addMode]);

  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${album.title} Miles Davis`)}`;

  const related = allAlbums
    .filter((a) => a.id !== album.id && a.artworkUrl)
    .sort((a, b) => Math.abs(a.year - album.year) - Math.abs(b.year - album.year))
    .slice(0, 4);

  function startAddMode(mode: "search" | "paste") {
    if (!hasSetDisplayName()) {
      setPendingMode(mode);
      setAddMode("name-prompt");
    } else {
      setAddMode(mode);
    }
  }

  function confirmName() {
    setDisplayName(nameInput); // "" = anonymous, also valid
    const next = pendingMode ?? "search";
    setPendingMode(null);
    setAddMode(next);
  }

  async function postComment(url: string) {
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: album.id,
          gifUrl: url,
          author: getDisplayName(),
          visitorId,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        const updated = [...comments, data.comment];
        setComments(updated);
        setCommentCount(album.id, updated.length);
        setLastCommentAt(album.id, data.comment.timestamp);
      }
    } catch { /* fail silently */ }
    setPosting(false);
  }

  async function deleteComment(commentId: string) {
    try {
      await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: album.id, commentId, visitorId }),
      });
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      setCommentCount(album.id, updated.length);
    } catch { /* fail silently */ }
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.gifs ?? []);
    } catch { /* leave results empty */ }
    setSearching(false);
  }

  async function pickGif(url: string) {
    await postComment(url);
    setAddMode("default");
    setQuery("");
    setResults([]);
  }

  function handlePastePreview() {
    const url = gifUrl.trim();
    if (!url) return;
    try { if (new URL(url).protocol !== "https:") return; } catch { return; }
    setPasteErr(false);
    setPreview(url);
  }

  async function handlePastePost() {
    if (!preview || pasteErr) return;
    await postComment(preview);
    setGifUrl(""); setPreview(""); setPasteErr(false);
    setAddMode("default");
  }

  function resetAdd() {
    setAddMode("default");
    setQuery(""); setResults([]);
    setGifUrl(""); setPreview(""); setPasteErr(false);
  }

  const myName = hasSetDisplayName() ? getDisplayName() : null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-x-hidden"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="flex flex-col w-full h-full max-w-5xl max-h-[96vh] mx-auto rounded-lg overflow-hidden shadow-2xl">

        {/* ── Header: always at top, full width ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 shrink-0 bg-black">
          <button
            onClick={onClose}
            className="flex items-center gap-2 cursor-pointer group"
            aria-label="Back to feed"
          >
            <div className="w-8 h-8 overflow-hidden shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/flockify.png" alt="Flockify420" className="h-8 w-auto invert" style={{ maxWidth: "none" }} />
            </div>
            <span className="text-white font-bold text-sm tracking-wide">
              Flockify<span className="text-zinc-500 font-normal text-xs ml-0.5">4.2.0</span>
            </span>
          </button>
          <div className="flex items-center gap-4">
            {myName !== null && (
              <button
                onClick={() => { setAddMode("name-prompt"); setNameInput(myName); }}
                className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors cursor-pointer"
              >
                {myName ? myName : "Anonymous"} ·{" "}
                <span className="text-zinc-700">change</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-white transition-colors cursor-pointer text-lg leading-none"
            >✕</button>
          </div>
        </div>

        {/* ── Body: art + details ── */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">

          {/* Album art */}
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full aspect-square sm:w-[42%] shrink-0 bg-black sm:self-start"
            aria-label={`Listen to ${album.title} on Spotify`}
          >
            <Image
              src={artErr || !album.artworkUrl ? FALLBACK_IMG : album.artworkUrl}
              alt={album.title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 42vw"
              onError={() => setArtErr(true)}
            />
          </a>

          {/* Details panel */}
          <div className="flex-1 bg-black text-white flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8 space-y-5">

              {/* Title + meta */}
              <div>
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4a90d9] font-semibold text-sm leading-snug hover:underline block"
                >
                  Miles Davis – {album.title}{album.year ? ` (${album.year})` : ""}
                </a>
                <p className="text-zinc-500 text-xs mt-1">
                  posted by <span className="text-zinc-300">you</span> &nbsp;·&nbsp; {album.year || "—"}
                </p>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-lg leading-none ${rating >= s ? "text-amber-400" : "text-zinc-700"}`}>★</span>
                ))}
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-3">
                <button className="text-zinc-500 hover:text-white transition-colors cursor-pointer" aria-label="Save"><SaveIcon /></button>
                <button onClick={() => setRating(album.id, Math.min(5, rating + 1))} className="text-zinc-500 hover:text-white transition-colors cursor-pointer" aria-label="Rate up"><ChevronUp /></button>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-sm font-bold shrink-0 select-none">
                  {rating > 0 ? rating : "—"}
                </div>
                <button onClick={() => setRating(album.id, Math.max(0, rating - 1))} className="text-zinc-500 hover:text-white transition-colors cursor-pointer" aria-label="Rate down"><ChevronDn /></button>
                <button className="text-zinc-500 hover:text-white transition-colors cursor-pointer" aria-label="Flag"><FlagIcon /></button>
              </div>

              <hr className="border-zinc-800" />

              {/* Description */}
              {album.description && (
                <p className="text-zinc-400 text-sm leading-relaxed italic">
                  {album.description}
                </p>
              )}

              {/* GIF comments */}
              {loadingComments ? (
                <p className="text-zinc-700 text-xs text-center py-4">Loading comments…</p>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 group">
                      <div className="w-20 h-20 rounded overflow-hidden bg-zinc-900 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.gifUrl} alt="GIF" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-between h-20 min-w-0">
                        <span className="text-xl select-none">👍</span>
                        <div>
                          <p className="text-zinc-500 text-xs">
                            <span className="text-zinc-300">{c.author || "Anonymous"}</span>
                            &nbsp;·&nbsp;{timeAgo(c.timestamp)}
                          </p>
                          {c.visitorId === visitorId && (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="text-zinc-700 hover:text-red-400 text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* ── Add GIF section ── */}
              <div>
                {addMode !== "name-prompt" && (
                  <p className="text-zinc-400 text-sm mb-3">Add a gif comment:</p>
                )}

                {/* Name prompt */}
                {addMode === "name-prompt" && (
                  <div className="space-y-3">
                    <p className="text-zinc-400 text-sm">What should we call you?</p>
                    <input
                      ref={nameRef}
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmName()}
                      placeholder="Your name (leave blank for anonymous)"
                      maxLength={32}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={resetAdd}
                        className="flex-1 py-2 border border-zinc-700 hover:border-zinc-500 rounded text-sm text-zinc-400 cursor-pointer transition-colors"
                      >Cancel</button>
                      <button
                        onClick={confirmName}
                        className="flex-1 py-2 bg-white text-black font-semibold rounded text-sm cursor-pointer hover:bg-zinc-200 transition-colors"
                      >Continue</button>
                    </div>
                  </div>
                )}

                {addMode === "default" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => startAddMode("search")}
                      className="flex-1 py-2.5 border border-zinc-700 hover:border-zinc-400 rounded text-center text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >Search for a gif</button>
                    <button
                      onClick={() => startAddMode("paste")}
                      className="flex-1 py-2.5 border border-zinc-700 hover:border-zinc-400 rounded text-center text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >Paste gif link</button>
                  </div>
                )}

                {addMode === "search" && (
                  <div className="space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <input
                        ref={searchRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a GIF…"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={searching || !query.trim()}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >{searching ? "…" : "Search"}</button>
                    </form>

                    {searching && (
                      <p className="text-zinc-600 text-xs text-center py-4">Loading…</p>
                    )}

                    {!searching && results.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {results.map((gif) => (
                          <button
                            key={gif.id}
                            onClick={() => pickGif(gif.url)}
                            disabled={posting}
                            className="relative aspect-square rounded overflow-hidden bg-zinc-900 cursor-pointer hover:ring-2 hover:ring-white transition-all disabled:opacity-50"
                            title={gif.title}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={gif.preview} alt={gif.title} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {!searching && query && results.length === 0 && (
                      <p className="text-zinc-600 text-xs text-center py-4">No results — try a different search.</p>
                    )}

                    <button
                      onClick={resetAdd}
                      className="w-full py-2 border border-zinc-800 hover:border-zinc-600 rounded text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
                    >Cancel</button>
                  </div>
                )}

                {addMode === "paste" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        ref={pasteRef}
                        type="url"
                        value={gifUrl}
                        onChange={(e) => setGifUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePastePreview()}
                        placeholder="https://media.giphy.com/…"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                      <button
                        onClick={handlePastePreview}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 cursor-pointer transition-colors"
                      >Preview</button>
                    </div>
                    {preview && !pasteErr && (
                      <div className="rounded overflow-hidden bg-zinc-900 max-h-40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="preview" className="max-h-40 object-contain" onError={() => setPasteErr(true)} />
                      </div>
                    )}
                    {pasteErr && <p className="text-red-400 text-xs">Couldn&apos;t load that GIF — check the URL.</p>}
                    <div className="flex gap-2">
                      <button onClick={resetAdd} className="flex-1 py-2 border border-zinc-700 hover:border-zinc-500 rounded text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors">Cancel</button>
                      <button
                        onClick={handlePastePost}
                        disabled={!preview || pasteErr || posting}
                        className="flex-1 py-2 bg-white text-black font-semibold rounded text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
                      >Post</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Related Albums */}
              {related.length > 0 && (
                <>
                  <hr className="border-zinc-800" />
                  <div>
                    <p className="text-zinc-400 text-sm font-medium mb-3">Related Albums:</p>
                    <div className="flex gap-2">
                      {related.map((rel) => (
                        <a
                          key={rel.id}
                          href={`https://open.spotify.com/search/${encodeURIComponent(`${rel.title} Miles Davis`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative w-16 h-16 rounded overflow-hidden bg-zinc-900 shrink-0 hover:opacity-75 transition-opacity"
                          title={rel.title}
                        >
                          <Image src={rel.artworkUrl || FALLBACK_IMG} alt={rel.title} fill className="object-cover" sizes="64px" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
