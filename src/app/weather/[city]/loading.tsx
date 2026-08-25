import WeatherSkeleton from "@/components/WeatherSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
      <div className="h-9 animate-pulse rounded-lg border border-black/15 dark:border-white/20" />
      <WeatherSkeleton />
    </div>
  );
}
