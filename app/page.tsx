import { Feed } from "@/components/Feed";
import { MILES_DAVIS_DISCOGRAPHY } from "@/data/milesDavisDiscography";
import type { Batch } from "@/types";

const LASTFM_KEY = "5f3f26020d42b6c407e571e17c6e493f";

function normalizeTitle(t: string) {
  return t
    .toLowerCase()
    .replace(/\s*[\(\[](remaster|deluxe|anniversary|edition|version|expanded|reissue|bonus)[^\)\]]*[\)\]]\s*/gi, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// More aggressive normalization for matching descriptions by title + year
function normalizeForDesc(t: string) {
  return t
    .toLowerCase()
    .replace(/\bvol(ume)?\.?\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchDescriptions(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch("https://cmurray1221.github.io/posts.json", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return map;
    const posts: Array<{ title: string; year: number; notes: string }> = await res.json();
    for (const post of posts) {
      const key = `${post.year}-${normalizeForDesc(post.title)}`;
      const notes = post.notes.replace(/^-\s*/, "").trim();
      map.set(key, notes);
    }
  } catch { /* fall through */ }
  return map;
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
    // fall through — all albums will use Last.fm or photo fallback
  }
  return map;
}

async function fetchLastFmImage(title: string): Promise<string> {
  try {
    const url =
      `https://ws.audioscrobbler.com/2.0/?method=album.getinfo` +
      `&artist=Miles+Davis&album=${encodeURIComponent(title)}` +
      `&api_key=${LASTFM_KEY}&format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return "";
    const data = await res.json();
    const images: Array<{ "#text": string; size: string }> = data.album?.image ?? [];
    for (const size of ["extralarge", "mega", "large"]) {
      const img = images.find((i) => i.size === size);
      if (img?.["#text"]) return img["#text"];
    }
  } catch {
    // fall through
  }
  return "";
}

export default async function Home() {
  const [artworkMap, descMap] = await Promise.all([
    fetchItunesArtwork(),
    fetchDescriptions(),
  ]);

  const studioAlbums = MILES_DAVIS_DISCOGRAPHY.filter((e) => e.type === "studio");

  // Fetch Last.fm in parallel for albums iTunes doesn't have
  const missingAlbums = studioAlbums.filter((e) => !artworkMap.has(normalizeTitle(e.title)));
  const lastFmResults = await Promise.all(
    missingAlbums.map(async (e) => ({ title: e.title, url: await fetchLastFmImage(e.title) }))
  );
  const lastFmMap = new Map(lastFmResults.filter((r) => r.url).map((r) => [r.title, r.url]));

  const albums = studioAlbums.map((entry, i) => ({
    id: `md-${i}`,
    title: entry.title,
    year: entry.year,
    batchId: "miles-davis",
    artworkUrl: artworkMap.get(normalizeTitle(entry.title)) ?? lastFmMap.get(entry.title) ?? "",
    label: entry.label,
    type: entry.type,
    description: descMap.get(`${entry.year}-${normalizeForDesc(entry.title)}`),
  }));

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
          <div className="relative w-8 h-8 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flockify.png"
              alt="Flockify420 logo"
              className="h-8 w-auto invert"
              style={{ maxWidth: "none" }}
            />
            <span className="absolute bottom-0 right-0 text-[6px] text-white/40 font-mono leading-none">420</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide">
            Flockify<span className="text-zinc-500 font-normal text-xs ml-0.5">4.2.0</span>
          </span>
        </div>

        <div />

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
