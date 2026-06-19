"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Search, Clock, MapPin, User, Stethoscope, Phone, FileText, Check, Ban, CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { crearCita, actualizarEstadoCita } from "@/app/actions/agenda";
import { formatHoraTz, zonedWallClockToUtcISO } from "@/lib/tz";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita"];

export interface PacienteOpt { id: string; nombre: string; apellidos: string; telefono: string }
export interface TratamientoOpt { id: string; nombre: string; duracion_min: number; categoria: string }
export interface DoctorOpt { id: string; nombre: string }

export interface CitaDetalle {
  id: string;
  inicio: string;
  fin: string;
  sala: number;
  estado: string;
  patient_id: string | null;
  notas: string | null;
  patients: { nombre: string; apellidos: string; telefono: string } | null;
  treatments: { nombre: string } | null;
  profiles: { nombre: string } | null;
}

interface Props {
  abierto: boolean;
  modo: "crear" | "detalle";
  onClose: () => void;
  pacientes: PacienteOpt[];
  tratamientos: TratamientoOpt[];
  doctores: DoctorOpt[];
  salas: number[];
  timeZone: string;
  prefill?: { fecha?: string; hora?: string; sala?: number; patientId?: string };
  cita?: CitaDetalle | null;
}

const ESTADOS: { id: EstadoCita; label: string }[] = [
  { id: "pendiente", label: "Pendiente" },
  { id: "confirmada", label: "Confirmada" },
  { id: "completada", label: "Completada" },
  { id: "cancelada", label: "Cancelada" },
  { id: "no_show", label: "No show" },
];

export function CitaRapidaPanel({ abierto, modo, onClose, pacientes, tratamientos, doctores, salas, timeZone, prefill, cita }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Estado del formulario (modo crear)
  const [busqueda, setBusqueda] = useState("");
  const [pacienteId, setPacienteId] = useState("");
  const [tratamientoId, setTratamientoId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [sala, setSala] = useState(1);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("10:00");
  const [duracion, setDuracion] = useState(30);
  const [estado, setEstado] = useState<EstadoCita>("confirmada");
  const [notas, setNotas] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Reset / prefill al abrir
  useEffect(() => {
    if (!abierto || modo !== "crear") return;
    setBusqueda("");
    setPacienteId(prefill?.patientId ?? "");
    setTratamientoId("");
    setDoctorId(doctores[0]?.id ?? "");
    setSala(prefill?.sala ?? salas[0] ?? 1);
    setFecha(prefill?.fecha ?? new Date().toISOString().slice(0, 10));
    setHora(prefill?.hora ?? "10:00");
    setDuracion(30);
    setEstado("confirmada");
    setNotas("");
    if (prefill?.patientId) {
      const p = pacientes.find((x) => x.id === prefill.patientId);
      if (p) setBusqueda(`${p.nombre} ${p.apellidos}`);
    }
  }, [abierto, modo, prefill, doctores, salas, pacientes]);

  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 8);
    return pacientes.filter((p) => `${p.nombre} ${p.apellidos} ${p.telefono}`.toLowerCase().includes(q)).slice(0, 8);
  }, [busqueda, pacientes]);

  function elegirTratamiento(id: string) {
    setTratamientoId(id);
    const t = tratamientos.find((x) => x.id === id);
    if (t?.duracion_min) setDuracion(t.duracion_min);
  }

  function guardar() {
    if (!pacienteId) { toast.error("Selecciona un paciente."); return; }
    const inicioISO = zonedWallClockToUtcISO(fecha, hora, timeZone);
    startTransition(async () => {
      const res = await crearCita({
        patient_id: pacienteId,
        treatment_id: tratamientoId || null,
        doctora_id: doctorId || null,
        sala,
        inicio: inicioISO,
        duracion_min: duracion,
        estado,
        notas: notas || undefined,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Cita creada.");
      onClose();
      router.refresh();
    });
  }

  function cambiarEstado(e: EstadoCita) {
    if (!cita) return;
    startTransition(async () => {
      const res = await actualizarEstadoCita(cita.id, e);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Cita actualizada.");
      onClose();
      router.refresh();
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200",
          abierto ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[400px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out",
          abierto ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-bold text-[var(--text)]">
            {modo === "crear" ? "Cita rápida" : "Detalle de la cita"}
          </h2>
          <button onClick={onClose} className="text-[var(--text-soft)] hover:text-[var(--text)]" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {modo === "crear" ? (
            <div className="space-y-4">
              {/* Buscador de paciente */}
              <div ref={dropRef} className="relative">
                <Label icon={<User size={13} />}>Paciente</Label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                  <input
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPacienteId(""); setDropOpen(true); }}
                    onFocus={() => setDropOpen(true)}
                    placeholder="Buscar por nombre o teléfono…"
                    className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white pl-9 pr-3 text-sm focus-visible:border-[var(--brand)] focus-visible:outline-none"
                  />
                </div>
                {dropOpen && pacientesFiltrados.length > 0 && !pacienteId && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)]">
                    {pacientesFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setPacienteId(p.id); setBusqueda(`${p.nombre} ${p.apellidos}`); setDropOpen(false); }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
                      >
                        <span className="font-medium text-[var(--text)]">{p.nombre} {p.apellidos}</span>
                        <span className="text-[11px] text-[var(--text-soft)]">{p.telefono}</span>
                      </button>
                    ))}
                  </div>
                )}
                {pacienteId && <p className="mt-1 text-[11px] text-[var(--exito)]">✓ Paciente seleccionado</p>}
              </div>

              <div>
                <Label icon={<Stethoscope size={13} />}>Tratamiento</Label>
                <select value={tratamientoId} onChange={(e) => elegirTratamiento(e.target.value)} className={selCls}>
                  <option value="">Sin tratamiento</option>
                  {tratamientos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.duracion_min}′)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha</Label>
                  <DatePicker value={fecha} onChange={setFecha} />
                </div>
                <div>
                  <Label icon={<Clock size={13} />}>Hora</Label>
                  <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} step={300} className={selCls} />
                </div>
                <div>
                  <Label>Duración (min)</Label>
                  <input type="number" min={5} max={600} step={5} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className={selCls} />
                </div>
                <div>
                  <Label icon={<MapPin size={13} />}>Sala</Label>
                  <select value={sala} onChange={(e) => setSala(Number(e.target.value))} className={selCls}>
                    {salas.map((s) => <option key={s} value={s}>Sala {s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Profesional</Label>
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={selCls}>
                  <option value="">Yo</option>
                  {doctores.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>

              <div>
                <Label>Estado</Label>
                <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoCita)} className={selCls}>
                  {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </div>

              <div>
                <Label>Notas</Label>
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Observaciones de la cita…" className="w-full rounded-[12px] border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:border-[var(--brand)] focus-visible:outline-none" />
              </div>
            </div>
          ) : cita ? (
            <div className="space-y-4">
              <div className="rounded-[12px] bg-[var(--surface-2)] p-4">
                <p className="font-display text-lg font-bold text-[var(--text)]">
                  {cita.patients ? `${cita.patients.nombre} ${cita.patients.apellidos}` : "Paciente"}
                </p>
                {cita.patients?.telefono && (
                  <a href={`tel:${cita.patients.telefono}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--brand)]">
                    <Phone size={13} /> {cita.patients.telefono}
                  </a>
                )}
              </div>
              <DetRow icon={<Clock size={14} />} label="Horario" value={`${formatHoraTz(cita.inicio, timeZone)} – ${formatHoraTz(cita.fin, timeZone)}`} />
              <DetRow icon={<Stethoscope size={14} />} label="Tratamiento" value={cita.treatments?.nombre ?? "—"} />
              <DetRow icon={<MapPin size={14} />} label="Sala" value={`Sala ${cita.sala}`} />
              <DetRow icon={<User size={14} />} label="Profesional" value={cita.profiles?.nombre ?? "—"} />
              {cita.notas && <DetRow icon={<FileText size={14} />} label="Notas" value={cita.notas} />}

              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--text-soft)]">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={pending} onClick={() => cambiarEstado("confirmada")}><CalendarCheck size={13} /> Confirmar</Button>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={pending} onClick={() => cambiarEstado("completada")}><Check size={13} /> Completar</Button>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-[var(--error)] hover:bg-[var(--error-tint)]" disabled={pending} onClick={() => cambiarEstado("cancelada")}><Ban size={13} /> Cancelar</Button>
                </div>
              </div>

              {cita.patient_id && (
                <Link href={`/pacientes/${cita.patient_id}`} className="block">
                  <Button variant="outline" className="w-full">Abrir ficha del paciente</Button>
                </Link>
              )}
            </div>
          ) : null}
        </div>

        {modo === "crear" && (
          <div className="border-t border-[var(--border)] px-5 py-4">
            <Button className="w-full gap-2" disabled={pending} onClick={guardar}>
              {pending && <Loader2 size={15} className="animate-spin" />}
              {pending ? "Guardando…" : "Crear cita"}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

const selCls = "h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none";

function Label({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-soft)]">
      {icon}{children}
    </label>
  );
}

function DetRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[var(--text-soft)]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">{label}</p>
        <p className="text-sm text-[var(--text)]">{value}</p>
      </div>
    </div>
  );
}
