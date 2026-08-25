import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectLocaleFromAcceptLanguage } from "@/lib/i18n";
import WeatherDashboard from "@/components/WeatherDashboard";

export default async function Home() {
  const [session, headerList] = await Promise.all([auth(), headers()]);
  const locale = detectLocaleFromAcceptLanguage(headerList.get("accept-language"));

  const savedLocations = session?.user?.id
    ? await prisma.location.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, latitude: true, longitude: true },
      })
    : [];

  return (
    <WeatherDashboard
      locale={locale}
      isAuthenticated={Boolean(session?.user)}
      initialSavedLocations={savedLocations}
    />
  );
}
