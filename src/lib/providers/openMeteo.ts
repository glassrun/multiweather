import { fetchWithTimeout } from "./fetchWithTimeout";
import { describeWmoCode } from "./wmoCodes";
import type { WeatherReading } from "@/lib/weather-types";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherReading | null> {
  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) return null;
    const data = await res.json();

    const daily = (data.daily?.time ?? []).map((date: string, i: number) => ({
      date,
      tempMinC: data.daily.temperature_2m_min[i],
      tempMaxC: data.daily.temperature_2m_max[i],
      precipitationProbabilityPercent: data.daily.precipitation_probability_max?.[i] ?? null,
      condition: describeWmoCode(data.daily.weather_code?.[i]),
    }));

    return {
      source: "open-meteo",
      fetchedAt: new Date().toISOString(),
      current: {
        temperatureC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature ?? null,
        humidityPercent: data.current.relative_humidity_2m ?? null,
        windSpeedKph: data.current.wind_speed_10m ?? null,
        precipitationProbabilityPercent: daily[0]?.precipitationProbabilityPercent ?? null,
        condition: describeWmoCode(data.current.weather_code),
      },
      daily,
    };
  } catch {
    return null;
  }
}
