"use client";

import { useState } from "react";
import type { WeatherResponse } from "@/lib/weatherService";

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.7
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : confidence >= 0.4
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {pct}% source agreement
    </span>
  );
}

function fmtDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function WeatherResult({ result }: { result: WeatherResponse }) {
  const [showSources, setShowSources] = useState(false);
  const { consensus, sources, cached } = result;
  const { current } = consensus;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-5xl font-semibold">
              {Number.isFinite(current.temperatureC) ? Math.round(current.temperatureC) : "–"}°C
            </p>
            <p className="mt-1 text-black/70 dark:text-white/70">{current.condition ?? "Condition unavailable"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ConfidenceBadge confidence={consensus.confidence} />
            <span className="text-xs text-black/50 dark:text-white/50">
              from {consensus.sourceCount} source{consensus.sourceCount === 1 ? "" : "s"}
              {cached ? " · cached" : ""}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-black/50 dark:text-white/50">Feels like</dt>
            <dd className="mt-0.5">{current.feelsLikeC !== null ? `${Math.round(current.feelsLikeC)}°C` : "–"}</dd>
          </div>
          <div>
            <dt className="text-black/50 dark:text-white/50">Humidity</dt>
            <dd className="mt-0.5">{current.humidityPercent !== null ? `${Math.round(current.humidityPercent)}%` : "–"}</dd>
          </div>
          <div>
            <dt className="text-black/50 dark:text-white/50">Wind</dt>
            <dd className="mt-0.5">{current.windSpeedKph !== null ? `${Math.round(current.windSpeedKph)} km/h` : "–"}</dd>
          </div>
          <div>
            <dt className="text-black/50 dark:text-white/50">Precip. chance</dt>
            <dd className="mt-0.5">
              {current.precipitationProbabilityPercent !== null
                ? `${Math.round(current.precipitationProbabilityPercent)}%`
                : "–"}
            </dd>
          </div>
        </dl>
      </section>

      {consensus.daily.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-black/60 dark:text-white/60">7-day forecast</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {consensus.daily.map((day) => (
              <div key={day.date} className="rounded-lg border border-black/10 p-3 text-center dark:border-white/10">
                <p className="text-xs font-medium text-black/60 dark:text-white/60">{fmtDate(day.date)}</p>
                <p className="mt-2 text-sm">
                  {Math.round(day.tempMaxC)}° / {Math.round(day.tempMinC)}°
                </p>
                {day.precipitationProbabilityPercent !== null && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {Math.round(day.precipitationProbabilityPercent)}% rain
                  </p>
                )}
                <p className="mt-1 truncate text-xs text-black/50 dark:text-white/50" title={day.condition ?? undefined}>
                  {day.condition ?? "–"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <button
          type="button"
          onClick={() => setShowSources((v) => !v)}
          className="text-sm underline underline-offset-2"
        >
          {showSources ? "Hide" : "Show"} per-source breakdown ({sources.length})
        </button>
        {showSources && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-black/50 dark:border-white/10 dark:text-white/50">
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Temp</th>
                  <th className="py-2 pr-4 font-medium">Feels like</th>
                  <th className="py-2 pr-4 font-medium">Condition</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-4 font-medium">{s.source}</td>
                    <td className="py-2 pr-4">{Math.round(s.current.temperatureC)}°C</td>
                    <td className="py-2 pr-4">
                      {s.current.feelsLikeC !== null ? `${Math.round(s.current.feelsLikeC)}°C` : "–"}
                    </td>
                    <td className="py-2 pr-4">{s.current.condition ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
