"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Receipt, Settings2, CheckCircle2, Ban, Eye,
  TrendingUp, Clock, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { cambiarEstadoFactura, guardarDatosFiscales } from "@/app/actions/facturacion";
import { toast } from "sonner";

export interface FacturaRow {
  id: string;
  numero: string;
  fecha: string;
  vencimiento: string | null;
  cliente_nombre: string;
  subtotal: number;
  iva_total: number;
  total: number;
  estado: string;
  forma_pago: string | null;
  descripcion: string | null;
}

interface Fiscales {
  razon_social: string;
  nif: string;
  direccion: string;
  serie: string;
  iva_default: number;
  pie_documento: string;
  color_documento: string;
}

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const fmtFecha = (iso: string | null) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES") : "—");

/** Estado efectivo: una emitida con vencimiento pasado cuenta como vencida. */
export function estadoEfectivo(f: { estado: string; vencimiento: string | null }): string {
  if (f.estado === "emitida" && f.vencimiento && new Date(f.vencimiento + "T23:59:59") < new Date()) return "vencida";
  return f.estado;
}

const ESTADO_UI: Record<string, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "bg-[var(--surface-2)] text-[var(--text-soft)]" },
  emitida: { label: "Pendiente", cls: "bg-[var(--aviso-tint)] text-[var(--aviso)]" },
  vencida: { label: "Vencida", cls: "bg-[var(--error-tint)] text-[var(--error)]" },
  pagada: { label: "Pagada", cls: "bg-[var(--exito-tint)] text-[var(--exito)]" },
  anulada: { label: "Anulada", cls: "bg-[var(--surface-2)] text-[var(--text-soft)] line-through" },
};

export function FacturacionLista({ facturas, fiscales }: { facturas: FacturaRow[]; fiscales: Fiscales }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [fiscalesOpen, setFiscalesOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return facturas.filter((f) => {
      const ef = estadoEfectivo(f);
      const matchQ =
        !q ||
        f.numero.toLowerCase().includes(q) ||
        f.cliente_nombre.toLowerCase().includes(q) ||
        (f.descripcion ?? "").toLowerCase().includes(q);
      const matchE = filtroEstado === "todos" || ef === filtroEstado;
      return matchQ && matchE;
    });
  }, [facturas, busqueda, filtroEstado]);

  const stats = useMemo(() => {
    let facturado = 0, pendiente = 0, vencido = 0;
    for (const f of facturas) {
      const ef = estadoEfectivo(f);
      if (ef === "pagada" || ef === "emitida" || ef === "vencida") facturado += f.total;
      if (ef === "emitida") pendiente += f.total;
      if (ef === "vencida") vencido += f.total;
    }
    return { facturado, pendiente, vencido };
  }, [facturas]);

  function accion(id: string, estado: "pagada" | "anulada") {
    startTransition(async () => {
      const res = await cambiarEstadoFactura(id, estado);
      if (res.error) { toast.error(res.error); return; }
      toast.success(estado === "pagada" ? "Factura marcada como pagada" : "Factura anulada");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 space-y-5">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Facturas de venta</h1>
          <p className="mt-0.5 text-sm text-[var(--text-soft)]">Emite y cobra las facturas de tu clínica.</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFiscalesOpen(true)}>
          <Settings2 size={14} /> Datos fiscales
        </Button>
        <Link href="/facturacion/nueva">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> Nueva factura
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: TrendingUp, label: "Facturado", value: stats.facturado, color: "var(--brand)" },
          { icon: Clock, label: "Pendiente de cobro", value: stats.pendiente, color: "var(--aviso)" },
          { icon: AlertTriangle, label: "Vencido", value: stats.vencido, color: "var(--error)" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px]" style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color }}>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">{s.label}</p>
                <p className="font-display text-xl font-bold tabular-nums text-[var(--text)]">{eur(s.value)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
          <Input placeholder="Buscar número, cliente…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="h-9 w-60 pl-8" />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borradores</SelectItem>
            <SelectItem value="emitida">Pendientes</SelectItem>
            <SelectItem value="vencida">Vencidas</SelectItem>
            <SelectItem value="pagada">Pagadas</SelectItem>
            <SelectItem value="anulada">Anuladas</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-[var(--text-soft)]">{filtradas.length} factura{filtradas.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={facturas.length === 0 ? "Aún no has emitido facturas" : "Sin resultados"}
          description={facturas.length === 0 ? "Crea tu primera factura. Más adelante podrás homologarlas con Verifactu y TicketBAI (Verifacti)." : "Prueba con otra búsqueda u otro estado."}
          action={facturas.length === 0 ? (
            <Link href="/facturacion/nueva"><Button className="gap-1.5"><Plus size={15} /> Nueva factura</Button></Link>
          ) : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Núm.</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtradas.map((f) => {
                const ef = estadoEfectivo(f);
                const ui = ESTADO_UI[ef] ?? ESTADO_UI.emitida;
                return (
                  <tr
                    key={f.id}
                    onClick={() => router.push(`/facturacion/${f.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-4 py-3 tabular-nums text-[var(--text-soft)]">{fmtFecha(f.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text)]">{f.numero}</td>
                    <td className={cn("px-4 py-3 tabular-nums", ef === "vencida" ? "font-semibold text-[var(--error)]" : "text-[var(--text-soft)]")}>
                      {fmtFecha(f.vencimiento)}
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate text-[var(--text)]">{f.cliente_nombre}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-[var(--text-soft)]">{f.descripcion ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--text-soft)]">{eur(f.subtotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--text-soft)]">{eur(f.iva_total)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[var(--text)]">{eur(f.total)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", ui.cls)}>{ui.label}</span>
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link href={`/facturacion/${f.id}`} className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--brand-tint)] hover:text-[var(--brand)]" title="Ver documento">
                          <Eye size={14} />
                        </Link>
                        {(ef === "emitida" || ef === "vencida") && (
                          <button onClick={() => accion(f.id, "pagada")} disabled={isPending} className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--exito-tint)] hover:text-[var(--exito)]" title="Marcar como pagada">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {ef !== "anulada" && ef !== "borrador" && (
                          <button onClick={() => accion(f.id, "anulada")} disabled={isPending} className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--error-tint)] hover:text-[var(--error)]" title="Anular">
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DatosFiscalesDialog open={fiscalesOpen} onClose={() => setFiscalesOpen(false)} fiscales={fiscales} />
    </div>
  );
}

function DatosFiscalesDialog({ open, onClose, fiscales }: { open: boolean; onClose: () => void; fiscales: Fiscales }) {
  const router = useRouter();
  const [form, setForm] = useState(fiscales);
  const [isPending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await guardarDatosFiscales({ ...form, iva_default: Number(form.iva_default) });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Datos fiscales guardados");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Datos fiscales de la clínica</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Razón social</Label>
            <Input value={form.razon_social} onChange={(e) => setForm((f) => ({ ...f, razon_social: e.target.value }))} placeholder="Clínica Ejemplo S.L." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>NIF / CIF</Label>
              <Input value={form.nif} onChange={(e) => setForm((f) => ({ ...f, nif: e.target.value }))} placeholder="B00000000" />
            </div>
            <div className="space-y-1.5">
              <Label>Serie de facturación</Label>
              <Input value={form.serie} onChange={(e) => setForm((f) => ({ ...f, serie: e.target.value }))} placeholder="A" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Dirección fiscal</Label>
            <Input value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} placeholder="Calle, número, CP, ciudad" />
          </div>
          <div className="space-y-1.5">
            <Label>IVA por defecto (%)</Label>
            <Input type="number" min="0" max="100" value={form.iva_default} onChange={(e) => setForm((f) => ({ ...f, iva_default: Number(e.target.value) }))} />
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">Diseño de los documentos</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Color corporativo del documento</Label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={form.color_documento || "#0e9f8e"}
                    onChange={(e) => setForm((f) => ({ ...f, color_documento: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded-md border border-[var(--border)] bg-transparent p-1"
                    aria-label="Color del documento"
                  />
                  <Input
                    value={form.color_documento}
                    onChange={(e) => setForm((f) => ({ ...f, color_documento: e.target.value }))}
                    placeholder="Por defecto: color de marca"
                    className="flex-1 font-mono text-sm"
                  />
                  {form.color_documento && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, color_documento: "" }))}>
                      Reset
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-soft)]">Se usa en cabeceras y totales de facturas y presupuestos. Si lo dejas vacío, se usa el color de marca de la clínica.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Pie de página de los documentos</Label>
                <textarea
                  value={form.pie_documento}
                  onChange={(e) => setForm((f) => ({ ...f, pie_documento: e.target.value }))}
                  rows={3}
                  placeholder={"Ej.: Inscrita en el Registro Mercantil de…\nGracias por confiar en nosotros."}
                  className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                />
                <p className="text-[11px] text-[var(--text-soft)]">Aparece al final de cada factura y presupuesto (datos registrales, condiciones, agradecimiento…).</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Guardando…" : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
