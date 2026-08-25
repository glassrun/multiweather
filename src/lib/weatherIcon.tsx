import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  type LucideIcon,
} from "lucide-react";

export interface WeatherIconInfo {
  Icon: LucideIcon;
  colorClass: string;
}

// Ordered most-specific-first: condition text from different providers overlaps
// (e.g. "Partly Cloudy" contains "cloudy"), so qualifiers must be checked before
// their broader parent pattern or they'd never match.
const RULES: Array<{ pattern: RegExp; icon: LucideIcon; colorClass: string }> = [
  { pattern: /thunder|hail/i, icon: CloudLightning, colorClass: "text-purple-500 dark:text-purple-400" },
  { pattern: /snow/i, icon: CloudSnow, colorClass: "text-sky-400 dark:text-sky-300" },
  { pattern: /drizzle/i, icon: CloudDrizzle, colorClass: "text-blue-400 dark:text-blue-300" },
  { pattern: /rain|shower/i, icon: CloudRain, colorClass: "text-blue-500 dark:text-blue-400" },
  { pattern: /fog|mist|haze/i, icon: CloudFog, colorClass: "text-slate-400" },
  { pattern: /partly|mainly clear|patchy/i, icon: CloudSun, colorClass: "text-amber-400 dark:text-amber-300" },
  { pattern: /overcast|cloudy/i, icon: Cloud, colorClass: "text-slate-400" },
  { pattern: /clear|sunny|fair/i, icon: Sun, colorClass: "text-amber-500 dark:text-amber-400" },
];

export function getWeatherIcon(condition: string | null | undefined): WeatherIconInfo {
  if (condition) {
    for (const rule of RULES) {
      if (rule.pattern.test(condition)) return { Icon: rule.icon, colorClass: rule.colorClass };
    }
  }
  return { Icon: Cloud, colorClass: "text-black/25 dark:text-white/25" };
}
