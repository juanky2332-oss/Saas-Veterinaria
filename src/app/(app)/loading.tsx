/**
 * Skeleton de carga compartido para todas las rutas autenticadas.
 * Next.js lo muestra automáticamente durante la navegación / carga de datos.
 */
export default function Loading() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 md:px-6">
        <div className="skeleton h-5 w-40" />
        <div className="ml-auto skeleton h-8 w-8 rounded-full" />
      </div>

      <div className="flex-1 space-y-5 p-4 md:p-6">
        {/* Fila de KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="skeleton mb-3 h-3 w-20" />
              <div className="skeleton h-7 w-24" />
            </div>
          ))}
        </div>

        {/* Bloques principales */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:col-span-2">
            <div className="skeleton mb-4 h-4 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-1/3" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="skeleton mb-4 h-4 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
