"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, ToggleLeft, ToggleRight, Clock, RefreshCw, Tag, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { crearTratamiento, actualizarTratamiento, toggleTratamientoActivo } from "@/app/actions/tratamientos";
import type { Database } from "@/lib/database.types";

type Tratamiento = Database["public"]["Tables"]["treatments"]["Row"];

const CATEGORIAS = [
  { value: "dental", label: "Dental", color: "text-[var(--info)] bg-[var(--info-tint)]" },
  { value: "facial", label: "Facial", color: "text-[var(--terracota)] bg-[var(--terracota-tint)]" },
  { value: "corporal", label: "Corporal", color: "text-[var(--oliva)] bg-[var(--salvia-tint)]" },
  { value: "capilar", label: "Capilar", color: "text-[var(--aviso)] bg-[var(--aviso-tint)]" },
  { value: "medicina", label: "Medicina", color: "text-[var(--exito)] bg-[var(--exito-tint)]" },
  { value: "fisioterapia", label: "Fisioterapia", color: "text-[var(--info)] bg-[var(--info-tint)]" },
  { value: "bienestar", label: "Bienestar", color: "text-[var(--oliva)] bg-[var(--salvia-tint)]" },
  { value: "otro", label: "Otro", color: "text-[var(--tinta-suave)] bg-[var(--arena)]" },
];

type Categoria = Database["public"]["Enums"]["categoria_tratamiento"];

const PERIODICIDADES = [
  { value: "1", label: "Mensual (1 mes)" },
  { value: "2", label: "Bimestral (2 meses)" },
  { value: "3", label: "Trimestral (3 meses)" },
  { value: "4", label: "Cuatrimestral (4 meses)" },
  { value: "6", label: "Semestral (6 meses)" },
  { value: "12", label: "Anual (12 meses)" },
  { value: "18", label: "Cada 18 meses" },
  { value: "0", label: "Sin periodicidad (visita única)" },
];

interface FormData {
  nombre: string;
  categoria: Categoria;
  duracion_min: string;
  precio_orientativo: string;
  periodicidad_meses: string;
  activo: boolean;
}

const emptyForm: FormData = {
  nombre: "", categoria: "facial", duracion_min: "60",
  precio_orientativo: "", periodicidad_meses: "0", activo: true,
};

interface Props { tratamientos: Tratamiento[] }

export function TratamientosCatalogo({ tratamientos }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Tratamiento | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [filtro, setFiltro] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  function abrirNuevo() { setEditando(null); setForm(emptyForm); setDialogOpen(true); }
  function abrirEditar(t: Tratamiento) {
    setEditando(t);
    setForm({
      nombre: t.nombre,
      categoria: t.categoria,
      duracion_min: String(t.duracion_min),
      precio_orientativo: t.precio_orientativo != null ? String(t.precio_orientativo) : "",
      periodicidad_meses: t.periodicidad_meses != null ? String(t.periodicidad_meses) : "0",
      activo: t.activo,
    });
    setDialogOpen(true);
  }

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      nombre: form.nombre,
      categoria: form.categoria,
      duracion_min: Number(form.duracion_min),
      precio_orientativo: form.precio_orientativo ? Number(form.precio_orientativo) : null,
      periodicidad_meses: Number(form.periodicidad_meses) > 0 ? Number(form.periodicidad_meses) : null,
      activo: form.activo,
    };
    startTransition(async () => {
      const result = editando
        ? await actualizarTratamiento(editando.id, data)
        : await crearTratamiento(data);
      if (result.error) {
        toast.error(typeof result.error === "string" ? result.error : "Error al guardar el tratamiento");
        return;
      }
      toast.success(editando ? "Tratamiento actualizado" : "Tratamiento creado y disponible para asignar");
      setDialogOpen(false);
      router.refresh();
    });
  }

  function handleToggle(t: Tratamiento) {
    startTransition(async () => {
      const result = await toggleTratamientoActivo(t.id, !t.activo);
      if (result.error) { toast.error("No se pudo cambiar el estado"); return; }
      toast.success(t.activo ? `"${t.nombre}" desactivado` : `"${t.nombre}" activado`);
      router.refresh();
    });
  }

  const filtrados = filtro === "todos" ? tratamientos : tratamientos.filter(t => t.categoria === filtro);
  const activos = tratamientos.filter(t => t.activo).length;

  return (
    <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total tratamientos", value: tratamientos.length },
          { label: "Activos", value: activos },
          { label: "Con seguimiento", value: tratamientos.filter(t => t.periodicidad_meses).length },
          { label: "Sin periodicidad", value: tratamientos.filter(t => !t.periodicidad_meses).length },
        ].map(s => (
          <div key={s.label} className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold text-[var(--tinta-suave)]">{s.label}</p>
            <p className="text-2xl font-display font-bold text-[var(--tinta)] tabular-nums mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-[10px] border border-[var(--lino)] overflow-hidden">
          {["todos", "facial", "corporal", "capilar", "otro"].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filtro === f ? "bg-[var(--oliva)] text-white" : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button size="sm" className="gap-1.5" onClick={abrirNuevo}>
          <Plus size={13} strokeWidth={2} /> Nuevo tratamiento
        </Button>
      </div>

      {/* Grid de tratamientos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtrados.map((t, i) => {
          const cat = CATEGORIAS.find(c => c.value === t.categoria);
          return (
            <div
              key={t.id}
              style={{ animationDelay: `${i * 25}ms` }}
              className={`group relative rounded-[16px] border bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-pop)] animate-in fade-in-0 ${!t.activo ? "opacity-50 border-[var(--lino)]" : "border-[var(--lino)] hover:-translate-y-0.5"}`}
            >
              {/* Acciones */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => abrirEditar(t)}
                  className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--arena)] text-[var(--tinta-suave)] hover:bg-[var(--lino)] transition-colors">
                  <Edit2 size={12} strokeWidth={2} />
                </button>
                <button onClick={() => handleToggle(t)}
                  className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--arena)] text-[var(--tinta-suave)] hover:bg-[var(--lino)] transition-colors">
                  {t.activo ? <ToggleRight size={12} strokeWidth={2} className="text-[var(--oliva)]" /> : <ToggleLeft size={12} strokeWidth={2} />}
                </button>
              </div>

              {/* Categoría */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold mb-3 ${cat?.color}`}>
                <Tag size={9} /> {cat?.label}
              </span>

              <h3 className="font-display text-sm font-semibold text-[var(--tinta)] leading-snug pr-10">{t.nombre}</h3>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[var(--tinta-suave)]">
                  <Clock size={11} strokeWidth={1.75} />
                  {t.duracion_min} min
                  {t.precio_orientativo != null && (
                    <span className="ml-auto flex items-center gap-0.5 font-semibold text-[var(--tinta)]">
                      <Euro size={10} />{t.precio_orientativo}
                    </span>
                  )}
                </div>
                {t.periodicidad_meses ? (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--oliva)] font-semibold">
                    <RefreshCw size={11} strokeWidth={2} />
                    Cada {t.periodicidad_meses} {t.periodicidad_meses === 1 ? "mes" : "meses"}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--tinta-suave)]">Sin periodicidad</p>
                )}
              </div>

              {!t.activo && (
                <Badge variant="muted" className="mt-2 text-[10px]">Inactivo</Badge>
              )}
            </div>
          );
        })}

        {/* Card de añadir */}
        <button onClick={abrirNuevo}
          className="flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-[var(--lino)] p-6 text-[var(--tinta-suave)] hover:border-[var(--salvia)] hover:text-[var(--oliva)] hover:bg-[var(--salvia-tint)]/30 transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--arena)]">
            <Plus size={18} strokeWidth={2} />
          </div>
          <span className="text-xs font-semibold">Añadir tratamiento</span>
        </button>
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar: ${editando.nombre}` : "Nuevo tratamiento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Nombre del tratamiento *</Label>
              <Input required placeholder="Ej. Toxina Botulínica — Frente y Entrecejo" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v as FormData["categoria"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duración (minutos) *</Label>
                <Input required type="number" min="5" max="480" value={form.duracion_min}
                  onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio orientativo (€)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.precio_orientativo}
                  onChange={e => setForm(f => ({ ...f, precio_orientativo: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Periodicidad de revisión</Label>
                <Select value={form.periodicidad_meses} onValueChange={v => setForm(f => ({ ...f, periodicidad_meses: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODICIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {Number(form.periodicidad_meses) > 0 && (
              <div className="flex items-start gap-2 rounded-[10px] bg-[var(--info-tint)] px-3 py-2.5">
                <RefreshCw size={13} strokeWidth={2} className="text-[var(--info)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--tinta-suave)]">
                  El sistema creará una recomendación automática cada <strong>{form.periodicidad_meses} meses</strong> tras la última sesión de cada paciente que tenga este tratamiento asignado.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando…" : editando ? "Guardar cambios" : "Crear tratamiento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
