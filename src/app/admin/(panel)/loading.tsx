export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="space-y-6">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
