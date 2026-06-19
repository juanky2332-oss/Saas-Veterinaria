"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, CheckCircle2, Ban, FileCheck2, LayoutTemplate, ShieldCheck, Copy, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cambiarEstadoFactura, emitirFactura, guardarPlantilla, enviarVerifactu, rectificarFactura } from "@/app/actions/facturacion";
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
interface FacturaData {
  id: string;
  numero: string;
  fecha: string;
  vencimiento: string | null;
  estado: string;
  forma_pago: string | null;
  notas: string | null;
  cliente_nombre: string;
  cliente_nif: string | null;
  cliente_direccion: string | null;
  tipo: string;
  verifacti_estado: string | null;
  verifacti_qr: string | null;
  verifacti_url: string | null;
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
  emitida: { label: "Pendiente de cobro", cls: "bg-[var(--aviso-tint)] text-[var(--aviso)]" },
  pagada: { label: "Pagada", cls: "bg-[var(--exito-tint)] text-[var(--exito)]" },
  anulada: { label: "Anulada", cls: "bg-[var(--error-tint)] text-[var(--error)]" },
};

export function FacturaDoc({ factura, emisor, plantillaInicial }: {
  factura: FacturaData;
  emisor: Emisor;
  plantillaInicial: Plantilla;
}) {
  const router = useRouter();
  const [plantilla, setPlantilla] = useState<Plantilla>(plantillaInicial);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const estadoUi = ESTADO_LABEL[factura.estado] ?? ESTADO_LABEL.emitida;
  const esRectificativa = factura.tipo === "rectificativa";

  function cambiarPlantilla(p: Plantilla) {
    setPlantilla(p);
    startTransition(async () => {
      await guardarPlantilla(p);
    });
  }

  function accion(tipo: "emitir" | "pagada" | "anulada") {
    startTransition(async () => {
      const res = tipo === "emitir" ? await emitirFactura(factura.id) : await cambiarEstadoFactura(factura.id, tipo);
      if (res.error) { toast.error(res.error); return; }
      toast.success(tipo === "emitir" ? "Factura emitida" : tipo === "pagada" ? "Marcada como pagada" : "Factura anulada");
      router.refresh();
    });
  }

  function verifactu() {
    startTransition(async () => {
      const res = await enviarVerifactu(factura.id);
      if (res.error) { toast.error(res.error); setConfirmOpen(false); return; }
      toast.success(`Registrada (${res.estado}). QR generado.`);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  function rectificar() {
    startTransition(async () => {
      const res = await rectificarFactura(factura.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Rectificativa creada (borrador). Edítala y emítela.");
      if (res.id) router.push(`/facturacion/${res.id}`);
    });
  }

  const verifactado = Boolean(factura.verifacti_estado);

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="font-display text-xl font-bold text-[var(--text)]">Factura {factura.numero}</h1>
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
        {factura.estado === "borrador" && (
          <Button size="sm" className="gap-1.5" disabled={isPending} onClick={() => accion("emitir")}>
            <FileCheck2 size={14} /> Emitir
          </Button>
        )}
        {factura.estado === "emitida" && (
          <Button size="sm" variant="outline" className="gap-1.5" disabled={isPending} onClick={() => accion("pagada")}>
            <CheckCircle2 size={14} /> Marcar pagada
          </Button>
        )}
        {factura.estado !== "anulada" && factura.estado !== "borrador" && (
          <Button size="sm" variant="ghost" className="gap-1.5 text-[var(--error)] hover:bg-[var(--error-tint)]" disabled={isPending} onClick={() => accion("anulada")}>
            <Ban size={14} /> Anular
          </Button>
        )}
        {factura.estado !== "borrador" && !verifactado && (
          <Button size="sm" className="gap-1.5" disabled={isPending} onClick={() => setConfirmOpen(true)}>
            <ShieldCheck size={14} /> Aprobar y registrar
          </Button>
        )}
        {verifactado && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--exito-tint)] px-2.5 py-1 text-[11px] font-bold text-[var(--exito)]">
            <ShieldCheck size={13} /> Registrada: {factura.verifacti_estado}
          </span>
        )}
        {verifactado && !esRectificativa && factura.estado !== "anulada" && (
          <Button size="sm" variant="ghost" className="gap-1.5" disabled={isPending} onClick={rectificar}>
            <Copy size={14} /> Rectificar
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
          <Printer size={14} /> Imprimir / PDF
        </Button>
      </div>

      {/* Documento (proporción A4) */}
      <div className="print-area mx-auto w-full max-w-[794px]">
        <Documento factura={factura} emisor={emisor} plantilla={plantilla} />
      </div>

      {/* Modal de aprobación (antes de registrar ante la AEAT) */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm print:hidden" onClick={() => !isPending && setConfirmOpen(false)}>
          <div className="w-full max-w-md rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-pop)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--text)]">
                <ShieldCheck size={18} className="text-[var(--brand)]" /> Aprobar y registrar
              </h2>
              <button onClick={() => setConfirmOpen(false)} disabled={isPending} className="text-[var(--text-soft)] hover:text-[var(--text)]" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <p className="mb-3 text-sm text-[var(--text-soft)]">
              Vas a registrar esta {esRectificativa ? "factura rectificativa" : "factura"} ante la AEAT. Una vez registrada se genera el QR y <strong className="text-[var(--text)]">no podrá modificarse</strong> (deberás emitir una rectificativa). Revisa los datos:
            </p>
            <div className="space-y-1.5 rounded-[12px] bg-[var(--surface-2)] p-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-soft)]">Número</span><span className="font-semibold tabular-nums">{factura.numero}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-soft)]">Cliente</span><span className="font-semibold">{factura.cliente_nombre}</span></div>
              {factura.cliente_nif && <div className="flex justify-between"><span className="text-[var(--text-soft)]">NIF</span><span className="tabular-nums">{factura.cliente_nif}</span></div>}
              <div className="flex justify-between border-t border-[var(--border)] pt-1.5 text-base font-bold"><span>Total</span><span className="tabular-nums">{eur(factura.total)}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1 gap-1.5" disabled={isPending} onClick={verifactu}>
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {isPending ? "Registrando…" : "Confirmar y registrar"}
              </Button>
              <Button variant="outline" disabled={isPending} onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Documento (plantillas) ───────────────────── */

function Documento({ factura, emisor, plantilla }: { factura: FacturaData; emisor: Emisor; plantilla: Plantilla }) {
  const anulada = factura.estado === "anulada";
  const pagada = factura.estado === "pagada";
  const borrador = factura.estado === "borrador";

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
      {(anulada || pagada || borrador) && (
        <div
          className="pointer-events-none absolute right-6 top-24 rotate-[-14deg] rounded-[8px] border-4 px-4 py-1.5 text-2xl font-black uppercase tracking-widest opacity-25"
          style={{ borderColor: anulada ? "#dc5146" : pagada ? "#15a37a" : "#94a3b8", color: anulada ? "#dc5146" : pagada ? "#15a37a" : "#94a3b8" }}
        >
          {anulada ? "Anulada" : pagada ? "Pagada" : "Borrador"}
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
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Factura</p>
            <p className="text-2xl font-black tabular-nums">{factura.numero}</p>
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
              <p className="text-sm uppercase tracking-[0.25em] text-[#5a6675]">Factura</p>
              <p className="text-2xl font-bold tabular-nums">{factura.numero}</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#7a8694]">Factura</p>
              <p className="text-xl font-bold tabular-nums">{factura.numero}</p>
            </div>
          </div>
        </div>
      )}

      {/* Datos cliente + fechas */}
      <div className={cn("grid gap-6 px-8 py-6 sm:grid-cols-2", plantilla === "minimal" && "pt-6")}>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a8694]">Facturar a</p>
          <p className="font-bold">{factura.cliente_nombre}</p>
          {factura.cliente_nif && <p className="text-sm text-[#5a6675]">{factura.cliente_nif}</p>}
          {factura.cliente_direccion && <p className="text-sm text-[#5a6675]">{factura.cliente_direccion}</p>}
        </div>
        <div className="sm:text-right">
          <div className="inline-grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span className="text-[#7a8694]">Fecha</span>
            <span className="font-semibold tabular-nums">{fmtFecha(factura.fecha)}</span>
            <span className="text-[#7a8694]">Vencimiento</span>
            <span className="font-semibold tabular-nums">{fmtFecha(factura.vencimiento)}</span>
            {factura.forma_pago && (
              <>
                <span className="text-[#7a8694]">Forma de pago</span>
                <span className="font-semibold">{factura.forma_pago}</span>
              </>
            )}
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
            {factura.items.map((it) => (
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
          <div className="flex justify-between text-[#5a6675]"><span>Base imponible</span><span className="tabular-nums">{eur(factura.subtotal)}</span></div>
          <div className="flex justify-between text-[#5a6675]"><span>IVA</span><span className="tabular-nums">{eur(factura.iva_total)}</span></div>
          <div
            className={cn("flex justify-between rounded-[10px] px-3 py-2 text-base font-black", plantilla === "clasica" && "border-t-2 border-[#1d2733] rounded-none px-0")}
            style={plantilla !== "clasica" ? { background: `${color}14`, color } : undefined}
          >
            <span>Total</span><span className="tabular-nums">{eur(factura.total)}</span>
          </div>
        </div>
      </div>

      {/* QR Verifactu (sistema de facturación verificable AEAT) */}
      {factura.verifacti_qr && (
        <div className="mx-8 mb-2 flex items-center gap-4 rounded-[10px] border border-[#e8edf2] bg-[#fafbfc] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${factura.verifacti_qr}`}
            alt="QR Verifactu"
            className="h-24 w-24 shrink-0 rounded-[6px] border border-[#e8edf2] bg-white"
          />
          <div className="text-[11px] leading-relaxed text-[#5a6675]">
            <p className="font-bold text-[#1d2733]">Factura verificable — VERI*FACTU</p>
            <p>Sistema de emisión de facturas verificables conforme al RD 1007/2023 (AEAT).</p>
            {factura.verifacti_url && (
              <p className="mt-1 break-all text-[#7a8694]">{factura.verifacti_url}</p>
            )}
          </div>
        </div>
      )}

      {/* Notas */}
      {factura.notas && (
        <div className="px-8">
          <p className="whitespace-pre-wrap text-sm text-[#5a6675]">{factura.notas}</p>
        </div>
      )}

      {/* Pie configurable (al fondo de la página A4) */}
      <div className={cn("mt-auto px-8 pb-7 pt-5", plantilla === "clasica" && "border-t border-[#1d2733]/20")}
        style={plantilla !== "clasica" ? { borderTop: `2px solid ${color}22` } : undefined}>
        {emisor.pie && <p className="mb-1.5 whitespace-pre-wrap text-xs text-[#5a6675]">{emisor.pie}</p>}
        <p className="text-[10.5px] text-[#9aa6b2]">
          {factura.estado === "borrador" ? "Borrador sin validez fiscal." : ""}
        </p>
      </div>
    </div>
  );
}
