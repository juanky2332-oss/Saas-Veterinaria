import Link from "next/link";
import { TrendingUp, TrendingDown, Users, CalendarDays, Receipt, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BarsChart, DonutChart, HBarsChart, type SerieMes } from "@/components/charts/charts";

export const metadata = { title: "Analítica — Clinicomatic" };

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function claveMes(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function ultimos12Meses(): { clave: string; label: string }[] {
  const out: { clave: string; label: string }[] = [];
  const ahora = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    out.push({ clave: claveMes(d), label: MESES[d.getMonth()] });
  }
  return out;
}

export default async function AnaliticaPage() {
  const supabase = await createClient();
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 11);
  desde.setDate(1);
  const desdeIso = desde.toISOString().slice(0, 10);

  const [invRes, citasRes, pacRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("numero, fecha, vencimiento, total, estado, cliente_nombre")
      .gte("fecha", desdeIso)
      .order("fecha", { ascending: false })
      .limit(1000),
    supabase
      .from("appointments")
      .select("inicio, estado, treatments(nombre)")
      .gte("inicio", desde.toISOString())
      .limit(2000),
    supabase.from("patients").select("created_at").gte("created_at", desde.toISOString()).limit(2000),
  ]);

  const facturas = invRes.data ?? [];
  const citas = citasRes.data ?? [];
  const pacientes = pacRes.data ?? [];

  const meses = ultimos12Meses();
  const idxMes = new Map(meses.map((m, i) => [m.clave, i]));

  // ── Facturación por mes (emitidas/pagadas/vencidas; excluye borradores y anuladas) ──
  const factPorMes: SerieMes[] = meses.map((m) => ({ label: m.label, value: 0 }));
  let pendiente = 0;
  let vencido = 0;
  const hoy = new Date();
  for (const f of facturas) {
    if (f.estado === "borrador" || f.estado === "anulada") continue;
    const i = idxMes.get(claveMes(new Date(f.fecha + "T00:00:00")));
    if (i !== undefined) factPorMes[i].value += Number(f.total);
    if (f.estado === "emitida") {
      const estaVencida = f.vencimiento && new Date(f.vencimiento + "T23:59:59") < hoy;
      if (estaVencida) vencido += Number(f.total);
      else pendiente += Number(f.total);
    }
  }
  const factEsteMes = factPorMes[11]?.value ?? 0;
  const factMesAnterior = factPorMes[10]?.value ?? 0;
  const delta = factMesAnterior > 0 ? Math.round(((factEsteMes - factMesAnterior) / factMesAnterior) * 100) : null;
  const totalAno = factPorMes.reduce((s, m) => s + m.value, 0);
  const ticketMedio = facturas.filter((f) => f.estado !== "borrador" && f.estado !== "anulada").length
    ? totalAno / facturas.filter((f) => f.estado !== "borrador" && f.estado !== "anulada").length
    : 0;

  // ── Citas por estado + por mes ──
  const estados: Record<string, number> = {};
  const citasPorMes: SerieMes[] = meses.map((m) => ({ label: m.label, value: 0 }));
  const porTratamiento: Record<string, number> = {};
  for (const c of citas) {
    estados[c.estado] = (estados[c.estado] ?? 0) + 1;
    const i = idxMes.get(claveMes(new Date(c.inicio)));
    if (i !== undefined) citasPorMes[i].value += 1;
    const nombre = (c.treatments as { nombre: string } | null)?.nombre;
    if (nombre) porTratamiento[nombre] = (porTratamiento[nombre] ?? 0) + 1;
  }
  const totalCitas = citas.length;
  const noShows = estados["no_show"] ?? 0;
  const noShowPct = totalCitas > 0 ? Math.round((noShows / totalCitas) * 100) : 0;
  const topTratamientos = Object.entries(porTratamiento)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  // ── Pacientes nuevos por mes ──
  const pacPorMes: SerieMes[] = meses.map((m) => ({ label: m.label, value: 0 }));
  for (const p of pacientes) {
    const i = idxMes.get(claveMes(new Date(p.created_at)));
    if (i !== undefined) pacPorMes[i].value += 1;
  }
  const pacEsteMes = pacPorMes[11]?.value ?? 0;

  const kpis = [
    {
      icon: Receipt,
      label: "Facturado este mes",
      value: eur(factEsteMes),
      sub: delta === null ? "Sin datos del mes anterior" : `${delta >= 0 ? "+" : ""}${delta}% vs mes anterior`,
      deltaPos: delta === null ? null : delta >= 0,
    },
    { icon: TrendingUp, label: "Facturado (12 meses)", value: eur(totalAno), sub: `Ticket medio ${eur(ticketMedio)}` },
    { icon: AlertTriangle, label: "Pendiente de cobro", value: eur(pendiente + vencido), sub: vencido > 0 ? `${eur(vencido)} ya vencido` : "Nada vencido 🎉" },
    { icon: CalendarDays, label: "Citas (12 meses)", value: String(totalCitas), sub: `${noShowPct}% de ausencias` },
    { icon: Users, label: "Pacientes nuevos este mes", value: String(pacEsteMes), sub: `${pacientes.length} en 12 meses` },
  ];

  const donutSegments = [
    { label: "Completadas", value: estados["completada"] ?? 0, color: "#15a37a" },
    { label: "Confirmadas", value: estados["confirmada"] ?? 0, color: "#0e9f8e" },
    { label: "Pendientes", value: estados["pendiente"] ?? 0, color: "#d98a0b" },
    { label: "Canceladas", value: estados["cancelada"] ?? 0, color: "#94a3b8" },
    { label: "No show", value: estados["no_show"] ?? 0, color: "#dc5146" },
  ].filter((s) => s.value > 0);

  const ultimasFacturas = facturas.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Analítica</h1>
        <p className="mt-0.5 text-sm text-[var(--text-soft)]">Facturación y métricas de tu clínica en los últimos 12 meses.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[var(--brand-tint)] text-[var(--brand-strong)]">
                  <Icon size={15} strokeWidth={1.75} />
                </span>
                <p className="text-[10.5px] font-bold uppercase leading-tight tracking-wide text-[var(--text-soft)]">{k.label}</p>
              </div>
              <p className="mt-2.5 font-display text-xl font-bold tabular-nums text-[var(--text)]">{k.value}</p>
              <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${k.deltaPos === true ? "font-semibold text-[var(--exito)]" : k.deltaPos === false ? "font-semibold text-[var(--error)]" : "text-[var(--text-soft)]"}`}>
                {k.deltaPos === true && <TrendingUp size={11} />}
                {k.deltaPos === false && <TrendingDown size={11} />}
                {k.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gráficas principales */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:col-span-3">
          <h2 className="mb-4 font-display font-semibold text-[var(--text)]">Facturación por mes</h2>
          <BarsChart data={factPorMes} formato="eur" height={190} />
        </div>
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold text-[var(--text)]">Citas por estado</h2>
          {donutSegments.length > 0 ? (
            <DonutChart segments={donutSegments} centro="citas" />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--text-soft)]">Aún no hay citas registradas.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold text-[var(--text)]">Tratamientos más realizados</h2>
          <HBarsChart items={topTratamientos} />
        </div>
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:col-span-3">
          <h2 className="mb-4 font-display font-semibold text-[var(--text)]">Pacientes nuevos por mes</h2>
          <BarsChart data={pacPorMes} formato="num" height={170} />
        </div>
      </div>

      {/* Últimas facturas */}
      <div className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display font-semibold text-[var(--text)]">Últimas facturas</h2>
          <Link href="/facturacion" className="text-xs font-semibold text-[var(--brand)] hover:underline">Ver todas →</Link>
        </div>
        {ultimasFacturas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--text-soft)]">Todavía no hay facturas. Crea la primera desde Facturación.</p>
        ) : (
          <table className="mt-3 w-full min-w-[560px] text-sm">
            <tbody className="divide-y divide-[var(--border)]">
              {ultimasFacturas.map((f) => (
                <tr key={f.numero} className="hover:bg-[var(--surface-2)]">
                  <td className="px-5 py-2.5 font-semibold text-[var(--text)]">{f.numero}</td>
                  <td className="px-5 py-2.5 text-[var(--text-soft)]">{new Date(f.fecha + "T00:00:00").toLocaleDateString("es-ES")}</td>
                  <td className="max-w-[200px] truncate px-5 py-2.5 text-[var(--text)]">{f.cliente_nombre}</td>
                  <td className="px-5 py-2.5 capitalize text-[var(--text-soft)]">{f.estado}</td>
                  <td className="px-5 py-2.5 text-right font-bold tabular-nums text-[var(--text)]">{eur(Number(f.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
