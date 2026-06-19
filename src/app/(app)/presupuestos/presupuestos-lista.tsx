"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, CheckCircle2, XCircle, FileUp, Trash2, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cambiarEstadoPresupuesto, convertirEnFactura, eliminarPresupuesto } from "@/app/actions/presupuestos";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Quote {
  id: string;
  numero: string;
  cliente_nombre: string;
  fecha: string;
  validez: string | null;
  estado: string;
  total: number;
  invoice_id: string | null;
}

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const fecha = (s: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("es-ES") : "—");

const ESTADO: Record<string, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "bg-[var(--surface-2)] text-[var(--text-soft)]" },
  enviado: { label: "Enviado", cls: "bg-[var(--aviso-tint)] text-[var(--aviso)]" },
  aceptado: { label: "Aceptado", cls: "bg-[var(--exito-tint)] text-[var(--exito)]" },
  rechazado: { label: "Rechazado", cls: "bg-[var(--error-tint)] text-[var(--error)]" },
  facturado: { label: "Facturado", cls: "bg-[var(--brand-tint)] text-[var(--brand-strong)]" },
};

export function PresupuestosLista({ rows }: { rows: Quote[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function estado(id: string, e: "enviado" | "aceptado" | "rechazado") {
    startTransition(async () => {
      const res = await cambiarEstadoPresupuesto(id, e);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Presupuesto actualizado.");
      router.refresh();
    });
  }
  function convertir(id: string) {
    startTransition(async () => {
      const res = await convertirEnFactura(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Presupuesto convertido en factura.");
      if (res.invoiceId) router.push(`/facturacion/${res.invoiceId}`);
      else router.refresh();
    });
  }
  function borrar(id: string) {
    startTransition(async () => {
      const res = await eliminarPresupuesto(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Presupuesto eliminado.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Presupuestos</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Presupuestos previos; conviértelos en factura con un clic.</p>
        </div>
        <Link href="/presupuestos/nuevo">
          <Button className="gap-1.5"><Plus size={15} /> Nuevo presupuesto</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-card)]">
          <FileText size={26} className="mx-auto mb-2 text-[var(--brand-soft)]" />
          <p className="text-sm text-[var(--text-soft)]">Aún no hay presupuestos. Crea el primero.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-soft)]">
                <th className="px-4 py-3 font-semibold">Número</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Válido</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const e = ESTADO[q.estado] ?? ESTADO.borrador;
                const facturado = q.estado === "facturado";
                return (
                  <tr key={q.id} className="border-b border-[var(--border)]/60 last:border-0">
                    <td className="px-4 py-3 font-semibold tabular-nums text-[var(--text)]">{q.numero}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{q.cliente_nombre}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-soft)]">{fecha(q.fecha)}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-soft)]">{fecha(q.validez)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{eur(Number(q.total))}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", e.cls)}>{e.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/presupuestos/${q.id}`} title="Ver documento" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--brand)]">
                          <Eye size={14} />
                        </Link>
                        {q.estado === "borrador" && (
                          <IconBtn title="Marcar enviado" onClick={() => estado(q.id, "enviado")} disabled={pending}><Send size={14} /></IconBtn>
                        )}
                        {(q.estado === "enviado" || q.estado === "borrador") && (
                          <>
                            <IconBtn title="Aceptar" onClick={() => estado(q.id, "aceptado")} disabled={pending} className="hover:text-[var(--exito)]"><CheckCircle2 size={14} /></IconBtn>
                            <IconBtn title="Rechazar" onClick={() => estado(q.id, "rechazado")} disabled={pending} className="hover:text-[var(--error)]"><XCircle size={14} /></IconBtn>
                          </>
                        )}
                        {facturado && q.invoice_id ? (
                          <Link href={`/facturacion/${q.invoice_id}`} className="text-xs font-semibold text-[var(--brand)] hover:underline">Ver factura</Link>
                        ) : (
                          <IconBtn title="Convertir en factura" onClick={() => convertir(q.id)} disabled={pending} className="hover:text-[var(--brand)]"><FileUp size={14} /></IconBtn>
                        )}
                        {!facturado && (
                          <IconBtn title="Eliminar" onClick={() => borrar(q.id)} disabled={pending} className="hover:text-[var(--error)]"><Trash2 size={14} /></IconBtn>
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
    </div>
  );
}

function IconBtn({ children, title, onClick, disabled, className }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={cn("flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-2)]", className)}>
      {children}
    </button>
  );
}
