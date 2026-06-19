"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Trash2, Pill, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearReceta, eliminarReceta, type RecetaItemInput } from "@/app/actions/recetas";
import { formatFecha } from "@/lib/utils";
import { toast } from "sonner";

interface RecetaItem { id: string; medicamento: string; posologia: string | null; duracion: string | null; cantidad: string | null }
interface Receta {
  id: string;
  fecha: string;
  diagnostico: string | null;
  observaciones: string | null;
  recipe_items: RecetaItem[];
}

export function TabRecetas({ recetas, pacienteId }: { recetas: Receta[]; pacienteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState<RecetaItemInput[]>([{ medicamento: "", posologia: "", duracion: "", cantidad: "" }]);

  function upd(i: number, patch: Partial<RecetaItemInput>) {
    setItems((a) => a.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  const addItem = () => setItems((a) => [...a, { medicamento: "", posologia: "", duracion: "", cantidad: "" }]);
  const rmItem = (i: number) => setItems((a) => (a.length > 1 ? a.filter((_, idx) => idx !== i) : a));

  function guardar() {
    if (items.every((it) => !it.medicamento.trim())) { toast.error("Añade al menos un medicamento."); return; }
    startTransition(async () => {
      const res = await crearReceta({ patient_id: pacienteId, diagnostico, observaciones, items });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Receta creada.");
      setDiagnostico(""); setObservaciones(""); setItems([{ medicamento: "", posologia: "", duracion: "", cantidad: "" }]);
      setOpen(false);
      router.refresh();
    });
  }
  function borrar(id: string) {
    startTransition(async () => {
      const res = await eliminarReceta(id, pacienteId);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Receta eliminada.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--tinta)]">{recetas.length} receta(s)</p>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={14} /> : <Plus size={14} />} {open ? "Cerrar" : "Nueva receta"}
        </Button>
      </div>

      {open && (
        <div className="rounded-[14px] border border-[var(--lino)] bg-[var(--arena)]/50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Diagnóstico</label>
              <Input value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Observaciones</label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tinta-suave)]">Medicación</p>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid gap-2 rounded-[10px] border border-[var(--lino)] bg-white p-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
                <Input value={it.medicamento} onChange={(e) => upd(i, { medicamento: e.target.value })} placeholder="Medicamento *" />
                <Input value={it.posologia} onChange={(e) => upd(i, { posologia: e.target.value })} placeholder="Posología (p. ej. 1 cada 8h)" />
                <Input value={it.duracion} onChange={(e) => upd(i, { duracion: e.target.value })} placeholder="Duración" />
                <Input value={it.cantidad} onChange={(e) => upd(i, { cantidad: e.target.value })} placeholder="Cantidad" />
                <button onClick={() => rmItem(i)} className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--tinta-suave)] hover:bg-[var(--error-tint)] hover:text-[var(--error)]" aria-label="Quitar"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--oliva)]"><Plus size={13} /> Añadir medicamento</button>

          <div className="mt-4">
            <Button onClick={guardar} disabled={pending}>{pending ? "Guardando…" : "Crear receta"}</Button>
          </div>
        </div>
      )}

      {recetas.length === 0 ? (
        <div className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] px-5 py-10 text-center">
          <Pill size={24} className="mx-auto mb-2 text-[var(--salvia)]" />
          <p className="text-sm text-[var(--tinta-suave)]">Sin recetas. Crea la primera prescripción.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recetas.map((r) => (
            <div key={r.id} className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 font-display font-semibold text-[var(--tinta)]">
                    <FileText size={15} className="text-[var(--oliva)]" /> Receta · {formatFecha(r.fecha)}
                  </p>
                  {r.diagnostico && <p className="mt-0.5 text-xs text-[var(--tinta-suave)]">Dx: {r.diagnostico}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/recetas/${r.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5"><Printer size={13} /> Imprimir</Button>
                  </Link>
                  <button onClick={() => borrar(r.id)} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--tinta-suave)] hover:text-[var(--error)]" aria-label="Eliminar"><Trash2 size={14} /></button>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {r.recipe_items.map((it) => (
                  <li key={it.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold text-[var(--tinta)]">{it.medicamento}</span>
                    {it.cantidad && <span className="text-[var(--tinta-suave)]">· {it.cantidad}</span>}
                    {it.posologia && <span className="text-[var(--tinta-suave)]">· {it.posologia}</span>}
                    {it.duracion && <span className="text-[var(--tinta-suave)]">· {it.duracion}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
