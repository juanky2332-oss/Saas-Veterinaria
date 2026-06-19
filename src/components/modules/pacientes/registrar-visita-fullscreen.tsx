"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Loader2, X, Check, Stethoscope, Keyboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { registrarVisita } from "@/app/actions/tratamientos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Tratamiento = Database["public"]["Tables"]["treatments"]["Row"];

interface CitaRef {
  id: string;
  inicio: string;
  treatments?: { nombre: string } | null;
}

const INFORME_VACIO = { motivo: "", tratamiento: "", producto_lote: "", observaciones: "", pauta_seguimiento: "" };

const CAMPOS: { key: keyof typeof INFORME_VACIO; label: string; placeholder: string; rows: number }[] = [
  { key: "motivo", label: "Motivo de la consulta", placeholder: "Por qué acude el paciente…", rows: 2 },
  { key: "tratamiento", label: "Tratamiento aplicado", placeholder: "Descripción del procedimiento…", rows: 3 },
  { key: "producto_lote", label: "Producto y lote", placeholder: "Producto utilizado y nº de lote", rows: 1 },
  { key: "observaciones", label: "Observaciones", placeholder: "Reacciones, incidencias, notas…", rows: 3 },
  { key: "pauta_seguimiento", label: "Pauta / Seguimiento", placeholder: "Recomendaciones y próxima revisión…", rows: 2 },
];

export function RegistrarVisitaFullscreen({ open, onClose, pacienteId, pacienteNombre, cita }: {
  open: boolean;
  onClose: () => void;
  pacienteId: string;
  pacienteNombre: string;
  cita?: CitaRef | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [informe, setInforme] = useState(INFORME_VACIO);
  const [tratamientosDisp, setTratamientosDisp] = useState<Tratamiento[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [origen, setOrigen] = useState<"voz" | "escrito">("escrito");
  const [transcripcion, setTranscripcion] = useState<string | null>(null);

  // Grabación
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    setInforme((f) => (cita?.treatments?.nombre ? { ...f, tratamiento: cita.treatments.nombre } : f));
    if (cita?.inicio) setFecha(cita.inicio.slice(0, 10));
    supabase
      .from("treatments")
      .select("*")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => { if (data) setTratamientosDisp(data); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      setInforme(INFORME_VACIO);
      setSeleccionados([]);
      setTranscripcion(null);
      setOrigen("escrito");
      pararTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pararTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setSegundos(0);
  }

  async function empezarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        pararTimer();
        await procesarAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setGrabando(true);
      setSegundos(0);
      timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } catch {
      toast.error("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  function detenerGrabacion() {
    recorderRef.current?.stop();
    setGrabando(false);
  }

  async function procesarAudio(blob: Blob) {
    setProcesando(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const res = await fetch("/api/dictado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64, mimeType: "audio/webm" }),
      });
      const data = (await res.json()) as { transcripcion?: string; informe?: typeof INFORME_VACIO; error?: string };
      if (!res.ok || !data.informe) {
        toast.error(data.error ?? "No se pudo transcribir el audio.");
        return;
      }
      setInforme((prev) => ({
        motivo: data.informe!.motivo || prev.motivo,
        tratamiento: data.informe!.tratamiento || prev.tratamiento,
        producto_lote: data.informe!.producto_lote || prev.producto_lote,
        observaciones: data.informe!.observaciones || prev.observaciones,
        pauta_seguimiento: data.informe!.pauta_seguimiento || prev.pauta_seguimiento,
      }));
      setTranscripcion(data.transcripcion ?? null);
      setOrigen("voz");
      toast.success("Informe generado a partir del dictado. Revísalo y guarda.");
    } catch {
      toast.error("Error procesando el audio.");
    } finally {
      setProcesando(false);
    }
  }

  function toggleTratamiento(id: string) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function guardar() {
    const tieneContenido = Object.values(informe).some((v) => v.trim());
    if (!tieneContenido) { toast.error("El informe está vacío: dicta o escribe al menos un campo."); return; }
    startTransition(async () => {
      const res = await registrarVisita({
        patient_id: pacienteId,
        appointment_id: cita?.id,
        treatment_ids: seleccionados,
        informe,
        notas: informe.observaciones,
        fecha_visita: new Date(`${fecha}T12:00:00`).toISOString(),
        origen,
      });
      if (res.error) { toast.error(typeof res.error === "string" ? res.error : "No se pudo guardar la visita."); return; }
      toast.success("Visita registrada en el historial");
      onClose();
      router.refresh();
    });
  }

  if (!open) return null;

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg)]">
      {/* Barra superior */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand-tint)] text-[var(--brand-strong)]">
          <Stethoscope size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-bold text-[var(--text)]">
            Registrar visita · {pacienteNombre}
          </h2>
          <p className="text-xs text-[var(--text-soft)]">
            {cita ? "Informe de la cita seleccionada" : "Nueva visita: quedará registrada en agenda e historial"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancelar</Button>
        <Button size="sm" className="gap-1.5" onClick={guardar} disabled={isPending || procesando}>
          {isPending ? "Guardando…" : <><Check size={14} /> Guardar visita</>}
        </Button>
        <button onClick={onClose} className="ml-1 flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--surface-2)]" aria-label="Cerrar">
          <X size={17} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-[380px_1fr] md:p-6">
          {/* Columna izquierda: dictado + contexto */}
          <div className="space-y-5">
            {/* Dictado */}
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-card)]">
              <p className="font-display font-semibold text-[var(--text)]">Dicta el informe</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                Cuenta el motivo y el tratamiento aplicado; la IA lo estructura por ti.
              </p>

              <button
                onClick={grabando ? detenerGrabacion : empezarGrabacion}
                disabled={procesando}
                className={cn(
                  "mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full text-white transition-all",
                  grabando
                    ? "animate-pulse bg-[var(--error)] shadow-[0_0_0_12px_var(--error-tint)]"
                    : "bg-[var(--brand)] shadow-[var(--shadow-pop)] hover:scale-105",
                  procesando && "opacity-60",
                )}
                aria-label={grabando ? "Detener grabación" : "Empezar a dictar"}
              >
                {procesando ? <Loader2 size={32} className="animate-spin" /> : grabando ? <Square size={28} fill="currentColor" /> : <Mic size={32} />}
              </button>

              <p className="mt-4 text-sm font-semibold tabular-nums text-[var(--text)]">
                {procesando ? "Transcribiendo y estructurando…" : grabando ? `Grabando · ${mmss}` : "Pulsa para dictar"}
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-[var(--text-soft)]">
                <Keyboard size={11} /> También puedes escribir directamente a la derecha
              </p>
              <p className="mt-3 rounded-[9px] bg-[var(--surface-2)] px-3 py-1.5 text-[10.5px] text-[var(--text-soft)]">
                El audio se transcribe y se descarta: no se almacena (RGPD).
              </p>
            </div>

            {transcripcion && (
              <div className="rounded-[14px] border border-[var(--brand-soft)] bg-[var(--brand-tint)]/50 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--brand-strong)]">
                  <Sparkles size={12} /> Transcripción del dictado
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-soft)]">{transcripcion}</p>
              </div>
            )}

            {/* Fecha */}
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <Label className="mb-1.5 block">Fecha de la visita</Label>
              <DatePicker
                value={fecha}
                onChange={setFecha}
                disabled={Boolean(cita)}
              />
            </div>

            {/* Tratamientos aplicados */}
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <Label className="mb-2 block">Tratamientos aplicados</Label>
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {tratamientosDisp.length === 0 && (
                  <p className="py-3 text-center text-xs text-[var(--text-soft)]">Sin tratamientos en el catálogo.</p>
                )}
                {tratamientosDisp.map((t) => {
                  const activo = seleccionados.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTratamiento(t.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-sm transition-colors",
                        activo ? "bg-[var(--brand-tint)] font-semibold text-[var(--brand-strong)]" : "text-[var(--text)] hover:bg-[var(--surface-2)]",
                      )}
                    >
                      <span className={cn("flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2", activo ? "border-[var(--brand)] bg-[var(--brand)]" : "border-[var(--border)]")}>
                        {activo && <Check size={11} strokeWidth={3} className="text-white" />}
                      </span>
                      <span className="flex-1 truncate">{t.nombre}</span>
                      <span className="text-[10.5px] tabular-nums text-[var(--text-soft)]">{t.duracion_min}min</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-soft)]">
                Actualiza la recurrencia de los tratamientos asignados al paciente.
              </p>
            </div>
          </div>

          {/* Columna derecha: informe */}
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold text-[var(--text)]">Informe clínico</h3>
              {origen === "voz" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--brand-strong)]">
                  <Mic size={10} /> Generado por voz · editable
                </span>
              )}
            </div>
            <div className="space-y-4">
              {CAMPOS.map((c) => (
                <div key={c.key} className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">{c.label}</label>
                  <textarea
                    value={informe[c.key]}
                    onChange={(e) => setInforme((f) => ({ ...f, [c.key]: e.target.value }))}
                    placeholder={c.placeholder}
                    rows={c.rows}
                    className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-soft)]/60 focus:border-[var(--brand)]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
