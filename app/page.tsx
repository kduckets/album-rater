import { Feed } from "@/components/Feed";
import type { Batch } from "@/types";

const STUDIO_ALBUMS = [
  "Birth of the Cool",
  "Cookin' with the Miles Davis Quintet",
  "Relaxin' with the Miles Davis Quintet",
  "Milestones",
  "Workin' with the Miles Davis Quintet",
  "Kind of Blue",
  "Sketches of Spain",
  "Steamin' with the Miles Davis Quintet",
  "Someday My Prince Will Come",
  "Seven Steps to Heaven",
  "E.S.P.",
  "Miles Smiles",
  "Sorcerer",
  "Nefertiti",
  "Filles de Kilimanjaro",
  "In a Silent Way",
  "Bitches Brew",
  "A Tribute to Jack Johnson",
  "On the Corner",
  "Agharta",
  "The Man with the Horn",
  "Star People",
  "Decoy",
  "You're Under Arrest",
  "Tutu",
  "Amandla",
  "Doo-Bop",
];

const LABELS: Record<string, string> = {
  "Birth of the Cool": "Capitol",
  "Cookin' with the Miles Davis Quintet": "Prestige",
  "Relaxin' with the Miles Davis Quintet": "Prestige",
  "Workin' with the Miles Davis Quintet": "Prestige",
  "Steamin' with the Miles Davis Quintet": "Prestige",
  "Tutu": "Warner Bros.",
  "Amandla": "Warner Bros.",
  "Doo-Bop": "Warner Bros.",
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(
      /\s*[\(\[](remaster|deluxe|anniversary|edition|version|expanded|reissue|bonus)[^\)\]]*[\)\]]\s*/gi,
      ""
    )
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchesStudio(itunesTitle: string): string | null {
  const norm = normalizeTitle(itunesTitle);
  return STUDIO_ALBUMS.find((s) => normalizeTitle(s) === norm) ?? null;
}

async function getMilesDavisAlbums() {
  try {
    const res = await fetch(
      "https://itunes.apple.com/search?term=miles+davis&entity=album&attribute=artistTerm&limit=200&country=us"
    );
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.results as any[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const itunesResults = await getMilesDavisAlbums();

  const seen = new Set<string>();
  const matched: {
    canonicalTitle: string;
    year: number;
    artworkUrl: string;
    id: string;
  }[] = [];

  for (const item of itunesResults) {
    if (item.artistName?.toLowerCase() !== "miles davis") continue;
    const canonical = matchesStudio(item.collectionName);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    matched.push({
      canonicalTitle: canonical,
      year: new Date(item.releaseDate).getFullYear(),
      artworkUrl: item.artworkUrl100?.replace("100x100bb", "600x600bb") ?? "",
      id: String(item.collectionId),
    });
  }

  for (const title of STUDIO_ALBUMS) {
    if (!seen.has(title)) {
      matched.push({
        canonicalTitle: title,
        year: 0,
        artworkUrl: "",
        id: `fallback-${title}`,
      });
    }
  }

  matched.sort(
    (a, b) =>
      STUDIO_ALBUMS.indexOf(a.canonicalTitle) -
      STUDIO_ALBUMS.indexOf(b.canonicalTitle)
  );

  const albums = matched.map((m) => ({
    id: m.id,
    title: m.canonicalTitle,
    year: m.year,
    batchId: "miles-davis",
    artworkUrl: m.artworkUrl,
    label: LABELS[m.canonicalTitle] ?? "Columbia",
  }));

  const batches: Batch[] = [
    {
      id: "miles-davis",
      name: "Miles Davis Discography",
      description:
        "The complete studio discography of Miles Davis — jazz trumpeter, composer, and one of the most influential musicians of the 20th century.",
      albums,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
            <span className="text-black text-xs font-bold leading-none">♪</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
            AlbumRater
          </span>
        </div>

        {/* Center: post an album */}
        <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-xs tracking-wide">post an album</span>
        </button>

        {/* Right icons */}
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
