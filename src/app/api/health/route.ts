import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";

export async function GET() {
  try {
    await Promise.all([prisma.$queryRaw`SELECT 1`, pingRedis()]);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("health check failed", err);
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  }
}
