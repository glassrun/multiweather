export default function WeatherSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="rounded-2xl border border-black/10 bg-black/[.015] p-5 dark:border-white/10 dark:bg-white/[.03]">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="flex flex-col gap-2">
            <div className="h-10 w-24 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/10 pt-4 sm:grid-cols-4 dark:border-white/10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3 w-14 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-4 w-10 rounded bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-black/10 dark:border-white/10" />
        ))}
      </div>
    </div>
  );
}
