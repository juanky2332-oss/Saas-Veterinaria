"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileCheck2, FileEdit } from "lucide-react";
import { crearFactura } from "@/app/actions/facturacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

interface PacienteOpt {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string | null;
  direccion: string | null;
  telefono: string;
}
interface TratamientoOpt {
  nombre: string;
  precio_orientativo: number | null;
}

type Item = { descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; iva_pct: number };

const round2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const hoy = () => new Date().toISOString().slice(0, 10);
const masDias = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const FORMAS_PAGO = ["Efectivo", "Tarjeta", "Transferencia", "Bizum", "Domiciliación", "Financiación"];
const IVAS = [21, 10, 4, 0];

export function NuevaFacturaForm({ pacientes, tratamientos, numeroPreview, ivaDefault }: {
  pacientes: PacienteOpt[];
  tratamientos: TratamientoOpt[];
  numeroPreview: string;
  ivaDefault: number;
}) {
  const router = useRouter();
  const [pacienteId, setPacienteId] = useState<string>("none");
  const [cliente, setCliente] = useState("");
  const [nif, setNif] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [vencimiento, setVencimiento] = useState(masDias(15));
  const [formaPago, setFormaPago] = useState("Tarjeta");
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<Item[]>([
    { descripcion: "", cantidad: 1, precio_unitario: 0, descuento_pct: 0, iva_pct: ivaDefault },
  ]);
  const [isPending, startTransition] = useTransition();

  function elegirPaciente(id: string) {
    setPacienteId(id);
    if (id === "none") return;
    const p = pacientes.find((x) => x.id === id);
    if (!p) return;
    setCliente(`${p.nombre} ${p.apellidos}`.trim());
    setNif(p.dni ?? "");
    setDireccion(p.direccion ?? "");
  }

  function update(i: number, patch: Partial<Item>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function onDescripcion(i: number, valor: string) {
    const match = tratamientos.find((t) => t.nombre === valor);
    update(i, {
      descripcion: valor,
      ...(match?.precio_orientativo != null && items[i].precio_unitario === 0
        ? { precio_unitario: Number(match.precio_orientativo) }
        : {}),
    });
  }
  const addItem = () => setItems((a) => [...a, { descripcion: "", cantidad: 1, precio_unitario: 0, descuento_pct: 0, iva_pct: ivaDefault }]);
  const removeItem = (i: number) => setItems((a) => (a.length > 1 ? a.filter((_, idx) => idx !== i) : a));

  const totales = useMemo(() => {
    let subtotal = 0, iva = 0;
    for (const it of items) {
      const base = it.cantidad * it.precio_unitario * (1 - it.descuento_pct / 100);
      subtotal += base;
      iva += base * (it.iva_pct / 100);
    }
    return { subtotal: round2(subtotal), iva: round2(iva), total: round2(subtotal + iva) };
  }, [items]);

  const lineaTotal = (it: Item) =>
    round2(it.cantidad * it.precio_unitario * (1 - it.descuento_pct / 100) * (1 + it.iva_pct / 100));

  function guardar(estado: "borrador" | "emitida") {
    if (!cliente.trim()) { toast.error("Indica el cliente de la factura."); return; }
    if (items.some((it) => !it.descripcion.trim())) { toast.error("Cada línea necesita un concepto."); return; }
    startTransition(async () => {
      const res = await crearFactura({
        cliente_nombre: cliente,
        cliente_nif: nif || undefined,
        cliente_direccion: direccion || undefined,
        patient_id: pacienteId !== "none" ? pacienteId : undefined,
        fecha,
        vencimiento: vencimiento || undefined,
        forma_pago: formaPago,
        notas: notas || undefined,
        estado,
        items,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success(estado === "emitida" ? "Factura emitida" : "Borrador guardado");
      router.push(res.id ? `/facturacion/${res.id}` : "/facturacion");
      router.refresh();
    });
  }

  const inputMini = "h-9 w-full rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-sm tabular-nums outline-none focus:border-[var(--brand)]";

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Nueva factura</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" disabled={isPending} onClick={() => guardar("borrador")}>
            <FileEdit size={15} /> Guardar borrador
          </Button>
          <Button className="gap-1.5" disabled={isPending} onClick={() => guardar("emitida")}>
            <FileCheck2 size={15} /> {isPending ? "Guardando…" : "Emitir factura"}
          </Button>
        </div>
      </div>

      {/* Datos de cabecera */}
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-1">
            <Label>Contacto</Label>
            <Select value={pacienteId} onValueChange={elegirPaciente}>
              <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin vincular</SelectItem>
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellidos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Número de documento</Label>
            <Input value={numeroPreview} readOnly className="bg-[var(--surface-2)] tabular-nums" title="Se asigna automáticamente al emitir" />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <DatePicker value={fecha} onChange={setFecha} />
          </div>
          <div className="space-y-1.5">
            <Label>Vencimiento</Label>
            <DatePicker value={vencimiento} onChange={setVencimiento} clearable placeholder="Sin vencimiento" />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre o razón social" />
          </div>
          <div className="space-y-1.5">
            <Label>NIF / DNI</Label>
            <Input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="00000000X" />
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección fiscal" />
          </div>
        </div>
      </div>

      {/* Líneas */}
      <div className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">
              <th className="px-4 py-2.5">Concepto</th>
              <th className="w-20 px-2 py-2.5">Cant.</th>
              <th className="w-28 px-2 py-2.5">Precio</th>
              <th className="w-20 px-2 py-2.5">Dto. %</th>
              <th className="w-24 px-2 py-2.5">IVA</th>
              <th className="w-28 px-2 py-2.5 text-right">Total</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.map((it, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  <input
                    list="conceptos-clinicflow"
                    value={it.descripcion}
                    onChange={(e) => onDescripcion(i, e.target.value)}
                    placeholder="Escribe el concepto o elige un tratamiento…"
                    className="h-9 w-full rounded-[9px] border border-transparent bg-transparent px-2 text-sm outline-none transition-colors focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input type="number" min="0" step="0.5" value={it.cantidad} onChange={(e) => update(i, { cantidad: Number(e.target.value) })} className={inputMini} />
                </td>
                <td className="px-2 py-2">
                  <input type="number" min="0" step="0.01" value={it.precio_unitario} onChange={(e) => update(i, { precio_unitario: Number(e.target.value) })} className={inputMini} />
                </td>
                <td className="px-2 py-2">
                  <input type="number" min="0" max="100" value={it.descuento_pct} onChange={(e) => update(i, { descuento_pct: Number(e.target.value) })} className={inputMini} />
                </td>
                <td className="px-2 py-2">
                  <select value={it.iva_pct} onChange={(e) => update(i, { iva_pct: Number(e.target.value) })} className={inputMini}>
                    {IVAS.map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-right font-semibold tabular-nums text-[var(--text)]">{eur(lineaTotal(it))}</td>
                <td className="px-2 py-2">
                  <button onClick={() => removeItem(i)} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--error-tint)] hover:text-[var(--error)]" aria-label="Quitar línea">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="conceptos-clinicflow">
          {tratamientos.map((t) => <option key={t.nombre} value={t.nombre} />)}
        </datalist>
        <div className="border-t border-[var(--border)] px-4 py-2.5">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--brand)]" onClick={addItem}>
            <Plus size={14} /> Añadir línea
          </Button>
        </div>
      </div>

      {/* Pie: pago + notas + totales */}
      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        <div className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="space-y-1.5">
            <Label>Forma de pago</Label>
            <Select value={formaPago} onValueChange={setFormaPago}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMAS_PAGO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notas en el documento</Label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Condiciones, agradecimiento, información adicional…"
              className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            />
          </div>
        </div>
        <div className="h-fit space-y-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 text-sm shadow-[var(--shadow-card)]">
          <div className="flex justify-between text-[var(--text-soft)]"><span>Subtotal</span><span className="tabular-nums">{eur(totales.subtotal)}</span></div>
          <div className="flex justify-between text-[var(--text-soft)]"><span>IVA</span><span className="tabular-nums">{eur(totales.iva)}</span></div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2.5 font-display text-lg font-bold text-[var(--text)]">
            <span>Total</span><span className="tabular-nums">{eur(totales.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
