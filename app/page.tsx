import { Feed } from "@/components/Feed";
import { MILES_DAVIS_DISCOGRAPHY } from "@/data/milesDavisDiscography";
import type { Batch } from "@/types";

function normalizeTitle(t: string) {
  return t
    .toLowerCase()
    .replace(/\s*[\(\[](remaster|deluxe|anniversary|edition|version|expanded|reissue|bonus)[^\)\]]*[\)\]]\s*/gi, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchItunesArtwork(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch(
      "https://itunes.apple.com/search?term=miles+davis&entity=album&attribute=artistTerm&limit=200&country=us"
    );
    if (!res.ok) return map;
    const data = await res.json();
    for (const item of data.results) {
      if (item.artistName?.toLowerCase() !== "miles davis") continue;
      const key = normalizeTitle(item.collectionName ?? "");
      if (key && item.artworkUrl100) {
        map.set(key, item.artworkUrl100.replace("100x100bb", "600x600bb"));
      }
    }
  } catch {
    // fall through — all albums will use the photo fallback
  }
  return map;
}

export default async function Home() {
  const artworkMap = await fetchItunesArtwork();

  const albums = MILES_DAVIS_DISCOGRAPHY.filter((e) => e.type === "studio").map((entry, i) => {
    const key = normalizeTitle(entry.title);
    return {
      id: `md-${i}`,
      title: entry.title,
      year: entry.year,
      batchId: "miles-davis",
      artworkUrl: artworkMap.get(key) ?? "",
      label: entry.label,
      type: entry.type,
    };
  });

  const batches: Batch[] = [
    {
      id: "miles-davis",
      name: "Miles Davis Discography",
      description:
        "The complete discography of Miles Davis — studio albums, live recordings, and compilations.",
      albums,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
            <span className="text-black text-xs font-bold leading-none">♪</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
            AlbumRater
          </span>
        </div>

        <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-xs tracking-wide">post an album</span>
        </button>

        <div className="flex items-center gap-3 text-zinc-500">
          <button className="hover:text-white transition-colors cursor-pointer" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <button className="hover:text-white transition-colors cursor-pointer" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="w-6 h-6 rounded-full bg-zinc-700" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <Feed batches={batches} />
      </main>
    </div>
  );
}
