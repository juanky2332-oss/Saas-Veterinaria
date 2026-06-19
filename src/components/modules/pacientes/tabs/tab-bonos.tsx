"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, MinusCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearBono, consumirSesion, eliminarBono } from "@/app/actions/gestion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Bono {
  id: string;
  nombre: string;
  sesiones_total: number;
  sesiones_usadas: number;
  precio: number;
  estado: string;
}
interface Plantilla { id: string; nombre: string; sesiones: number; precio: number; treatment_id: string | null }
interface Opt { value: string; label: string }

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const selCls = "h-10 w-full rounded-[12px] border border-[var(--lino)] bg-white px-3 text-sm text-[var(--tinta)] focus-visible:border-[var(--oliva)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(117,128,107,.25)]";

export function TabBonos({ pacienteId, bonos, plantillas, tratamientos }: {
  pacienteId: string;
  bonos: Bono[];
  plantillas: Plantilla[];
  tratamientos: Opt[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(bonos.length === 0);
  const [plantillaId, setPlantillaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [sesiones, setSesiones] = useState("10");
  const [precio, setPrecio] = useState("");
  const [treatmentId, setTreatmentId] = useState("");

  function elegirPlantilla(id: string) {
    setPlantillaId(id);
    const p = plantillas.find((x) => x.id === id);
    if (!p) return;
    setNombre(p.nombre); setSesiones(String(p.sesiones)); setPrecio(p.precio ? String(p.precio) : ""); setTreatmentId(p.treatment_id ?? "");
  }
  function crear() {
    if (!nombre.trim()) { toast.error("El nombre del bono es obligatorio."); return; }
    const fd = new FormData();
    fd.set("patient_id", pacienteId);
    fd.set("nombre", nombre); fd.set("sesiones_total", sesiones); fd.set("precio", precio); fd.set("treatment_id", treatmentId);
    startTransition(async () => {
      const res = await crearBono(fd);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Bono creado.");
      setPlantillaId(""); setNombre(""); setSesiones("10"); setPrecio(""); setTreatmentId(""); setOpen(false);
      router.refresh();
    });
  }
  function usar(id: string) {
    startTransition(async () => {
      const res = await consumirSesion(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Sesión consumida.");
      router.refresh();
    });
  }
  function borrar(id: string) {
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar este bono?")) return;
    startTransition(async () => {
      const res = await eliminarBono(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Bono eliminado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--tinta)]">{bonos.length} bono(s)</p>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={14} /> : <Plus size={14} />} {open ? "Cerrar" : "Nuevo bono"}
        </Button>
      </div>

      {open && (
        <div className="rounded-[14px] border border-[var(--lino)] bg-[var(--arena)]/50 p-4">
          {plantillas.length > 0 && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Plantilla (opcional)</label>
              <select value={plantillaId} onChange={(e) => elegirPlantilla(e.target.value)} className={selCls}>
                <option value="">Bono personalizado…</option>
                {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.sesiones} ses.{p.precio ? ` · ${eur(Number(p.precio))}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Nombre *</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Bono 10 sesiones" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Sesiones *</label><Input value={sesiones} onChange={(e) => setSesiones(e.target.value)} type="number" inputMode="numeric" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Precio (€)</label><Input value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" inputMode="decimal" step="any" placeholder="0,00" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">Tratamiento</label>
              <select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} className={selCls}>
                <option value="">—</option>
                {tratamientos.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3"><Button disabled={pending} onClick={crear}>{pending ? "Guardando…" : "Crear bono"}</Button></div>
        </div>
      )}

      {bonos.length === 0 ? (
        <div className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] px-5 py-10 text-center">
          <Ticket size={24} className="mx-auto mb-2 text-[var(--salvia)]" />
          <p className="text-sm text-[var(--tinta-suave)]">Este paciente no tiene bonos. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bonos.map((b) => {
            const restantes = b.sesiones_total - b.sesiones_usadas;
            const pct = Math.round((b.sesiones_usadas / Math.max(b.sesiones_total, 1)) * 100);
            const agotado = restantes <= 0;
            return (
              <div key={b.id} className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold text-[var(--tinta)]">{b.nombre}</p>
                    {b.precio > 0 && <p className="text-xs text-[var(--tinta-suave)]">{eur(Number(b.precio))}</p>}
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", agotado ? "bg-[var(--error-tint)] text-[var(--error)]" : "bg-[var(--exito-tint)] text-[var(--exito)]")}>{agotado ? "Agotado" : "Activo"}</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--tinta)]">{b.sesiones_usadas}/{b.sesiones_total} sesiones</span>
                    <span className="text-[var(--tinta-suave)]">{restantes} restantes</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--arena)]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--oliva), var(--salvia))" }} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={pending || agotado} onClick={() => usar(b.id)}><MinusCircle size={14} /> Usar sesión</Button>
                  <button onClick={() => borrar(b.id)} disabled={pending} className="ml-auto text-[var(--tinta-suave)] hover:text-[var(--error)]" aria-label="Eliminar bono"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
