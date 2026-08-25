import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectLocaleFromAcceptLanguage, type Locale } from "@/lib/i18n";
import type { SavedLocation } from "@/components/SavedLocationsList";

export interface DashboardContext {
  locale: Locale;
  isAuthenticated: boolean;
  savedLocations: SavedLocation[];
}

// Shared by every page that renders <WeatherDashboard> (the search landing
// page and each per-city page) so the session/locale/saved-locations lookup
// isn't duplicated across routes.
export async function getDashboardContext(): Promise<DashboardContext> {
  const [session, headerList] = await Promise.all([auth(), headers()]);
  const locale = detectLocaleFromAcceptLanguage(headerList.get("accept-language"));

  const savedLocations = session?.user?.id
    ? await prisma.location.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, latitude: true, longitude: true },
      })
    : [];

  return { locale, isAuthenticated: Boolean(session?.user), savedLocations };
}
