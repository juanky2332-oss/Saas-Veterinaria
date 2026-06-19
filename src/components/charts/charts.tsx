/**
 * Gráficas SVG propias (sin dependencias). Server-renderizables.
 * Usan los tokens de marca de la clínica (var(--brand), etc.).
 */

export interface SerieMes {
  label: string;
  value: number;
}

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/** Barras verticales (p. ej. facturación por mes). */
export function BarsChart({ data, formato = "eur", height = 180 }: {
  data: SerieMes[];
  formato?: "eur" | "num";
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = (v: number) => (formato === "eur" ? eur(v) : String(v));
  const compacto = (v: number) => {
    if (formato === "num") return String(v);
    if (v >= 1000) return (v / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k€";
    return Math.round(v) + "€";
  };
  return (
    <div className="flex w-full items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(d.value > 0 ? 6 : 2, Math.round((d.value / max) * (height - 36)));
        return (
          <div
            key={i}
            className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            title={d.label + ": " + fmt(d.value)}
          >
            <span className="hidden text-[9px] font-bold tabular-nums text-[var(--text-soft)] sm:block">
              {d.value > 0 ? compacto(d.value) : ""}
            </span>
            <div
              className="w-full rounded-t-[5px] transition-all group-hover:opacity-80"
              style={{
                height: h,
                background: d.value > 0 ? "linear-gradient(180deg, var(--brand), var(--brand-strong))" : "var(--border)",
              }}
            />
            <span className="truncate text-[9.5px] font-semibold uppercase text-[var(--text-soft)]">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Donut con leyenda (p. ej. citas por estado). */
export function DonutChart({ segments, centro }: {
  segments: { label: string; value: number; color: string }[];
  centro?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 110 110" className="h-32 w-32 shrink-0">
        <circle cx="55" cy="55" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
        {total > 0 &&
          segments.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * C;
            const el = (
              <circle
                key={i}
                cx="55"
                cy="55"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={dash + " " + (C - dash)}
                strokeDashoffset={-offset}
                transform="rotate(-90 55 55)"
              >
                <title>{s.label + ": " + s.value}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        <text x="55" y="52" textAnchor="middle" className="fill-[var(--text)] font-display" style={{ fontSize: 19, fontWeight: 800 }}>
          {total}
        </text>
        <text x="55" y="68" textAnchor="middle" className="fill-[var(--text-soft)]" style={{ fontSize: 8.5 }}>
          {centro ?? "total"}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">{s.label}</span>
            <span className="font-bold tabular-nums text-[var(--text)]">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontales top-N (p. ej. tratamientos más realizados). */
export function HBarsChart({ items, formato = "num" }: {
  items: { label: string; value: number }[];
  formato?: "eur" | "num";
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const fmt = (v: number) => (formato === "eur" ? eur(v) : String(v));
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--text-soft)]">Sin datos todavía.</p>;
  }
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-[var(--text)]">{it.label}</span>
            <span className="shrink-0 font-bold tabular-nums text-[var(--text-soft)]">{fmt(it.value)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full"
              style={{ width: (it.value / max) * 100 + "%", background: "linear-gradient(90deg, var(--brand), var(--brand-soft))" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
