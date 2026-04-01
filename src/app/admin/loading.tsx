export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-6 py-7">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="mt-2 h-8 w-64 rounded bg-gray-200" />
        <div className="mt-1 h-3 w-96 rounded bg-gray-200" />
      </div>
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
      <div className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-6 py-7">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
