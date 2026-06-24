import { NextRequest, NextResponse } from "next/server";
import { pipeline, avgFromHgetall } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { ids }: { ids: string[] } = await req.json();
  if (!ids?.length) return NextResponse.json({ averages: {} });

  const results = await pipeline(ids.map((id) => ["HGETALL", `r:${id}`]));

  const averages: Record<string, number> = {};
  results.forEach(({ result }, i) => {
    const avg = avgFromHgetall(result);
    if (avg !== null) averages[ids[i]] = avg;
  });

  return NextResponse.json({ averages });
}
