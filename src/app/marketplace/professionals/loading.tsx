export default function MarketplaceProfessionalsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="animate-pulse">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="mt-1 h-3 w-80 rounded bg-gray-200" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-5 py-6"
          >
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-full rounded-xl bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
