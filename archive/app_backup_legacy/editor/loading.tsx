// @ts-nocheck
// TODO: Backup - fix types
export default function EditorLoading() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
            <div className="flex justify-between">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-9 w-9 animate-pulse rounded bg-muted" />
                <div className="h-9 w-9 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  )
}
