import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboardContext";
import { labelFromSlug, parseCityParam, type ParsedCityParam } from "@/lib/citySlug";
import WeatherDashboard from "@/components/WeatherDashboard";

function resolveLabel(parsed: ParsedCityParam, searchParams: Record<string, string | string[] | undefined>): string {
  const raw = searchParams.label;
  const queryLabel = typeof raw === "string" ? raw : undefined;
  return queryLabel && queryLabel.trim() ? queryLabel : labelFromSlug(parsed.slug);
}

// Metadata only needs the label, which resolves synchronously - it
// deliberately doesn't fetch live weather data (see the page component
// below for why the actual reading is fetched client-side instead).
export async function generateMetadata(props: PageProps<"/weather/[city]">): Promise<Metadata> {
  const [{ city }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const parsed = parseCityParam(city);
  if (!parsed) return {};

  const label = resolveLabel(parsed, searchParams);

  return {
    title: `${label} weather forecast`,
    description: `Current conditions and 7-day forecast for ${label}, aggregated from multiple weather sources.`,
    alternates: { canonical: `/weather/${city}` },
  };
}

// Deliberately does NOT fetch weather server-side. An earlier version did
// (for richer SEO content) but that made this route noticeably slower to
// render than every other page, and stalled hydration entirely under load
// (verified in Docker, not just occasionally locally): the client-side JS
// would load but never attach - no search, no save button, nothing
// interactive - because the boundary carrying that slow content never
// finished streaming in the response. This route now stays exactly as
// fast as `/`, and WeatherDashboard fetches the reading client-side on
// mount instead, the same reliable path a fresh search already uses.
export default async function CityWeatherPage(props: PageProps<"/weather/[city]">) {
  const [{ city }, searchParams, context] = await Promise.all([
    props.params,
    props.searchParams,
    getDashboardContext(),
  ]);

  const parsed = parseCityParam(city);
  if (!parsed) notFound();

  const label = resolveLabel(parsed, searchParams);

  return (
    <WeatherDashboard
      locale={context.locale}
      isAuthenticated={context.isAuthenticated}
      initialSavedLocations={context.savedLocations}
      initialSelected={{ label, latitude: parsed.latitude, longitude: parsed.longitude }}
    />
  );
}
