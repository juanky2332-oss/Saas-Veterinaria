"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Plus, Trash2, Scale, Ruler, Percent, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { registrarMetrica, eliminarMetrica } from "@/app/actions/pacientes";
import { formatFecha } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Metrica = Database["public"]["Tables"]["patient_metrics"]["Row"];

interface Props {
  pacienteId: string;
  metricas: Metrica[];
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

function imcCategoria(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: "Bajo peso", color: "var(--info, #3b82f6)" };
  if (imc < 25) return { label: "Normopeso", color: "var(--exito, #16a34a)" };
  if (imc < 30) return { label: "Sobrepeso", color: "var(--aviso, #d97706)" };
  return { label: "Obesidad", color: "var(--error, #dc2626)" };
}

export function TabBiometria({ pacienteId, metricas }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(metricas.length === 0);
  const [guardando, setGuardando] = useState(false);
  const [f, setF] = useState({
    fecha: hoyISO(),
    peso: "",
    altura: "",
    tension_sis: "",
    tension_dia: "",
    grasa_pct: "",
    notas: "",
  });

  // Orden cronológico ascendente para las gráficas.
  const cron = useMemo(
    () => [...metricas].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [metricas],
  );
  const ultima = cron[cron.length - 1];

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
  }
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

  async function guardar() {
    setGuardando(true);
    const res = await registrarMetrica(pacienteId, {
      fecha: f.fecha || hoyISO(),
      peso: num(f.peso),
      altura: num(f.altura),
      tension_sis: num(f.tension_sis),
      tension_dia: num(f.tension_dia),
      grasa_pct: num(f.grasa_pct),
      notas: f.notas,
    });
    setGuardando(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Medición registrada.");
    setF({ fecha: hoyISO(), peso: "", altura: "", tension_sis: "", tension_dia: "", grasa_pct: "", notas: "" });
    setOpen(false);
    router.refresh();
  }

  async function borrar(id: string) {
    const res = await eliminarMetrica(pacienteId, id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Medición eliminada.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* KPIs últimos valores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<Scale size={15} />} label="Peso" value={ultima?.peso != null ? `${ultima.peso} kg` : "—"} />
        <Kpi icon={<Ruler size={15} />} label="Altura" value={ultima?.altura != null ? `${ultima.altura} cm` : "—"} />
        <Kpi
          icon={<Activity size={15} />}
          label="IMC"
          value={ultima?.imc != null ? String(ultima.imc) : "—"}
          sub={ultima?.imc != null ? imcCategoria(ultima.imc).label : undefined}
          subColor={ultima?.imc != null ? imcCategoria(ultima.imc).color : undefined}
        />
        <Kpi
          icon={<HeartPulse size={15} />}
          label="Tensión"
          value={ultima?.tension_sis != null && ultima?.tension_dia != null ? `${ultima.tension_sis}/${ultima.tension_dia}` : "—"}
        />
      </div>

      {/* Gráficas de evolución */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Evolución del peso (kg)</CardTitle></CardHeader>
          <CardContent>
            <LineChart points={cron.filter((m) => m.peso != null).map((m) => ({ x: m.fecha, y: m.peso as number }))} unidad="kg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Evolución del IMC</CardTitle></CardHeader>
          <CardContent>
            <LineChart points={cron.filter((m) => m.imc != null).map((m) => ({ x: m.fecha, y: m.imc as number }))} unidad="" />
          </CardContent>
        </Card>
      </div>

      {/* Registrar medición */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mediciones</CardTitle>
            <Button size="sm" variant={open ? "outline" : "default"} className="gap-1.5" onClick={() => setOpen((o) => !o)}>
              <Plus size={14} /> {open ? "Cerrar" : "Nueva medición"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {open && (
            <div className="rounded-[12px] border border-[var(--lino)] bg-[var(--arena)]/50 p-4">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Campo label="Fecha"><DatePicker value={f.fecha} onChange={(v) => set("fecha", v)} max={new Date().toISOString().slice(0, 10)} /></Campo>
                <Campo label="Peso (kg)"><Input inputMode="decimal" value={f.peso} onChange={(e) => set("peso", e.target.value)} placeholder="0" /></Campo>
                <Campo label="Altura (cm)"><Input inputMode="decimal" value={f.altura} onChange={(e) => set("altura", e.target.value)} placeholder="0" /></Campo>
                <Campo label="T. sistólica"><Input inputMode="numeric" value={f.tension_sis} onChange={(e) => set("tension_sis", e.target.value)} placeholder="120" /></Campo>
                <Campo label="T. diastólica"><Input inputMode="numeric" value={f.tension_dia} onChange={(e) => set("tension_dia", e.target.value)} placeholder="80" /></Campo>
                <Campo label="% grasa"><Input inputMode="decimal" value={f.grasa_pct} onChange={(e) => set("grasa_pct", e.target.value)} placeholder="—" /></Campo>
              </div>
              <div className="mt-3">
                <Campo label="Notas"><Input value={f.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Observaciones de la medición (opcional)" /></Campo>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Registrar"}</Button>
                <span className="text-[11px] text-[var(--tinta-suave)]">El IMC se calcula automáticamente con peso y altura.</span>
              </div>
            </div>
          )}

          {cron.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--tinta-suave)]">
              Aún no hay mediciones. Registra la primera para ver la evolución.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--lino)] text-left text-xs text-[var(--tinta-suave)]">
                    <th className="py-2 pr-3 font-semibold">Fecha</th>
                    <th className="py-2 pr-3 font-semibold">Peso</th>
                    <th className="py-2 pr-3 font-semibold">Altura</th>
                    <th className="py-2 pr-3 font-semibold">IMC</th>
                    <th className="py-2 pr-3 font-semibold">Tensión</th>
                    <th className="py-2 pr-3 font-semibold">% grasa</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {[...cron].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-[var(--lino)]/60">
                      <td className="py-2 pr-3 font-medium text-[var(--tinta)]">{formatFecha(m.fecha)}</td>
                      <td className="py-2 pr-3 tabular-nums">{m.peso != null ? `${m.peso} kg` : "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">{m.altura != null ? `${m.altura} cm` : "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {m.imc != null ? (
                          <span className="font-semibold" style={{ color: imcCategoria(m.imc).color }}>{m.imc}</span>
                        ) : "—"}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{m.tension_sis != null && m.tension_dia != null ? `${m.tension_sis}/${m.tension_dia}` : "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">{m.grasa_pct != null ? `${m.grasa_pct}%` : "—"}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => borrar(m.id)}
                          className="text-[var(--tinta-suave)] transition-colors hover:text-[var(--error)]"
                          aria-label="Eliminar medición"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, sub, subColor }: { icon: React.ReactNode; label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-3 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
        <span className="text-[var(--oliva)]">{icon}</span> {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-[var(--tinta)]">{value}</p>
      {sub && <p className="text-[11px] font-semibold" style={{ color: subColor }}>{sub}</p>}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">{label}</label>
      {children}
    </div>
  );
}

/** Gráfica de líneas SVG mínima (sin dependencias), con puntos y eje base. */
function LineChart({ points, unidad }: { points: { x: string; y: number }[]; unidad: string }) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--tinta-suave)]">Sin datos para esta gráfica.</p>;
  }
  const W = 320;
  const H = 140;
  const PAD = 24;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const px = (i: number) => PAD + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const py = (v: number) => PAD + innerH - ((v - min) / span) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(p.y).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
        {/* línea base */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--lino)" strokeWidth="1" />
        {/* área bajo la curva */}
        {points.length > 1 && (
          <path
            d={`${path} L ${px(points.length - 1)} ${H - PAD} L ${px(0)} ${H - PAD} Z`}
            fill="var(--brand)"
            opacity="0.08"
          />
        )}
        <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={px(i)} cy={py(p.y)} r="3" fill="var(--brand)">
            <title>{`${formatFecha(p.x)}: ${p.y}${unidad ? " " + unidad : ""}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--tinta-suave)]">
        <span>{formatFecha(points[0].x)}</span>
        <span className="font-semibold text-[var(--tinta)]">
          Último: {last.y}{unidad ? ` ${unidad}` : ""}
        </span>
        <span>{formatFecha(last.x)}</span>
      </div>
    </div>
  );
}
