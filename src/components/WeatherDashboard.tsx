"use client";

import { useEffect, useRef, useState } from "react";
import type { GeocodeResult } from "@/lib/weather-types";
import type { WeatherResponse } from "@/lib/weatherService";
import WeatherResult from "@/components/WeatherResult";
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
  isAuthenticated,
  initialSavedLocations,
}: {
  isAuthenticated: boolean;
  initialSavedLocations: SavedLocation[];
}) {
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

  const visibleSuggestions = query.trim().length >= 2 ? suggestions : [];

  const alreadySaved =
    selected && savedLocations.some((l) => l.latitude === selected.latitude && l.longitude === selected.longitude);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Weather Consensus</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          The most likely current weather and forecast, aggregated across multiple sources.
        </p>
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city..."
          className="w-full rounded border border-black/15 px-4 py-2.5 dark:border-white/20"
        />
        {(visibleSuggestions.length > 0 || searching) && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
            {searching && <li className="px-4 py-2 text-sm text-black/50 dark:text-white/50">Searching…</li>}
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

      {isAuthenticated && (
        <SavedLocationsList
          locations={savedLocations}
          onSelect={(loc) => loadWeather(loc)}
          onDelete={handleDeleteSaved}
        />
      )}

      {loading && <p className="text-sm text-black/60 dark:text-white/60">Loading weather…</p>}
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      {weather && selected && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{selected.label}</h2>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || Boolean(alreadySaved)}
                className="rounded border border-black/15 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/20"
              >
                {alreadySaved ? "Saved" : saving ? "Saving…" : "Save location"}
              </button>
            )}
          </div>
          <WeatherResult result={weather} />
        </div>
      )}
    </div>
  );
}
