export default function FamilyLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Metrics skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-5 py-6"
          >
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      {/* Job cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-5 py-6"
          >
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
