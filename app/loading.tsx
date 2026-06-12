export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="h-3 w-44 animate-pulse rounded bg-zinc-100" />
          <div className="mt-3 h-8 w-60 animate-pulse rounded bg-zinc-100" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-7 w-44 animate-pulse rounded-lg bg-zinc-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-white lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-white" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
      </div>
      <div className="mt-4 h-96 animate-pulse rounded-2xl bg-white" />
    </main>
  );
}
