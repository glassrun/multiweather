"use client";

import { MapPin, X } from "lucide-react";

export interface SavedLocation {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export default function SavedLocationsList({
  locations,
  onSelect,
  onDelete,
  removeLabel,
}: {
  locations: SavedLocation[];
  onSelect: (location: SavedLocation) => void;
  onDelete: (id: string) => void;
  removeLabel: (label: string) => string;
}) {
  if (locations.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {locations.map((loc) => (
        <div
          key={loc.id}
          className="flex items-center gap-1 rounded-full border border-black/10 py-1 pl-2.5 pr-1 text-sm transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
        >
          <button type="button" onClick={() => onSelect(loc)} className="flex items-center gap-1 hover:underline">
            <MapPin className="h-3.5 w-3.5 text-black/40 dark:text-white/40" />
            {loc.label}
          </button>
          <button
            type="button"
            onClick={() => onDelete(loc.id)}
            aria-label={removeLabel(loc.label)}
            className="rounded-full p-0.5 text-black/40 hover:bg-black/5 hover:text-black/70 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
