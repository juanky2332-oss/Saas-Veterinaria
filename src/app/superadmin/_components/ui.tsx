import { cn } from "@/lib/utils";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = "indigo" }: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "violet";
}) {
  const dot: Record<string, string> = {
    indigo: "bg-indigo-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    violet: "bg-violet-400",
  };
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot[accent])} />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{label}</p>
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/45">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, className, right }: { title?: string; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <div className={cn("rounded-[16px] border border-white/10 bg-white/[0.04] p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

const PALETTE = ["#818cf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#22d3ee"];

/** Barras verticales para tema oscuro (altas/registros por periodo). */
export function DarkBars({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex w-full items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(d.value > 0 ? 6 : 2, Math.round((d.value / max) * (height - 30)));
        return (
          <div key={i} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5" title={`${d.label}: ${d.value}`}>
            <span className="text-[9px] font-bold tabular-nums text-white/55">{d.value > 0 ? d.value : ""}</span>
            <div
              className="w-full rounded-t-[5px] bg-gradient-to-b from-indigo-400 to-violet-600 transition-opacity group-hover:opacity-80"
              style={{ height: d.value > 0 ? h : 2, background: d.value > 0 ? undefined : "rgba(255,255,255,.08)" }}
            />
            <span className="w-full truncate text-center text-[9px] font-semibold uppercase text-white/40">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Lista horizontal "barra de progreso" para distribuciones (planes, verticales…). */
export function DarkDist({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) return <p className="py-4 text-center text-sm text-white/45">Sin datos.</p>;
  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate font-medium capitalize text-white/80">{it.label}</span>
            <span className="shrink-0 font-bold tabular-nums text-white/55">{it.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: PALETTE[idx % PALETTE.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const ESTADO_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  activa: "bg-emerald-500/15 text-emerald-300",
  activo: "bg-emerald-500/15 text-emerald-300",
  trialing: "bg-amber-500/15 text-amber-300",
  trial: "bg-amber-500/15 text-amber-300",
  past_due: "bg-rose-500/15 text-rose-300",
  canceled: "bg-white/10 text-white/50",
  cancelado: "bg-white/10 text-white/50",
  pendiente: "bg-amber-500/15 text-amber-300",
  confirmado: "bg-emerald-500/15 text-emerald-300",
  pagado: "bg-indigo-500/15 text-indigo-300",
  pausado: "bg-white/10 text-white/50",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", ESTADO_BADGE[estado] ?? "bg-white/10 text-white/60")}>
      {estado}
    </span>
  );
}
