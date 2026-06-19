"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, MinusCircle, Ticket, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { crearBono, consumirSesion, eliminarBono, crearBonoTipo, eliminarBonoTipo } from "@/app/actions/gestion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Bono {
  id: string;
  nombre: string;
  sesiones_total: number;
  sesiones_usadas: number;
  precio: number;
  estado: string;
  caducidad: string | null;
  patient: { id: string; nombre: string; apellidos: string } | null;
}
interface Plantilla {
  id: string;
  nombre: string;
  sesiones: number;
  precio: number;
  treatment_id: string | null;
}
interface Opt { value: string; label: string }

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const selCls = "h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20";

export function BonosView({
  rows,
  plantillas,
  pacientes,
  tratamientos,
}: {
  rows: Bono[];
  plantillas: Plantilla[];
  pacientes: Opt[];
  tratamientos: Opt[];
}) {
  const router = useRouter();
  const tipoFormRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [openTipos, setOpenTipos] = useState(false);
  const [pending, startTransition] = useTransition();

  // Formulario de nuevo bono (controlado para poder autorrellenar desde plantilla).
  const [patientId, setPatientId] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [sesiones, setSesiones] = useState("10");
  const [precio, setPrecio] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [caducidad, setCaducidad] = useState("");

  function resetBono() {
    setPatientId(""); setPlantillaId(""); setNombre(""); setSesiones("10"); setPrecio(""); setTreatmentId(""); setCaducidad("");
  }
  function elegirPlantilla(id: string) {
    setPlantillaId(id);
    const p = plantillas.find((x) => x.id === id);
    if (!p) return;
    setNombre(p.nombre);
    setSesiones(String(p.sesiones));
    setPrecio(p.precio ? String(p.precio) : "");
    setTreatmentId(p.treatment_id ?? "");
  }

  function crearNuevoBono() {
    if (!patientId) { toast.error("Selecciona un paciente."); return; }
    if (!nombre.trim()) { toast.error("El nombre del bono es obligatorio."); return; }
    const fd = new FormData();
    fd.set("patient_id", patientId);
    fd.set("nombre", nombre);
    fd.set("sesiones_total", sesiones);
    fd.set("precio", precio);
    fd.set("treatment_id", treatmentId);
    fd.set("caducidad", caducidad);
    startTransition(async () => {
      const res = await crearBono(fd);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Bono creado.");
      resetBono();
      setOpen(false);
      router.refresh();
    });
  }

  function crearTipo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await crearBonoTipo(fd);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Plantilla de bono creada.");
      tipoFormRef.current?.reset();
      router.refresh();
    });
  }
  function borrarTipo(id: string) {
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar esta plantilla de bono?")) return;
    startTransition(async () => {
      const res = await eliminarBonoTipo(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Plantilla eliminada.");
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
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar este bono? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const res = await eliminarBono(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Bono eliminado.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Bonos de sesiones</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Packs prepago de sesiones y su consumo por paciente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setOpenTipos((o) => !o)}>
            <LayoutTemplate size={15} /> Plantillas
          </Button>
          <Button className="gap-1.5" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={15} /> : <Plus size={15} />} {open ? "Cerrar" : "Nuevo bono"}
          </Button>
        </div>
      </div>

      {/* Gestión de plantillas predeterminadas */}
      {openTipos && (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-1 font-display font-semibold text-[var(--text)]">Plantillas de bono</h2>
          <p className="mb-4 text-sm text-[var(--text-soft)]">Define bonos predeterminados para crearlos rápido desde el desplegable.</p>
          <form ref={tipoFormRef} onSubmit={crearTipo} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Campo label="Nombre *"><Input name="nombre" required placeholder="Bono 10 sesiones" /></Campo>
            <Campo label="Sesiones *"><Input name="sesiones" type="number" inputMode="numeric" defaultValue={10} required /></Campo>
            <Campo label="Precio (€)"><Input name="precio" type="number" inputMode="decimal" step="any" placeholder="0,00" /></Campo>
            <Campo label="Tratamiento">
              <select name="treatment_id" defaultValue="" className={selCls}>
                <option value="">—</option>
                {tratamientos.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Campo>
            <Button type="submit" disabled={pending}>Añadir plantilla</Button>
          </form>

          {plantillas.length > 0 && (
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {plantillas.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold text-[var(--text)]">{p.nombre}</span>
                  <span className="ml-auto text-[var(--text-soft)]">{p.sesiones} sesiones{p.precio ? ` · ${eur(Number(p.precio))}` : ""}</span>
                  <button onClick={() => borrarTipo(p.id)} disabled={pending} className="text-[var(--text-soft)] hover:text-[var(--error)]" aria-label="Eliminar plantilla"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Nuevo bono */}
      {open && (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          {plantillas.length > 0 && (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-[var(--text-soft)]">Usar una plantilla (opcional)</label>
              <select value={plantillaId} onChange={(e) => elegirPlantilla(e.target.value)} className={selCls}>
                <option value="">Bono personalizado…</option>
                {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.sesiones} ses.{p.precio ? ` · ${eur(Number(p.precio))}` : ""}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Paciente *">
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={selCls}>
                <option value="">—</option>
                {pacientes.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Campo>
            <Campo label="Nombre del bono *">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p. ej. Bono 10 sesiones fisioterapia" />
            </Campo>
            <Campo label="Nº de sesiones *">
              <Input value={sesiones} onChange={(e) => setSesiones(e.target.value)} type="number" inputMode="numeric" />
            </Campo>
            <Campo label="Precio (€)">
              <Input value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" inputMode="decimal" step="any" placeholder="0,00" />
            </Campo>
            <Campo label="Tratamiento asociado (opcional)">
              <select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} className={selCls}>
                <option value="">—</option>
                {tratamientos.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Campo>
            <Campo label="Caducidad (opcional)">
              <DatePicker value={caducidad} onChange={setCaducidad} clearable placeholder="Sin caducidad" min={new Date().toISOString().slice(0, 10)} />
            </Campo>
          </div>
          <div className="mt-4">
            <Button disabled={pending} onClick={crearNuevoBono}>{pending ? "Guardando…" : "Crear bono"}</Button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-card)]">
          <Ticket size={26} className="mx-auto mb-2 text-[var(--brand-soft)]" />
          <p className="text-sm text-[var(--text-soft)]">Aún no hay bonos. Crea el primero para empezar a consumir sesiones.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((b) => {
            const restantes = b.sesiones_total - b.sesiones_usadas;
            const pct = Math.round((b.sesiones_usadas / Math.max(b.sesiones_total, 1)) * 100);
            const agotado = restantes <= 0;
            return (
              <div key={b.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold text-[var(--text)]">{b.nombre}</p>
                    <p className="text-xs text-[var(--text-soft)]">
                      {b.patient ? `${b.patient.nombre} ${b.patient.apellidos}` : "Sin paciente"}
                      {b.precio > 0 && ` · ${eur(Number(b.precio))}`}
                    </p>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    agotado ? "bg-[var(--error-tint)] text-[var(--error)]" : "bg-[var(--exito-tint)] text-[var(--exito)]",
                  )}>
                    {agotado ? "Agotado" : "Activo"}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text)]">{b.sesiones_usadas}/{b.sesiones_total} sesiones</span>
                    <span className="text-[var(--text-soft)]">{restantes} restantes</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--brand), var(--brand-soft))" }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={pending || agotado} onClick={() => usar(b.id)}>
                    <MinusCircle size={14} /> Usar sesión
                  </Button>
                  <button onClick={() => borrar(b.id)} disabled={pending} className="ml-auto text-[var(--text-soft)] hover:text-[var(--error)]" aria-label="Eliminar bono">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[var(--text-soft)]">{label}</label>
      {children}
    </div>
  );
}
