import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WeatherDashboard from "@/components/WeatherDashboard";

export default async function Home() {
  const session = await auth();

  const savedLocations = session?.user?.id
    ? await prisma.location.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, latitude: true, longitude: true },
      })
    : [];

  return <WeatherDashboard isAuthenticated={Boolean(session?.user)} initialSavedLocations={savedLocations} />;
}
