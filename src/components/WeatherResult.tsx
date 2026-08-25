"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WeatherResponse } from "@/lib/weatherService";
import type { Translations } from "@/lib/i18n";
import { getWeatherIcon } from "@/lib/weatherIcon";

function ConfidenceBadge({ confidence, t }: { confidence: number; t: Translations }) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.7
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : confidence >= 0.4
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{t.sourceAgreement(pct)}</span>
  );
}

function fmtDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function WeatherResult({ result, t }: { result: WeatherResponse; t: Translations }) {
  const [showSources, setShowSources] = useState(false);
  const { consensus, sources, cached } = result;
  const { current } = consensus;
  const { Icon: CurrentIcon, colorClass: currentIconColor } = getWeatherIcon(current.condition);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-black/10 bg-black/[.015] p-5 dark:border-white/10 dark:bg-white/[.03]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <CurrentIcon className={`h-14 w-14 shrink-0 ${currentIconColor}`} strokeWidth={1.5} />
            <div>
              <p className="text-5xl font-semibold tabular-nums leading-none">
                {Number.isFinite(current.temperatureC) ? Math.round(current.temperatureC) : "–"}°
              </p>
              <p className="mt-1.5 text-black/70 dark:text-white/70">{current.condition ?? t.conditionUnavailable}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ConfidenceBadge confidence={consensus.confidence} t={t} />
            <span className="text-xs text-black/50 dark:text-white/50">
              {t.fromSources(consensus.sourceCount)}
              {cached ? ` · ${t.cached}` : ""}
            </span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-black/10 pt-4 text-sm sm:grid-cols-4 dark:border-white/10">
          <div>
            <dt className="text-black/50 dark:text-white/50">{t.feelsLike}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {current.feelsLikeC !== null ? `${Math.round(current.feelsLikeC)}°C` : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-black/50 dark:text-white/50">{t.humidity}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {current.humidityPercent !== null ? `${Math.round(current.humidityPercent)}%` : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-black/50 dark:text-white/50">{t.wind}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {current.windSpeedKph !== null ? `${Math.round(current.windSpeedKph)} km/h` : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-black/50 dark:text-white/50">{t.precipChance}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {current.precipitationProbabilityPercent !== null
                ? `${Math.round(current.precipitationProbabilityPercent)}%`
                : "–"}
            </dd>
          </div>
        </dl>
      </section>

      {consensus.daily.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">{t.forecast7day}</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
            {consensus.daily.map((day) => {
              const { Icon: DayIcon, colorClass } = getWeatherIcon(day.condition);
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center rounded-xl border border-black/10 p-3 text-center transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                >
                  <p className="text-xs font-medium text-black/60 dark:text-white/60">{fmtDate(day.date)}</p>
                  <DayIcon className={`my-2 h-7 w-7 ${colorClass}`} strokeWidth={1.5} />
                  <p className="text-sm font-medium tabular-nums">
                    {Math.round(day.tempMaxC)}° <span className="text-black/40 dark:text-white/40">{Math.round(day.tempMinC)}°</span>
                  </p>
                  {day.precipitationProbabilityPercent !== null && day.precipitationProbabilityPercent >= 15 && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      {Math.round(day.precipitationProbabilityPercent)}% {t.rain}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <button
          type="button"
          onClick={() => setShowSources((v) => !v)}
          className="flex items-center gap-1 text-sm text-black/60 underline underline-offset-2 hover:text-black/80 dark:text-white/60 dark:hover:text-white/80"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSources ? "rotate-180" : ""}`} />
          {showSources ? t.hideBreakdown(sources.length) : t.showBreakdown(sources.length)}
        </button>
        {showSources && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-black/[.02] text-black/50 dark:border-white/10 dark:bg-white/[.03] dark:text-white/50">
                  <th className="px-4 py-2 font-medium">{t.source}</th>
                  <th className="px-4 py-2 font-medium">{t.temp}</th>
                  <th className="px-4 py-2 font-medium">{t.feelsLike}</th>
                  <th className="px-4 py-2 font-medium">{t.condition}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-b border-black/5 last:border-b-0 dark:border-white/5">
                    <td className="px-4 py-2 font-medium">{s.source}</td>
                    <td className="px-4 py-2 tabular-nums">{Math.round(s.current.temperatureC)}°C</td>
                    <td className="px-4 py-2 tabular-nums">
                      {s.current.feelsLikeC !== null ? `${Math.round(s.current.feelsLikeC)}°C` : "–"}
                    </td>
                    <td className="px-4 py-2">{s.current.condition ?? "–"}</td>
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
