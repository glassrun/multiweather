import { fetchOpenMeteo } from "./openMeteo";
import { fetchNws } from "./nws";
import { fetchOpenWeatherMap } from "./openWeatherMap";
import { fetchAccuWeather } from "./accuWeather";
import { fetchWeatherApi } from "./weatherApi";
import type { WeatherReading } from "@/lib/weather-types";

export async function fetchAllSources(lat: number, lon: number): Promise<WeatherReading[]> {
  const results = await Promise.all([
    fetchOpenMeteo(lat, lon),
    fetchNws(lat, lon),
    fetchOpenWeatherMap(lat, lon),
    fetchAccuWeather(lat, lon),
    fetchWeatherApi(lat, lon),
  ]);
  return results.filter((r): r is WeatherReading => r !== null);
}
