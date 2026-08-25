import { getDashboardContext } from "@/lib/dashboardContext";
import WeatherDashboard from "@/components/WeatherDashboard";

export default async function Home() {
  const { locale, isAuthenticated, savedLocations } = await getDashboardContext();

  return (
    <WeatherDashboard locale={locale} isAuthenticated={isAuthenticated} initialSavedLocations={savedLocations} />
  );
}
