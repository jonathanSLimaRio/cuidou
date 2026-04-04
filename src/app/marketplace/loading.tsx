export default function MarketplaceLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="mt-2 h-8 w-72 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-96 rounded bg-gray-200" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-3xl border bg-[var(--theme-surface)] p-5">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="mt-3 h-10 w-16 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-56 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[36px] border bg-[var(--theme-surface)] px-6 py-8"
          >
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-4 h-7 w-40 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full rounded bg-gray-200" />
            <div className="mt-1 h-4 w-3/4 rounded bg-gray-200" />
            <div className="mt-6 h-10 w-40 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
