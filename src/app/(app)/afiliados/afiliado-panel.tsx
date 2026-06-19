"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Wallet, Users, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { actualizarDatosPago } from "@/app/actions/afiliados";

export interface Referido { id: string; plan: string; estado: string; comision: number; created_at: string }
export interface Payout { id: string; importe: number; estado: string; periodo: string; created_at: string }

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

const ESTADO: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-[var(--aviso-tint)] text-[var(--aviso)]" },
  confirmado: { label: "Confirmado", cls: "bg-[var(--exito-tint)] text-[var(--exito)]" },
  pagado: { label: "Pagado", cls: "bg-[var(--brand-tint)] text-[var(--brand-strong)]" },
  cancelado: { label: "Cancelado", cls: "bg-[var(--surface-2)] text-[var(--text-soft)]" },
};

export function AfiliadoPanel({ nombre, codigo, comisionPct, estado, metodoPago, cuentaPago, referidos, payouts }: {
  nombre: string; codigo: string; comisionPct: number; estado: string;
  metodoPago: string; cuentaPago: string; referidos: Referido[]; payouts: Payout[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [metodo, setMetodo] = useState(metodoPago || "transferencia");
  const [cuenta, setCuenta] = useState(cuentaPago);

  // El origin solo en cliente (evita mismatch de hidratación SSR/CSR).
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const enlace = `${origin}/signup?ref=${codigo}`;

  const confirmados = referidos.filter((r) => r.estado === "confirmado" || r.estado === "pagado");
  const generado = confirmados.reduce((s, r) => s + r.comision, 0);
  const pendientePago = referidos.filter((r) => r.estado === "confirmado").reduce((s, r) => s + r.comision, 0);
  const pagado = payouts.filter((p) => p.estado === "pagado").reduce((s, p) => s + p.importe, 0);

  function copiar() {
    navigator.clipboard.writeText(enlace);
    setCopied(true);
    toast.success("Enlace copiado.");
    setTimeout(() => setCopied(false), 1800);
  }

  function guardarPago() {
    startTransition(async () => {
      const res = await actualizarDatosPago({ metodo_pago: metodo, cuenta_pago: cuenta });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Datos de cobro actualizados.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">Programa de afiliados</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Hola {nombre} · comisión del <strong className="text-[var(--text)]">{comisionPct}%</strong> · estado <span className="capitalize">{estado}</span></p>
        </div>
      </div>

      {/* Enlace de referido */}
      <div className="rounded-[16px] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-tint)] to-transparent p-5">
        <Label className="mb-1.5 block text-[var(--text-soft)]">Tu enlace de afiliado</Label>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)]">{enlace}</code>
          <Button onClick={copiar} className="gap-1.5">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copiado" : "Copiar"}</Button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-soft)]">Comparte este enlace: cada clínica que se registre y se suscriba quedará asociada a ti automáticamente.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Users size={16} />} label="Referidos" value={String(referidos.length)} />
        <Kpi icon={<TrendingUp size={16} />} label="Comisión generada" value={eur(generado)} />
        <Kpi icon={<Clock size={16} />} label="Pendiente de pago" value={eur(pendientePago)} />
        <Kpi icon={<Wallet size={16} />} label="Cobrado" value={eur(pagado)} />
      </div>

      {/* Referidos */}
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--border)] px-5 py-3"><h2 className="text-sm font-bold text-[var(--text)]">Tus referidos</h2></div>
        {referidos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--text-soft)]">Todavía no tienes referidos. Comparte tu enlace para empezar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-soft)]">
                <th className="px-5 py-2.5 font-semibold">Fecha</th><th className="px-5 py-2.5 font-semibold">Plan</th>
                <th className="px-5 py-2.5 text-right font-semibold">Comisión</th><th className="px-5 py-2.5 font-semibold">Estado</th>
              </tr></thead>
              <tbody>
                {referidos.map((r) => {
                  const e = ESTADO[r.estado] ?? ESTADO.pendiente;
                  return (
                    <tr key={r.id} className="border-b border-[var(--border)]/60 last:border-0">
                      <td className="px-5 py-3 tabular-nums text-[var(--text-soft)]">{fecha(r.created_at)}</td>
                      <td className="px-5 py-3 text-[var(--text)]">{r.plan}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{eur(r.comision)}</td>
                      <td className="px-5 py-3"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", e.cls)}>{e.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Liquidaciones + datos de cobro */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">Liquidaciones</h2>
          {payouts.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--text-soft)]">Sin liquidaciones todavía.</p>
          ) : (
            <ul className="space-y-2">
              {payouts.map((p) => {
                const e = ESTADO[p.estado] ?? ESTADO.pendiente;
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] px-3 py-2">
                    <span className="font-mono text-xs text-[var(--text-soft)]">{p.periodo}</span>
                    <span className="flex-1 font-bold tabular-nums text-[var(--text)]">{eur(p.importe)}</span>
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", e.cls)}>{e.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">Datos de cobro</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Método</Label>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="h-10 w-full rounded-[12px] border border-[var(--lino)] bg-white px-3 text-sm text-[var(--tinta)] outline-none focus:border-[var(--oliva)]">
                <option value="transferencia">Transferencia (IBAN)</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{metodo === "paypal" ? "Email de PayPal" : "IBAN"}</Label>
              <Input value={cuenta} onChange={(e) => setCuenta(e.target.value)} placeholder={metodo === "paypal" ? "tu@paypal.com" : "ES00 0000 0000 0000 0000 0000"} />
            </div>
            <Button variant="outline" disabled={isPending} onClick={guardarPago}>{isPending ? "Guardando…" : "Guardar datos de cobro"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[var(--brand)]">{icon}<p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">{label}</p></div>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-[var(--text)]">{value}</p>
    </div>
  );
}
