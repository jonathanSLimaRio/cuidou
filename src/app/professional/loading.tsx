export default function ProfessionalLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-5 py-6">
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="mt-3 h-8 w-64 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-96 rounded bg-gray-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[28px] bg-[var(--theme-surface)] px-5 py-6"
          >
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-48 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
