"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek, format, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { moverCita } from "@/app/actions/agenda";
import { partsInTz, formatHoraTz, zonedWallClockToUtcISO } from "@/lib/tz";
import { CitaRapidaPanel, type CitaDetalle, type PacienteOpt, type TratamientoOpt, type DoctorOpt } from "./cita-rapida-panel";

interface Cita extends CitaDetalle {
  treatments: { nombre: string; categoria: string; duracion_min: number } | null;
}

interface AgendaViewProps {
  citas: Cita[];
  doctores: DoctorOpt[];
  tratamientos: TratamientoOpt[];
  pacientes: PacienteOpt[];
  semanaInicio: string;
  timeZone: string;
}

// NOTA (zona horaria): las citas se crean e interpretan en la hora LOCAL del
// navegador (que coincide con la de la clínica). Es consistente para un equipo
// en la misma zona. Para clínicas multi-región habría que guardar la zona
// horaria de la organización y convertir con date-fns-tz. Pendiente: feature.
const SALAS = [1, 2, 3];
const HORA_INICIO = 9;
const HORA_FIN = 21;
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => i + HORA_INICIO);
const SPAN = HORA_FIN - HORA_INICIO; // horas visibles

const estadoColor: Record<string, string> = {
  confirmada: "bg-[var(--salvia-tint)] border-[var(--oliva)] text-[var(--oliva-oscuro)]",
  pendiente: "bg-[var(--aviso-tint)] border-[var(--aviso)] text-[var(--aviso)]",
  completada: "bg-[var(--exito-tint)] border-[var(--exito)] text-[var(--exito)]",
  cancelada: "bg-[var(--arena)] border-[var(--lino)] text-[var(--tinta-suave)] line-through",
  no_show: "bg-[var(--error-tint)] border-[var(--error)] text-[var(--error)]",
};
const salaColor: Record<number, string> = { 1: "var(--oliva)", 2: "var(--terracota)", 3: "var(--dorado, #c2a05c)" };

interface PanelState {
  abierto: boolean;
  modo: "crear" | "detalle";
  prefill?: { fecha?: string; hora?: string; sala?: number; patientId?: string };
  cita?: CitaDetalle | null;
}

export function AgendaView({ citas, doctores, tratamientos, pacientes, semanaInicio, timeZone }: AgendaViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [semanaBase, setSemanaBase] = useState(parseISO(semanaInicio));
  const [vista, setVista] = useState<"semana" | "dia">("semana");
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date());
  const [panel, setPanel] = useState<PanelState>({ abierto: false, modo: "crear" });

  // ¿La cita cae en este día, según la zona horaria de la clínica?
  const enDia = useCallback((iso: string, dia: Date) => partsInTz(iso, timeZone).ymd === format(dia, "yyyy-MM-dd"), [timeZone]);
  // Posición vertical (%) de un instante dentro de la rejilla horaria, en tz de la clínica.
  const posPct = useCallback((iso: string) => {
    const { hour, minute } = partsInTz(iso, timeZone);
    return ((hour - HORA_INICIO + minute / 60) / SPAN) * 100;
  }, [timeZone]);

  const diasSemana = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i)), [semanaBase]);
  const citasDelDia = useMemo(() => citas.filter((c) => enDia(c.inicio, diaSeleccionado)), [citas, diaSeleccionado, enDia]);

  const abrirCrear = useCallback((prefill?: PanelState["prefill"]) => setPanel({ abierto: true, modo: "crear", prefill }), []);
  const abrirDetalle = useCallback((cita: Cita) => setPanel({ abierto: true, modo: "detalle", cita }), []);
  const cerrar = useCallback(() => setPanel((p) => ({ ...p, abierto: false })), []);

  // Drag & drop para reprogramar citas
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const reprogramar = useCallback(async (id: string, fecha: string, hora: string, sala?: number) => {
    const cita = citas.find((c) => c.id === id);
    if (!cita) return;
    const dur = Math.max(5, Math.round((parseISO(cita.fin).getTime() - parseISO(cita.inicio).getTime()) / 60000));
    const res = await moverCita({ id, inicio: zonedWallClockToUtcISO(fecha, hora, timeZone), duracion_min: dur, sala });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Cita reprogramada.");
    router.refresh();
  }, [citas, router, timeZone]);

  const soltar = useCallback((fecha: string, hora: string, sala?: number) => {
    const id = dragId;
    setDragId(null);
    setOverKey(null);
    if (id) void reprogramar(id, fecha, hora, sala);
  }, [dragId, reprogramar]);

  // ?nueva=1&paciente= → abrir cita rápida con el paciente preseleccionado
  useEffect(() => {
    if (searchParams.get("nueva") === "1") {
      abrirCrear({ patientId: searchParams.get("paciente") ?? undefined });
      router.replace("/agenda");
    }
  }, [searchParams, abrirCrear, router]);

  function navSemana(dir: -1 | 1) {
    setSemanaBase((prev) => addDays(prev, dir * 7));
  }

  // Línea de hora actual (en la zona horaria de la clínica)
  const ahoraParts = partsInTz(new Date().toISOString(), timeZone);
  const ahoraPct = ((ahoraParts.hour - HORA_INICIO + ahoraParts.minute / 60) / SPAN) * 100;
  const ahoraVisible = ahoraParts.hour >= HORA_INICIO && ahoraParts.hour < HORA_FIN;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-[var(--lino)] bg-[var(--blanco-calido)] px-4 py-3 md:px-6">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => navSemana(-1)}><ChevronLeft size={16} strokeWidth={2} /></Button>
          <span className="min-w-[160px] text-center text-sm font-semibold text-[var(--tinta)]">
            {format(semanaBase, "d MMM", { locale: es })} – {format(addDays(semanaBase, 6), "d MMM yyyy", { locale: es })}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => navSemana(1)}><ChevronRight size={16} strokeWidth={2} /></Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setSemanaBase(startOfWeek(new Date(), { weekStartsOn: 1 })); setDiaSeleccionado(new Date()); }}>Hoy</Button>
        <div className="flex overflow-hidden rounded-[10px] border border-[var(--lino)]">
          <button onClick={() => setVista("semana")} className={cn("px-3 py-1.5 text-xs font-semibold transition-colors", vista === "semana" ? "bg-[var(--oliva)] text-white" : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]")}>Semana</button>
          <button onClick={() => setVista("dia")} className={cn("px-3 py-1.5 text-xs font-semibold transition-colors", vista === "dia" ? "bg-[var(--oliva)] text-white" : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]")}>Día · Salas</button>
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="terracota" className="gap-1.5" onClick={() => abrirCrear()}>
          <Plus size={14} strokeWidth={2} /> Nueva cita
        </Button>
      </div>

      {/* Vista semana */}
      {vista === "semana" && (
        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 grid min-w-[760px] grid-cols-8 border-b border-[var(--lino)] bg-[var(--blanco-calido)]">
            <div className="border-r border-[var(--lino)] py-2" />
            {diasSemana.map((dia) => (
              <button key={dia.toISOString()} onClick={() => { setDiaSeleccionado(dia); setVista("dia"); }}
                className={cn("px-1 py-2 text-center transition-colors hover:bg-[var(--arena)]", isToday(dia) && "bg-[var(--salvia-tint)]")}>
                <p className="text-xs font-semibold uppercase text-[var(--tinta-suave)]">{format(dia, "EEE", { locale: es })}</p>
                <p className={cn("font-display text-lg font-bold", isToday(dia) ? "text-[var(--oliva)]" : "text-[var(--tinta)]")}>{format(dia, "d")}</p>
              </button>
            ))}
          </div>

          <div className="grid min-w-[760px] grid-cols-8">
            <div className="border-r border-[var(--lino)]">
              {HORAS.map((h) => (
                <div key={h} className="h-16 border-b border-[var(--lino)] px-2 py-1">
                  <span className="text-xs tabular-nums text-[var(--tinta-suave)]">{h}:00</span>
                </div>
              ))}
            </div>
            {diasSemana.map((dia) => {
              const citasDia = citas.filter((c) => enDia(c.inicio, dia));
              const esHoy = isToday(dia);
              return (
                <div key={dia.toISOString()} className="relative border-r border-[var(--lino)]">
                  {HORAS.map((h) => {
                    const fechaCelda = format(dia, "yyyy-MM-dd");
                    const horaCelda = `${String(h).padStart(2, "0")}:00`;
                    const key = `${fechaCelda}-${horaCelda}`;
                    return (
                      <button
                        key={h}
                        onClick={() => abrirCrear({ fecha: fechaCelda, hora: horaCelda })}
                        onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverKey(key); } }}
                        onDragLeave={() => setOverKey((k) => (k === key ? null : k))}
                        onDrop={(e) => { e.preventDefault(); soltar(fechaCelda, horaCelda); }}
                        className={cn(
                          "block h-16 w-full border-b border-[var(--lino)] transition-colors hover:bg-[var(--salvia-tint)]/40",
                          overKey === key && "bg-[var(--salvia-tint)] ring-2 ring-inset ring-[var(--oliva)]",
                        )}
                        aria-label={`Nueva cita ${format(dia, "d MMM")} ${h}:00`}
                      />
                    );
                  })}
                  {esHoy && ahoraVisible && (
                    <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ top: `${ahoraPct}%` }}>
                      <div className="h-0.5 bg-[var(--terracota)]" />
                      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[var(--terracota)]" />
                    </div>
                  )}
                  {citasDia.map((cita) => {
                    const topPct = posPct(cita.inicio);
                    const durH = (parseISO(cita.fin).getTime() - parseISO(cita.inicio).getTime()) / 3.6e6;
                    const heightPct = (durH / SPAN) * 100;
                    const colors = estadoColor[cita.estado] ?? estadoColor.pendiente;
                    return (
                      <button
                        key={cita.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); setDragId(cita.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragId(null); setOverKey(null); }}
                        onClick={(e) => { e.stopPropagation(); abrirDetalle(cita); }}
                        className={cn("absolute left-1 right-1 cursor-grab overflow-hidden rounded-[8px] border-l-[3px] px-1.5 py-1 text-left transition-shadow hover:shadow-[var(--shadow-pop)] active:cursor-grabbing", colors, dragId === cita.id && "opacity-40")}
                        style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 5)}%`, borderLeftColor: salaColor[cita.sala] }}
                      >
                        <p className="truncate text-[10px] font-bold">{formatHoraTz(cita.inicio, timeZone)} {cita.patients?.nombre ?? "?"}</p>
                        <p className="truncate text-[10px] opacity-80">{cita.treatments?.nombre}</p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista día con columnas por sala */}
      {vista === "dia" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--lino)] px-4 py-2 md:px-6">
            <h2 className="font-display text-base font-semibold capitalize text-[var(--tinta)]">
              {format(diaSeleccionado, "EEEE, d 'de' MMMM", { locale: es })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setDiaSeleccionado((d) => addDays(d, -1))}><ChevronLeft size={15} /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setDiaSeleccionado((d) => addDays(d, 1))}><ChevronRight size={15} /></Button>
            </div>
          </div>

          {citasDelDia.length === 0 && (
            <div className="border-b border-[var(--lino)] bg-[var(--salvia-tint)]/30 px-4 py-2 text-center text-xs text-[var(--tinta-suave)]">
              <Calendar size={13} className="mr-1 inline" /> Sin citas este día — toca una franja para crear una.
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {/* Cabecera de salas */}
            <div className="sticky top-0 z-10 grid border-b border-[var(--lino)] bg-[var(--blanco-calido)]" style={{ gridTemplateColumns: `56px repeat(${SALAS.length}, 1fr)` }}>
              <div className="border-r border-[var(--lino)]" />
              {SALAS.map((s) => (
                <div key={s} className="border-r border-[var(--lino)] py-2 text-center">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tinta)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: salaColor[s] }} /> Sala {s}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid" style={{ gridTemplateColumns: `56px repeat(${SALAS.length}, 1fr)` }}>
              <div className="border-r border-[var(--lino)]">
                {HORAS.map((h) => (
                  <div key={h} className="h-16 border-b border-[var(--lino)] px-2 py-1"><span className="text-xs tabular-nums text-[var(--tinta-suave)]">{h}:00</span></div>
                ))}
              </div>
              {SALAS.map((s) => {
                const citasSala = citasDelDia.filter((c) => c.sala === s);
                const esHoy = isToday(diaSeleccionado);
                return (
                  <div key={s} className="relative border-r border-[var(--lino)]">
                    {HORAS.map((h) => {
                      const fechaCelda = format(diaSeleccionado, "yyyy-MM-dd");
                      const horaCelda = `${String(h).padStart(2, "0")}:00`;
                      const key = `${fechaCelda}-${horaCelda}-s${s}`;
                      return (
                        <button key={h}
                          onClick={() => abrirCrear({ fecha: fechaCelda, hora: horaCelda, sala: s })}
                          onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverKey(key); } }}
                          onDragLeave={() => setOverKey((k) => (k === key ? null : k))}
                          onDrop={(e) => { e.preventDefault(); soltar(fechaCelda, horaCelda, s); }}
                          className={cn(
                            "block h-16 w-full border-b border-[var(--lino)] transition-colors hover:bg-[var(--salvia-tint)]/40",
                            overKey === key && "bg-[var(--salvia-tint)] ring-2 ring-inset ring-[var(--oliva)]",
                          )} />
                      );
                    })}
                    {esHoy && ahoraVisible && (
                      <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ top: `${ahoraPct}%` }}>
                        <div className="h-0.5 bg-[var(--terracota)]" />
                      </div>
                    )}
                    {citasSala.map((cita) => {
                      const topPct = posPct(cita.inicio);
                      const heightPct = ((parseISO(cita.fin).getTime() - parseISO(cita.inicio).getTime()) / 3.6e6 / SPAN) * 100;
                      const colors = estadoColor[cita.estado] ?? estadoColor.pendiente;
                      return (
                        <button key={cita.id}
                          draggable
                          onDragStart={(e) => { e.stopPropagation(); setDragId(cita.id); e.dataTransfer.effectAllowed = "move"; }}
                          onDragEnd={() => { setDragId(null); setOverKey(null); }}
                          onClick={(e) => { e.stopPropagation(); abrirDetalle(cita); }}
                          className={cn("absolute left-1 right-1 cursor-grab overflow-hidden rounded-[8px] border-l-[3px] px-2 py-1 text-left transition-shadow hover:shadow-[var(--shadow-pop)] active:cursor-grabbing", colors, dragId === cita.id && "opacity-40")}
                          style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 6)}%`, borderLeftColor: salaColor[cita.sala] }}>
                          <p className="truncate text-[11px] font-bold">{formatHoraTz(cita.inicio, timeZone)} · {cita.patients?.nombre ?? "?"} {cita.patients?.apellidos ?? ""}</p>
                          <p className="truncate text-[10px] opacity-80">{cita.treatments?.nombre}{cita.profiles ? ` · ${cita.profiles.nombre}` : ""}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <CitaRapidaPanel
        abierto={panel.abierto}
        modo={panel.modo}
        onClose={cerrar}
        pacientes={pacientes}
        tratamientos={tratamientos}
        doctores={doctores}
        salas={SALAS}
        timeZone={timeZone}
        prefill={panel.prefill}
        cita={panel.cita}
      />
    </div>
  );
}
