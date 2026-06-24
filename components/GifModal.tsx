"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAlbumStore } from "@/store/albumStore";
import type { Album } from "@/types";

interface GifModalProps {
  album: Album;
  allAlbums: Album[];
  onClose: () => void;
}

const FALLBACK_IMG = "/miles-davis.png";
const EMPTY_COMMENTS: import("@/types").GifComment[] = [];

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

// Icons
function SaveIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function ChevronUp() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>; }
function ChevronDn() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>; }
function FlagIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>; }

export function GifModal({ album, allAlbums, onClose }: GifModalProps) {
  const [pasteMode, setPasteMode] = useState(false);
  const [gifUrl, setGifUrl]       = useState("");
  const [preview, setPreview]     = useState("");
  const [imgErr, setImgErr]       = useState(false);
  const [artErr, setArtErr]       = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  const comments     = useAlbumStore((s) => s.comments[album.id] ?? EMPTY_COMMENTS);
  const addComment   = useAlbumStore((s) => s.addComment);
  const removeComment = useAlbumStore((s) => s.removeComment);
  const rating       = useAlbumStore((s) => s.ratings[album.id] ?? 0);
  const setRating    = useAlbumStore((s) => s.setRating);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => { if (pasteMode) inputRef.current?.focus(); }, [pasteMode]);

  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${album.title} Miles Davis`)}`;

  const related = allAlbums
    .filter((a) => a.id !== album.id && a.artworkUrl)
    .sort((a, b) => Math.abs(a.year - album.year) - Math.abs(b.year - album.year))
    .slice(0, 4);

  function handlePreview() {
    const url = gifUrl.trim();
    if (!url) return;
    try { if (new URL(url).protocol !== "https:") return; } catch { return; }
    setImgErr(false);
    setPreview(url);
  }

  function handlePost() {
    if (!preview || imgErr) return;
    addComment(album.id, preview);
    setGifUrl(""); setPreview(""); setPasteMode(false); setImgErr(false);
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="flex w-full h-full max-w-5xl max-h-[96vh] mx-auto rounded-lg overflow-hidden shadow-2xl">

        {/* ── Left: album art ────────────────────────────────── */}
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative hidden sm:block w-[42%] shrink-0"
          aria-label={`Listen to ${album.title} on Spotify`}
        >
          <Image
            src={artErr || !album.artworkUrl ? FALLBACK_IMG : album.artworkUrl}
            alt={album.title}
            fill
            className="object-contain"
            sizes="42vw"
            onError={() => setArtErr(true)}
          />
        </a>

        {/* ── Right: details panel ────────────────────────────── */}
        <div className="flex-1 bg-black text-white flex flex-col overflow-hidden">

          {/* Close */}
          <div className="flex justify-end px-5 pt-4 pb-1 shrink-0">
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-white transition-colors cursor-pointer text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5">

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

            {/* Stars (read-only average display) */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-lg leading-none ${rating >= s ? "text-amber-400" : "text-zinc-700"}`}>★</span>
              ))}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-3">
              <button className="text-zinc-500 hover:text-white transition-colors cursor-pointer" aria-label="Save">
                <SaveIcon />
              </button>
              <button
                onClick={() => setRating(album.id, Math.min(5, rating + 1))}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Rate up"
              >
                <ChevronUp />
              </button>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-sm font-bold shrink-0 select-none">
                {rating > 0 ? rating : "—"}
              </div>
              <button
                onClick={() => setRating(album.id, Math.max(0, rating - 1))}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Rate down"
              >
                <ChevronDn />
              </button>
              <button className="text-zinc-500 hover:text-white transition-colors cursor-pointer" aria-label="Flag">
                <FlagIcon />
              </button>
            </div>

            <hr className="border-zinc-800" />

            {/* GIF comments */}
            {comments.length > 0 && (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 group">
                    <div className="relative w-20 h-20 rounded overflow-hidden bg-zinc-900 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.gifUrl} alt="GIF" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between h-20 min-w-0">
                      <span className="text-xl select-none">👍</span>
                      <div>
                        <p className="text-zinc-500 text-xs">
                          posted by <span className="text-zinc-300">you</span> &nbsp;·&nbsp; {timeAgo(c.timestamp)}
                        </p>
                        <button
                          onClick={() => removeComment(album.id, c.id)}
                          className="text-zinc-700 hover:text-red-400 text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add GIF */}
            <div>
              <p className="text-zinc-400 text-sm mb-3">Add a gif comment:</p>

              {!pasteMode ? (
                <div className="flex gap-3">
                  <a
                    href="https://giphy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 border border-zinc-700 hover:border-zinc-400 rounded text-center text-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    Search for a gif
                  </a>
                  <button
                    onClick={() => setPasteMode(true)}
                    className="flex-1 py-2.5 border border-zinc-700 hover:border-zinc-400 rounded text-center text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Paste gif link
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="url"
                      value={gifUrl}
                      onChange={(e) => setGifUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                      placeholder="https://media.giphy.com/..."
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                    <button
                      onClick={handlePreview}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 cursor-pointer transition-colors"
                    >
                      Preview
                    </button>
                  </div>

                  {preview && !imgErr && (
                    <div className="rounded overflow-hidden bg-zinc-900 max-h-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="preview" className="max-h-40 object-contain" onError={() => setImgErr(true)} />
                    </div>
                  )}
                  {imgErr && <p className="text-red-400 text-xs">Couldn't load that GIF — check the URL.</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPasteMode(false); setGifUrl(""); setPreview(""); setImgErr(false); }}
                      className="flex-1 py-2 border border-zinc-700 hover:border-zinc-500 rounded text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePost}
                      disabled={!preview || imgErr}
                      className="flex-1 py-2 bg-white text-black font-semibold rounded text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
                    >
                      Post
                    </button>
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
                        <Image
                          src={rel.artworkUrl || FALLBACK_IMG}
                          alt={rel.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
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
  );
}
