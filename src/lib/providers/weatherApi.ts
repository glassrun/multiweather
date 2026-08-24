import { fetchWithTimeout } from "./fetchWithTimeout";
import { env } from "@/lib/env";
import type { WeatherReading } from "@/lib/weather-types";

// Weather Underground's public API is no longer available for new signups
// (it's enterprise-only via IBM/The Weather Company now). WeatherAPI.com
// fills the same role here with an accessible free-tier key.
export async function fetchWeatherApi(lat: number, lon: number): Promise<WeatherReading | null> {
  if (!env.WEATHERAPI_API_KEY) return null;

  try {
    const res = await fetchWithTimeout(
      `https://api.weatherapi.com/v1/forecast.json?key=${env.WEATHERAPI_API_KEY}&q=${lat},${lon}&days=7&aqi=no&alerts=no`,
    );
    if (!res.ok) return null;
    const data = await res.json();

    const daily = (data.forecast?.forecastday ?? []).map(
      (d: {
        date: string;
        day: { mintemp_c: number; maxtemp_c: number; daily_chance_of_rain: number; condition?: { text: string } };
      }) => ({
        date: d.date,
        tempMinC: d.day.mintemp_c,
        tempMaxC: d.day.maxtemp_c,
        precipitationProbabilityPercent: d.day.daily_chance_of_rain ?? null,
        condition: d.day.condition?.text ?? null,
      }),
    );

    return {
      source: "weatherapi",
      fetchedAt: new Date().toISOString(),
      current: {
        temperatureC: data.current.temp_c,
        feelsLikeC: data.current.feelslike_c ?? null,
        humidityPercent: data.current.humidity ?? null,
        windSpeedKph: data.current.wind_kph ?? null,
        precipitationProbabilityPercent: daily[0]?.precipitationProbabilityPercent ?? null,
        condition: data.current.condition?.text ?? null,
      },
      daily,
    };
  } catch {
    return null;
  }
}
