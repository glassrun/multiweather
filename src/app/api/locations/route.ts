import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createLocationSchema = z.object({
  label: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(80).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await prisma.location.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ locations });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid location data" }, { status: 400 });
  }

  const location = await prisma.location.upsert({
    where: {
      userId_latitude_longitude: {
        userId: session.user.id,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      },
    },
    create: { ...parsed.data, userId: session.user.id },
    update: { label: parsed.data.label, timezone: parsed.data.timezone },
  });

  return NextResponse.json({ location }, { status: 201 });
}
