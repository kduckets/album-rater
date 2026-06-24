import { NextRequest, NextResponse } from "next/server";
import { pipeline, avgFromHgetall } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { ids }: { ids: string[] } = await req.json();
  if (!ids?.length) return NextResponse.json({ averages: {}, commentCounts: {} });

  // Interleave: HGETALL r:{id} (ratings) + HLEN c:{id} (comment count)
  const cmds = ids.flatMap((id) => [
    ["HGETALL", `r:${id}`],
    ["HLEN", `c:${id}`],
  ]);
  const results = await pipeline(cmds);

  const averages: Record<string, number> = {};
  const commentCounts: Record<string, number> = {};

  ids.forEach((id, i) => {
    const avg = avgFromHgetall(results[i * 2].result);
    if (avg !== null) averages[id] = avg;
    const count = typeof results[i * 2 + 1].result === "number"
      ? (results[i * 2 + 1].result as number)
      : 0;
    if (count > 0) commentCounts[id] = count;
  });

  return NextResponse.json({ averages, commentCounts });
}
