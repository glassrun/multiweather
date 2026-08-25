"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import type { GeocodeResult } from "@/lib/weather-types";
import type { WeatherResponse } from "@/lib/weatherService";
import { getTranslations, type Locale } from "@/lib/i18n";
import WeatherResult from "@/components/WeatherResult";
import WeatherSkeleton from "@/components/WeatherSkeleton";
import SavedLocationsList, { type SavedLocation } from "@/components/SavedLocationsList";

interface SelectedLocation {
  label: string;
  latitude: number;
  longitude: number;
}

function formatResult(r: GeocodeResult): string {
  return [r.name, r.admin1, r.country].filter(Boolean).join(", ");
}

export default function WeatherDashboard({
  locale,
  isAuthenticated,
  initialSavedLocations,
}: {
  locale: Locale;
  isAuthenticated: boolean;
  initialSavedLocations: SavedLocation[];
}) {
  const t = getTranslations(locale);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState(initialSavedLocations);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(res.ok ? data.results : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function loadWeather(location: SelectedLocation) {
    setSelected(location);
    setSuggestions([]);
    setQuery("");
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const res = await fetch(`/api/weather?lat=${location.latitude}&lon=${location.longitude}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load weather");
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: selected.label,
          latitude: selected.latitude,
          longitude: selected.longitude,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedLocations((prev) => {
          const withoutDup = prev.filter((l) => l.id !== data.location.id);
          return [...withoutDup, data.location];
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSaved(id: string) {
    setSavedLocations((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/locations/${id}`, { method: "DELETE" });
  }

  function clearQuery() {
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  const visibleSuggestions = query.trim().length >= 2 ? suggestions : [];

  const alreadySaved =
    selected && savedLocations.some((l) => l.latitude === selected.latitude && l.longitude === selected.longitude);

  const hasResult = Boolean(weather && selected);

  return (
    <div className={`mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 ${hasResult ? "py-4" : "py-10"}`}>
      {!hasResult && <p className="text-sm text-black/60 dark:text-white/60">{t.tagline}</p>}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-lg border border-black/15 bg-white py-2 pl-9 pr-9 text-sm outline-none transition-colors focus:border-blue-500 dark:border-white/20 dark:bg-neutral-950 dark:focus:border-blue-400"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-black/35 hover:bg-black/5 hover:text-black/60 dark:text-white/35 dark:hover:bg-white/10 dark:hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {(visibleSuggestions.length > 0 || searching) && (
          <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
            {searching && <li className="px-4 py-2 text-sm text-black/50 dark:text-white/50">{t.searching}</li>}
            {visibleSuggestions.map((r, i) => (
              <li key={`${r.latitude}-${r.longitude}-${i}`}>
                <button
                  type="button"
                  onClick={() =>
                    loadWeather({ label: formatResult(r), latitude: r.latitude, longitude: r.longitude })
                  }
                  className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {formatResult(r)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAuthenticated && !hasResult && (
        <SavedLocationsList
          locations={savedLocations}
          onSelect={(loc) => loadWeather(loc)}
          onDelete={handleDeleteSaved}
          removeLabel={t.removeLocation}
        />
      )}

      {loading && <WeatherSkeleton />}
      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {weather && selected && (
        <div className="flex animate-[fadein_.25s_ease-out] flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">{selected.label}</h2>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || Boolean(alreadySaved)}
                className="rounded-lg border border-black/15 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 disabled:opacity-50 disabled:hover:bg-transparent dark:border-white/20 dark:hover:bg-white/10"
              >
                {alreadySaved ? t.saved : saving ? t.saving : t.saveLocation}
              </button>
            )}
          </div>
          <WeatherResult result={weather} t={t} />
          {isAuthenticated && savedLocations.length > 0 && (
            <SavedLocationsList
              locations={savedLocations}
              onSelect={(loc) => loadWeather(loc)}
              onDelete={handleDeleteSaved}
              removeLabel={t.removeLocation}
            />
          )}
        </div>
      )}
    </div>
  );
}
