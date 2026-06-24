import { NextRequest, NextResponse } from "next/server";

// Free GIPHY dev key — replace with GIPHY_API_KEY env var for production
const KEY = process.env.GIPHY_API_KEY ?? "dc6zaTOxFJmzC";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ gifs: [] });

  try {
    const url =
      `https://api.giphy.com/v1/gifs/search` +
      `?api_key=${KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g&lang=en`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return NextResponse.json({ gifs: [] });
    const data = await res.json();

    type GiphyImage = { url?: string; webp?: string };
    type GiphyItem = { id: string; title: string; images: Record<string, GiphyImage> };

    const gifs = (data.data as GiphyItem[]).flatMap((item) => {
      const url = item.images.fixed_height?.url ?? item.images.original?.url ?? "";
      const preview = item.images.fixed_height_small?.url ?? url;
      return url ? [{ id: item.id, title: item.title, url, preview }] : [];
    });

    return NextResponse.json({ gifs });
  } catch {
    return NextResponse.json({ gifs: [] });
  }
}
