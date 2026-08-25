"use client";

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
          className="flex items-center gap-1 rounded-full border border-black/10 py-1 pl-3 pr-1 text-sm dark:border-white/10"
        >
          <button type="button" onClick={() => onSelect(loc)} className="hover:underline">
            {loc.label}
          </button>
          <button
            type="button"
            onClick={() => onDelete(loc.id)}
            aria-label={removeLabel(loc.label)}
            className="rounded-full px-1.5 text-black/40 hover:bg-black/5 hover:text-black/70 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
