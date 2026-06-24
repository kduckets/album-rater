"use client";

import { useEffect, useRef, useState } from "react";
import { getUsername, setUsername, hasSetUsername, getAvatar, setAvatar, AVATARS, getEffectiveUserId } from "@/lib/identity";
import { useAlbumStore } from "@/store/albumStore";

interface Props { albumIds: string[] }

export function UsernameButton({ albumIds }: Props) {
  const [mounted, setMounted]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [input, setInput]           = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [syncing, setSyncing]       = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const loadRatings                 = useAlbumStore((s) => s.loadRatings);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (open) {
      setInput(getUsername());
      setSelectedAvatar(getAvatar());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  async function confirm() {
    const name = input.trim();
    setUsername(name);
    setAvatar(selectedAvatar);
    setOpen(false);

    if (name && albumIds.length) {
      setSyncing(true);
      try {
        const res = await fetch("/api/my-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: name, albumIds }),
        });
        const data = await res.json();
        if (data.ratings) loadRatings(data.ratings);
      } catch { /* fail silently */ }
      setSyncing(false);
    }
  }

  const currentName   = mounted ? getUsername() : "";
  const currentAvatar = mounted ? getAvatar() : "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 cursor-pointer group"
        aria-label={currentName ? `Signed in as ${currentName}` : "Set username"}
        title={currentName ? `Signed in as ${currentName}` : "Set username to sync ratings"}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors overflow-hidden ${
          currentName
            ? "bg-amber-400 group-hover:bg-amber-300"
            : "bg-zinc-700 group-hover:bg-zinc-600"
        }`}>
          {currentAvatar ? (
            <span className="text-sm leading-none">{currentAvatar}</span>
          ) : currentName ? (
            <span className="text-[10px] font-bold text-black">{currentName[0].toUpperCase()}</span>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>
        {syncing && <span className="text-zinc-600 text-[10px]">syncing…</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-white font-semibold text-base mb-1">Your profile</h3>
            <p className="text-zinc-500 text-sm mb-4 leading-relaxed">
              Pick an avatar and set a username to sync your ratings across devices.
            </p>

            {/* Avatar picker */}
            <div className="grid grid-cols-8 gap-1.5 mb-5">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji === selectedAvatar ? "" : emoji)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                    selectedAvatar === emoji
                      ? "bg-amber-400/20 ring-2 ring-amber-400"
                      : "bg-zinc-900 hover:bg-zinc-800"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
              placeholder="Username (e.g. johndoe)"
              maxLength={32}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors mb-3"
            />
            {hasSetUsername() && currentName && (
              <p className="text-zinc-600 text-xs mb-3">
                Currently signed in as <span className="text-zinc-400">{currentName}</span>
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 border border-zinc-700 hover:border-zinc-500 rounded text-sm text-zinc-400 cursor-pointer transition-colors"
              >Cancel</button>
              <button
                onClick={confirm}
                className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded text-sm cursor-pointer transition-colors"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
