// @ts-nocheck
// TODO: Backup - fix types
export default function DashboardLoading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-6 grid gap-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
