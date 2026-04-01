export default function MarketplaceJobsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="animate-pulse">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="mt-1 h-3 w-72 rounded bg-gray-200" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-5 py-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-56 rounded bg-gray-200" />
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="mt-2 h-3 w-40 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-full rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
