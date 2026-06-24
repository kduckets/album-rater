import { NextRequest, NextResponse } from "next/server";
import { pipeline, avgFromHgetall } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { albumId, userId, rating } = await req.json() as {
    albumId: string; userId: string; rating: number;
  };
  if (!albumId || !userId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const key = `r:${albumId}`;
  const cmd = rating === 0
    ? ["HDEL", key, userId]
    : ["HSET", key, userId, String(rating)];

  const [, hgetallRes] = await pipeline([cmd, ["HGETALL", key]]);
  const average = avgFromHgetall(hgetallRes.result);

  return NextResponse.json({ average });
}
