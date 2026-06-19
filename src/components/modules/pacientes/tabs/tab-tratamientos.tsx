"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, CheckCircle, PauseCircle, Pencil, Clock, Euro, MessageCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatFecha } from "@/lib/utils";
import { asignarTratamientoAPaciente } from "@/app/actions/tratamientos";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type PatientTreatment = {
  id: string;
  periodicidad_meses: number;
  ultima_sesion_at: string | null;
  proxima_recomendada_at: string | null;
  estado: string;
  treatments: {
    id: string;
    nombre: string;
    categoria: string;
    duracion_min: number;
    precio_orientativo: number | null;
    periodicidad_meses: number | null;
  } | null;
};

type Tratamiento = Database["public"]["Tables"]["treatments"]["Row"];

const PERIODICIDADES = [
  { value: "1", label: "Mensual" }, { value: "2", label: "Bimestral" },
  { value: "3", label: "Trimestral" }, { value: "4", label: "Cuatrimestral" },
  { value: "6", label: "Semestral" }, { value: "12", label: "Anual" },
  { value: "18", label: "Cada 18 meses" }, { value: "24", label: "Cada 2 años" },
];

interface Props {
  tratamientos: Record<string, unknown>[];
  pacienteId: string;
}

export function TabTratamientos({ tratamientos, pacienteId }: Props) {
  const lista = tratamientos as unknown as PatientTreatment[];
  const activos = lista.filter(t => t.estado === "activo");
  const otros = lista.filter(t => t.estado !== "activo");
  const ahora = new Date();

  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [catTratamientos, setCatTratamientos] = useState<Tratamiento[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [periodicidad, setPeriodicidad] = useState("6");
  const [ultimaSesion, setUltimaSesion] = useState("");
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  // Cargar catálogo al abrir el dialog
  useEffect(() => {
    if (!dialogOpen) return;
    supabase
      .from("treatments")
      .select("*")
      .eq("activo", true)
      .order("categoria")
      .order("nombre")
      .then(({ data }) => { if (data) setCatTratamientos(data); });
  }, [dialogOpen]);

  // Prefill si estamos editando
  function abrirEditar(pt: PatientTreatment) {
    setEditandoId(pt.id);
    setSelectedTreatment(pt.treatments?.id ?? "");
    setPeriodicidad(String(pt.periodicidad_meses));
    setUltimaSesion(pt.ultima_sesion_at ? pt.ultima_sesion_at.slice(0, 10) : "");
    setDialogOpen(true);
  }

  function abrirNuevo() {
    setEditandoId(null);
    setSelectedTreatment("");
    setPeriodicidad("6");
    setUltimaSesion("");
    setDialogOpen(true);
  }

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTreatment) { toast.error("Selecciona un tratamiento"); return; }
    startTransition(async () => {
      const result = await asignarTratamientoAPaciente({
        patient_id: pacienteId,
        treatment_id: selectedTreatment,
        periodicidad_meses: Number(periodicidad),
        ultima_sesion_at: ultimaSesion || undefined,
      });
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Error al asignar el tratamiento");
        return;
      }
      const nombreTrat = catTratamientos.find(t => t.id === selectedTreatment)?.nombre ?? "Tratamiento";
      toast.success(`"${nombreTrat}" asignado correctamente`);
      setDialogOpen(false);
      router.refresh();
    });
  }

  // Agrupar catálogo por categoría para el select
  const catPorCategoria = catTratamientos.reduce<Record<string, Tratamiento[]>>((acc, t) => {
    const key = t.categoria;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const selectedInfo = catTratamientos.find(t => t.id === selectedTreatment);

  return (
    <div className="space-y-4 animate-in fade-in-0 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--tinta-suave)]">
          {activos.length} tratamiento{activos.length !== 1 ? "s" : ""} activo{activos.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" className="gap-1.5" onClick={abrirNuevo}>
          <Plus size={13} strokeWidth={2} /> Asignar tratamiento
        </Button>
      </div>

      {activos.length === 0 && otros.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--salvia-tint)] mb-3">
            <RefreshCw size={22} strokeWidth={1.5} className="text-[var(--salvia)]" />
          </div>
          <h3 className="font-display text-base font-semibold text-[var(--tinta)]">Sin tratamientos asignados</h3>
          <p className="mt-1 text-sm text-[var(--tinta-suave)] max-w-xs">
            Asigna tratamientos recurrentes para hacer seguimiento automático y recibir recordatorios.
          </p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={abrirNuevo}>
            <Plus size={13} strokeWidth={2} /> Asignar primer tratamiento
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {activos.map(t => {
            const vencida = t.proxima_recomendada_at && new Date(t.proxima_recomendada_at) < ahora;
            return <TratamientoCard key={t.id} t={t} vencida={!!vencida} onEditar={() => abrirEditar(t)} />;
          })}
          {otros.length > 0 && (
            <>
              <p className="text-xs font-semibold text-[var(--tinta-suave)] pt-2 pb-1">Pausados / Finalizados</p>
              {otros.map(t => <TratamientoCard key={t.id} t={t} vencida={false} muted onEditar={() => abrirEditar(t)} />)}
            </>
          )}
        </div>
      )}

      {/* Dialog asignar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar tratamiento asignado" : "Asignar tratamiento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4 pt-1">
            {/* Selector de tratamiento */}
            <div className="space-y-1.5">
              <Label>Tratamiento *</Label>
              <Select value={selectedTreatment} onValueChange={setSelectedTreatment} disabled={!!editandoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tratamiento…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(catPorCategoria).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--tinta-suave)]">{cat}</p>
                      {items.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span>{t.nombre}</span>
                            <span className="text-[11px] text-[var(--tinta-suave)] tabular-nums shrink-0">
                              {t.duracion_min}min {t.precio_orientativo != null ? `· ${t.precio_orientativo}€` : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info del tratamiento seleccionado */}
            {selectedInfo && (
              <div className="flex items-start gap-2 rounded-[10px] bg-[var(--arena)] px-3 py-2.5">
                <Info size={13} strokeWidth={1.75} className="text-[var(--tinta-suave)] mt-0.5 shrink-0" />
                <div className="text-xs text-[var(--tinta-suave)]">
                  <div className="flex gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={10} /> {selectedInfo.duracion_min} min</span>
                    {selectedInfo.precio_orientativo != null && <span className="flex items-center gap-1"><Euro size={10} /> {selectedInfo.precio_orientativo}€</span>}
                    {selectedInfo.periodicidad_meses && <span className="flex items-center gap-1 text-[var(--oliva)] font-semibold"><RefreshCw size={10} /> cada {selectedInfo.periodicidad_meses} meses (recomendado)</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Periodicidad personalizada para esta paciente */}
            <div className="space-y-1.5">
              <Label>Periodicidad para esta paciente</Label>
              <Select value={periodicidad} onValueChange={setPeriodicidad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[var(--tinta-suave)]">
                Se generará una recomendación automática cada {periodicidad} meses tras la última sesión.
              </p>
            </div>

            {/* Última sesión */}
            <div className="space-y-1.5">
              <Label>Última sesión realizada (opcional)</Label>
              <DatePicker
                value={ultimaSesion}
                onChange={setUltimaSesion}
                max={new Date().toISOString().slice(0, 10)}
                clearable
                placeholder="Sin fecha previa"
              />
              <p className="text-[11px] text-[var(--tinta-suave)]">
                Si ya se realizó antes, indica la fecha para calcular cuándo toca la siguiente.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending || !selectedTreatment}>
                {isPending ? "Guardando…" : editandoId ? "Guardar cambios" : "Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TratamientoCard({
  t, vencida, muted = false, onEditar,
}: { t: PatientTreatment; vencida: boolean; muted?: boolean; onEditar: () => void }) {
  return (
    <div className={`group flex items-start justify-between gap-3 rounded-[14px] border p-4 transition-all duration-150 ${
      muted ? "border-[var(--lino)] bg-[var(--arena)] opacity-60" :
      vencida ? "border-[var(--aviso)]/50 bg-[var(--aviso-tint)]" :
      "border-[var(--lino)] bg-[var(--blanco-calido)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)]"
    }`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {t.estado === "activo"
            ? <CheckCircle size={16} strokeWidth={1.75} className={vencida ? "text-[var(--aviso)]" : "text-[var(--exito)]"} />
            : <PauseCircle size={16} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--tinta)]">{t.treatments?.nombre ?? "Tratamiento"}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-[var(--tinta-suave)] flex items-center gap-1">
              <RefreshCw size={10} strokeWidth={2} /> Cada {t.periodicidad_meses} meses
            </span>
            {t.ultima_sesion_at && (
              <span className="text-xs text-[var(--tinta-suave)]">
                Última: {formatFecha(t.ultima_sesion_at)}
              </span>
            )}
          </div>
          {t.proxima_recomendada_at && (
            <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${vencida ? "text-[var(--aviso)]" : "text-[var(--tinta-suave)]"}`}>
              {vencida ? "⚠ Vencida desde " : "Próxima: "}
              {formatFecha(t.proxima_recomendada_at)}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={onEditar}
            className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--arena)] text-[var(--tinta-suave)] hover:bg-[var(--lino)] transition-all">
            <Pencil size={11} strokeWidth={2} />
          </button>
          <Badge variant={t.estado === "activo" ? "oliva" : "muted"} className="capitalize text-[10px]">
            {t.estado}
          </Badge>
        </div>
        {vencida && (
          <Button size="sm" variant="terracota" className="text-xs h-7 px-2.5 gap-1">
            <MessageCircle size={10} strokeWidth={2} /> Contactar
          </Button>
        )}
      </div>
    </div>
  );
}
