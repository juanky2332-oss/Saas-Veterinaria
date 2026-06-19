"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Banknote, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EstadoBadge } from "../_components/ui";
import { actualizarAfiliado, cambiarEstadoReferido, liquidarComisiones, marcarPayoutPagado } from "@/app/actions/superadmin";

export interface AfiliadoAdmin { id: string; nombre: string; email: string; codigo: string; comision_pct: number; estado: string; created_at: string }
export interface ReferidoAdmin { id: string; affiliate_id: string; organizacion: string; plan: string; estado: string; comision: number; created_at: string }
export interface PayoutAdmin { id: string; affiliate_id: string; importe: number; estado: string; periodo: string; created_at: string }

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

export function AfiliadosAdmin({ afiliados, referidos, payouts }: { afiliados: AfiliadoAdmin[]; referidos: ReferidoAdmin[]; payouts: PayoutAdmin[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState<string | null>(null);

  const refsPorAf = useMemo(() => {
    const m = new Map<string, ReferidoAdmin[]>();
    for (const r of referidos) { const a = m.get(r.affiliate_id) ?? []; a.push(r); m.set(r.affiliate_id, a); }
    return m;
  }, [referidos]);
  const paysPorAf = useMemo(() => {
    const m = new Map<string, PayoutAdmin[]>();
    for (const p of payouts) { const a = m.get(p.affiliate_id) ?? []; a.push(p); m.set(p.affiliate_id, a); }
    return m;
  }, [payouts]);

  function accion(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) { toast.error(res.error); return; }
      toast.success(ok);
      router.refresh();
    });
  }

  if (afiliados.length === 0) {
    return <div className="rounded-[14px] border border-white/10 bg-white/[0.03] py-12 text-center text-sm text-white/45">Aún no hay afiliados registrados.</div>;
  }

  return (
    <div className="space-y-3">
      {afiliados.map((a) => {
        const refs = refsPorAf.get(a.id) ?? [];
        const pays = paysPorAf.get(a.id) ?? [];
        const confirmadasPend = refs.filter((r) => r.estado === "confirmado").reduce((s, r) => s + r.comision, 0);
        const totalGenerado = refs.filter((r) => r.estado === "confirmado" || r.estado === "pagado").reduce((s, r) => s + r.comision, 0);
        const open = abierto === a.id;
        return (
          <div key={a.id} className="overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.03]">
            <button onClick={() => setAbierto(open ? null : a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]">
              {open ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{a.nombre}</p>
                <p className="truncate text-xs text-white/45">{a.email} · código <span className="font-mono text-indigo-300">{a.codigo}</span></p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-white/45">{refs.length} referidos · {a.comision_pct}%</p>
                <p className="text-sm font-bold tabular-nums text-white">{eur(totalGenerado)}</p>
              </div>
              <EstadoBadge estado={a.estado} />
            </button>

            {open && (
              <div className="border-t border-white/10 px-4 py-4">
                {/* Controles del afiliado */}
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <label className="text-xs text-white/55">
                    <span className="mb-1 block font-semibold uppercase tracking-wide text-white/40">Comisión %</span>
                    <input
                      type="number" min={0} max={100} defaultValue={a.comision_pct}
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== a.comision_pct) accion(() => actualizarAfiliado(a.id, { comision_pct: v }), "Comisión actualizada."); }}
                      className="h-9 w-24 rounded-[8px] border border-white/10 bg-white/[0.04] px-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
                    />
                  </label>
                  <label className="text-xs text-white/55">
                    <span className="mb-1 block font-semibold uppercase tracking-wide text-white/40">Estado</span>
                    <select
                      defaultValue={a.estado}
                      onChange={(e) => accion(() => actualizarAfiliado(a.id, { estado: e.target.value }), "Estado actualizado.")}
                      className="h-9 rounded-[8px] border border-white/10 bg-white/[0.04] px-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
                    >
                      {["activo", "pausado", "baja"].map((x) => <option key={x} value={x} className="bg-[#0f1729]">{x}</option>)}
                    </select>
                  </label>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${a.codigo}`); toast.success("Enlace de afiliado copiado."); }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/70 hover:text-white"
                  >
                    <Copy size={13} /> Copiar enlace
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => accion(async () => { const r = await liquidarComisiones(a.id); if (!r.error) toast.success(`Liquidación creada: ${eur(r.importe ?? 0)}`); return r; }, "Comisiones liquidadas.")}
                    disabled={isPending || confirmadasPend <= 0}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-emerald-500/90 px-3 text-xs font-bold text-white hover:bg-emerald-400 disabled:opacity-40"
                  >
                    <Banknote size={14} /> Liquidar {eur(confirmadasPend)}
                  </button>
                </div>

                {/* Referidos */}
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">Referidos ({refs.length})</p>
                {refs.length === 0 ? (
                  <p className="py-3 text-sm text-white/40">Sin referidos todavía.</p>
                ) : (
                  <div className="overflow-x-auto rounded-[10px] border border-white/[0.06]">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead><tr className="border-b border-white/[0.06] text-left text-[10.5px] uppercase text-white/40">
                        <th className="px-3 py-2 font-semibold">Clínica</th><th className="px-3 py-2 font-semibold">Plan</th>
                        <th className="px-3 py-2 font-semibold">Fecha</th><th className="px-3 py-2 text-right font-semibold">Comisión</th>
                        <th className="px-3 py-2 font-semibold">Estado</th><th className="px-3 py-2" />
                      </tr></thead>
                      <tbody>
                        {refs.map((r) => (
                          <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                            <td className="px-3 py-2 text-white/80">{r.organizacion}</td>
                            <td className="px-3 py-2 text-white/60">{r.plan}</td>
                            <td className="px-3 py-2 tabular-nums text-white/50">{fecha(r.created_at)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-white/80">{eur(r.comision)}</td>
                            <td className="px-3 py-2"><EstadoBadge estado={r.estado} /></td>
                            <td className="px-3 py-2 text-right">
                              {r.estado === "pendiente" && (
                                <span className="inline-flex gap-1">
                                  <button title="Confirmar" onClick={() => accion(() => cambiarEstadoReferido(r.id, "confirmado"), "Referido confirmado.")} disabled={isPending} className="rounded p-1 text-emerald-300 hover:bg-emerald-500/15"><CheckCircle2 size={15} /></button>
                                  <button title="Cancelar" onClick={() => accion(() => cambiarEstadoReferido(r.id, "cancelado"), "Referido cancelado.")} disabled={isPending} className="rounded p-1 text-rose-300 hover:bg-rose-500/15"><XCircle size={15} /></button>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagos */}
                {pays.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-white/40">Liquidaciones</p>
                    <ul className="space-y-1.5">
                      {pays.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 rounded-[10px] border border-white/[0.06] px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-white/45">{p.periodo}</span>
                          <span className="flex-1 font-bold tabular-nums text-white">{eur(p.importe)}</span>
                          <EstadoBadge estado={p.estado} />
                          {p.estado === "pendiente" && (
                            <button onClick={() => accion(() => marcarPayoutPagado(p.id), "Pago marcado como pagado.")} disabled={isPending} className="rounded-[7px] bg-indigo-500/90 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-400">
                              Marcar pagado
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
