import { NextRequest, NextResponse } from "next/server";
import { pipeline, avgFromHgetall } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { ids }: { ids: string[] } = await req.json();
  if (!ids?.length) return NextResponse.json({ averages: {}, commentCounts: {} });

  // Per-album: HGETALL r:{id} (ratings) + HLEN c:{id} (comment count)
  // Plus one extra command for last-comment timestamps
  const cmds = [
    ...ids.flatMap((id) => [["HGETALL", `r:${id}`], ["HLEN", `c:${id}`]]),
    ["HGETALL", "c:last-comment"],
  ];
  const results = await pipeline(cmds);

  const averages: Record<string, number> = {};
  const commentCounts: Record<string, number> = {};

  ids.forEach((id, i) => {
    const avg = avgFromHgetall(results[i * 2]?.result);
    if (avg !== null) averages[id] = avg;
    const count = typeof results[i * 2 + 1]?.result === "number"
      ? (results[i * 2 + 1].result as number)
      : 0;
    if (count > 0) commentCounts[id] = count;
  });

  // Last-comment timestamps (for recency sort)
  const lastCommentRaw = results[ids.length * 2]?.result;
  const lastCommentAt: Record<string, number> = {};
  if (Array.isArray(lastCommentRaw)) {
    for (let i = 0; i < lastCommentRaw.length - 1; i += 2) {
      const ts = Number(lastCommentRaw[i + 1]);
      if (!isNaN(ts)) lastCommentAt[String(lastCommentRaw[i])] = ts;
    }
  }

  return NextResponse.json({ averages, commentCounts, lastCommentAt });
}
