"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, Send, CheckCircle2, XCircle, FileUp, LayoutTemplate, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cambiarEstadoPresupuesto, convertirEnFactura } from "@/app/actions/presupuestos";
import { guardarPlantilla } from "@/app/actions/facturacion";
import { toast } from "sonner";

interface ItemDoc {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  iva_pct: number;
  importe: number;
}
interface PresupuestoData {
  id: string;
  numero: string;
  fecha: string;
  validez: string | null;
  estado: string;
  notas: string | null;
  cliente_nombre: string;
  cliente_nif: string | null;
  cliente_direccion: string | null;
  invoice_id: string | null;
  subtotal: number;
  iva_total: number;
  total: number;
  items: ItemDoc[];
}
interface Emisor {
  nombre: string;
  nif: string | null;
  direccion: string | null;
  logoUrl: string | null;
  brandColor: string;
  pie: string | null;
}

type Plantilla = "moderna" | "clasica" | "minimal";

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const fmtFecha = (iso: string | null) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

const PLANTILLAS: { id: Plantilla; label: string }[] = [
  { id: "moderna", label: "Moderna" },
  { id: "clasica", label: "Clásica" },
  { id: "minimal", label: "Minimal" },
];

const ESTADO_LABEL: Record<string, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "bg-[var(--surface-2)] text-[var(--text-soft)]" },
  enviado: { label: "Enviado", cls: "bg-[var(--aviso-tint)] text-[var(--aviso)]" },
  aceptado: { label: "Aceptado", cls: "bg-[var(--exito-tint)] text-[var(--exito)]" },
  rechazado: { label: "Rechazado", cls: "bg-[var(--error-tint)] text-[var(--error)]" },
  facturado: { label: "Facturado", cls: "bg-[var(--brand-tint)] text-[var(--brand-strong)]" },
};

export function PresupuestoDoc({ presupuesto, emisor, plantillaInicial }: {
  presupuesto: PresupuestoData;
  emisor: Emisor;
  plantillaInicial: Plantilla;
}) {
  const router = useRouter();
  const [plantilla, setPlantilla] = useState<Plantilla>(plantillaInicial);
  const [isPending, startTransition] = useTransition();
  const estadoUi = ESTADO_LABEL[presupuesto.estado] ?? ESTADO_LABEL.borrador;
  const facturado = presupuesto.estado === "facturado";

  function cambiarPlantilla(p: Plantilla) {
    setPlantilla(p);
    startTransition(async () => {
      await guardarPlantilla(p);
    });
  }

  function estado(e: "enviado" | "aceptado" | "rechazado") {
    startTransition(async () => {
      const res = await cambiarEstadoPresupuesto(presupuesto.id, e);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Presupuesto actualizado.");
      router.refresh();
    });
  }

  function convertir() {
    startTransition(async () => {
      const res = await convertirEnFactura(presupuesto.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Presupuesto convertido en factura.");
      if (res.invoiceId) router.push(`/facturacion/${res.invoiceId}`);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="font-display text-xl font-bold text-[var(--text)]">Presupuesto {presupuesto.numero}</h1>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", estadoUi.cls)}>{estadoUi.label}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1">
          <LayoutTemplate size={14} className="ml-1.5 text-[var(--text-soft)]" />
          {PLANTILLAS.map((p) => (
            <button
              key={p.id}
              onClick={() => cambiarPlantilla(p.id)}
              className={cn(
                "rounded-[7px] px-2.5 py-1 text-xs font-semibold transition-colors",
                plantilla === p.id ? "bg-[var(--brand)] text-white" : "text-[var(--text-soft)] hover:bg-[var(--surface-2)]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {presupuesto.estado === "borrador" && (
          <Button size="sm" variant="outline" className="gap-1.5" disabled={isPending} onClick={() => estado("enviado")}>
            <Send size={14} /> Marcar enviado
          </Button>
        )}
        {(presupuesto.estado === "enviado" || presupuesto.estado === "borrador") && (
          <>
            <Button size="sm" variant="outline" className="gap-1.5 text-[var(--exito)]" disabled={isPending} onClick={() => estado("aceptado")}>
              <CheckCircle2 size={14} /> Aceptar
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-[var(--error)] hover:bg-[var(--error-tint)]" disabled={isPending} onClick={() => estado("rechazado")}>
              <XCircle size={14} /> Rechazar
            </Button>
          </>
        )}
        {facturado && presupuesto.invoice_id ? (
          <Button size="sm" className="gap-1.5" onClick={() => router.push(`/facturacion/${presupuesto.invoice_id}`)}>
            <FileUp size={14} /> Ver factura
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5" disabled={isPending} onClick={convertir}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} Convertir en factura
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
          <Printer size={14} /> Imprimir / PDF
        </Button>
      </div>

      {/* Documento (proporción A4) */}
      <div className="print-area mx-auto w-full max-w-[794px]">
        <Documento presupuesto={presupuesto} emisor={emisor} plantilla={plantilla} />
      </div>
    </div>
  );
}

/* ───────────────────── Documento (plantillas) ───────────────────── */

function Documento({ presupuesto, emisor, plantilla }: { presupuesto: PresupuestoData; emisor: Emisor; plantilla: Plantilla }) {
  const rechazado = presupuesto.estado === "rechazado";
  const aceptado = presupuesto.estado === "aceptado" || presupuesto.estado === "facturado";

  const serif = plantilla === "clasica";
  const color = emisor.brandColor;

  return (
    <div
      className={cn(
        "relative flex min-h-[1123px] flex-col overflow-hidden rounded-[14px] border bg-white text-[#1d2733] shadow-[var(--shadow-card)] print:min-h-screen print:rounded-none print:border-0 print:shadow-none",
        plantilla === "clasica" ? "border-[#1d2733]/30" : "border-[var(--border)]",
      )}
      style={serif ? { fontFamily: "Georgia, 'Times New Roman', serif" } : undefined}
    >
      {/* Sello de estado */}
      {(rechazado || aceptado) && (
        <div
          className="pointer-events-none absolute right-6 top-24 rotate-[-14deg] rounded-[8px] border-4 px-4 py-1.5 text-2xl font-black uppercase tracking-widest opacity-25"
          style={{ borderColor: rechazado ? "#dc5146" : "#15a37a", color: rechazado ? "#dc5146" : "#15a37a" }}
        >
          {rechazado ? "Rechazado" : "Aceptado"}
        </div>
      )}

      {/* Cabecera según plantilla */}
      {plantilla === "moderna" && (
        <div className="flex items-start justify-between px-8 py-6 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <div className="flex items-center gap-3">
            {emisor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={emisor.logoUrl} alt="" className="h-12 w-12 rounded-[10px] bg-white/10 object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white/15 text-xl font-bold">
                {emisor.nombre.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-lg font-bold leading-tight">{emisor.nombre}</p>
              {emisor.nif && <p className="text-xs text-white/80">{emisor.nif}</p>}
              {emisor.direccion && <p className="text-xs text-white/80">{emisor.direccion}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Presupuesto</p>
            <p className="text-2xl font-black tabular-nums">{presupuesto.numero}</p>
          </div>
        </div>
      )}

      {plantilla === "clasica" && (
        <div className="border-b-4 border-double px-8 py-6" style={{ borderColor: "#1d2733" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {emisor.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={emisor.logoUrl} alt="" className="h-14 w-14 rounded-[8px] object-cover" />
              )}
              <div>
                <p className="text-xl font-bold">{emisor.nombre}</p>
                {emisor.nif && <p className="text-sm text-[#5a6675]">NIF: {emisor.nif}</p>}
                {emisor.direccion && <p className="text-sm text-[#5a6675]">{emisor.direccion}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm uppercase tracking-[0.25em] text-[#5a6675]">Presupuesto</p>
              <p className="text-2xl font-bold tabular-nums">{presupuesto.numero}</p>
            </div>
          </div>
        </div>
      )}

      {plantilla === "minimal" && (
        <div className="px-8 pt-8">
          <div className="h-1 w-12 rounded-full" style={{ background: color }} />
          <div className="mt-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {emisor.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={emisor.logoUrl} alt="" className="h-10 w-10 rounded-[8px] object-cover" />
              )}
              <div>
                <p className="font-bold">{emisor.nombre}</p>
                <p className="text-xs text-[#7a8694]">{[emisor.nif, emisor.direccion].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#7a8694]">Presupuesto</p>
              <p className="text-xl font-bold tabular-nums">{presupuesto.numero}</p>
            </div>
          </div>
        </div>
      )}

      {/* Datos cliente + fechas */}
      <div className={cn("grid gap-6 px-8 py-6 sm:grid-cols-2", plantilla === "minimal" && "pt-6")}>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a8694]">Presupuesto para</p>
          <p className="font-bold">{presupuesto.cliente_nombre}</p>
          {presupuesto.cliente_nif && <p className="text-sm text-[#5a6675]">{presupuesto.cliente_nif}</p>}
          {presupuesto.cliente_direccion && <p className="text-sm text-[#5a6675]">{presupuesto.cliente_direccion}</p>}
        </div>
        <div className="sm:text-right">
          <div className="inline-grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span className="text-[#7a8694]">Fecha</span>
            <span className="font-semibold tabular-nums">{fmtFecha(presupuesto.fecha)}</span>
            <span className="text-[#7a8694]">Válido hasta</span>
            <span className="font-semibold tabular-nums">{fmtFecha(presupuesto.validez)}</span>
          </div>
        </div>
      </div>

      {/* Tabla de líneas */}
      <div className="px-8">
        <table className="w-full text-sm">
          <thead>
            <tr
              className={cn("text-left text-[10.5px] font-bold uppercase tracking-wider", plantilla === "clasica" ? "border-y-2 border-[#1d2733] text-[#1d2733]" : "text-[#7a8694]")}
              style={plantilla === "moderna" ? { background: `${color}14` } : undefined}
            >
              <th className="rounded-l-[8px] px-3 py-2.5">Concepto</th>
              <th className="px-3 py-2.5 text-right">Cant.</th>
              <th className="px-3 py-2.5 text-right">Precio</th>
              <th className="px-3 py-2.5 text-right">Dto.</th>
              <th className="px-3 py-2.5 text-right">IVA</th>
              <th className="rounded-r-[8px] px-3 py-2.5 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className={plantilla === "clasica" ? "divide-y divide-[#1d2733]/15" : "divide-y divide-[#e8edf2]"}>
            {presupuesto.items.map((it) => (
              <tr key={it.id}>
                <td className="px-3 py-3 font-medium">{it.descripcion}</td>
                <td className="px-3 py-3 text-right tabular-nums">{it.cantidad}</td>
                <td className="px-3 py-3 text-right tabular-nums">{eur(it.precio_unitario)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{it.descuento_pct > 0 ? `${it.descuento_pct}%` : "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{it.iva_pct}%</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{eur(it.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-end px-8 py-6">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-[#5a6675]"><span>Base imponible</span><span className="tabular-nums">{eur(presupuesto.subtotal)}</span></div>
          <div className="flex justify-between text-[#5a6675]"><span>IVA</span><span className="tabular-nums">{eur(presupuesto.iva_total)}</span></div>
          <div
            className={cn("flex justify-between rounded-[10px] px-3 py-2 text-base font-black", plantilla === "clasica" && "border-t-2 border-[#1d2733] rounded-none px-0")}
            style={plantilla !== "clasica" ? { background: `${color}14`, color } : undefined}
          >
            <span>Total</span><span className="tabular-nums">{eur(presupuesto.total)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {presupuesto.notas && (
        <div className="px-8">
          <p className="whitespace-pre-wrap text-sm text-[#5a6675]">{presupuesto.notas}</p>
        </div>
      )}

      {/* Pie configurable (al fondo de la página A4) */}
      <div className={cn("mt-auto px-8 pb-7 pt-5", plantilla === "clasica" && "border-t border-[#1d2733]/20")}
        style={plantilla !== "clasica" ? { borderTop: `2px solid ${color}22` } : undefined}>
        {emisor.pie && <p className="mb-1.5 whitespace-pre-wrap text-xs text-[#5a6675]">{emisor.pie}</p>}
        <p className="text-[10.5px] text-[#9aa6b2]">
          Presupuesto sin validez fiscal. La aceptación de este presupuesto no constituye factura.
        </p>
      </div>
    </div>
  );
}
