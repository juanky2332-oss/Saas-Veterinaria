"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet, LockOpen, Lock, ArrowDownCircle, ArrowUpCircle, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { abrirCaja, cerrarCaja, registrarMovimiento } from "@/app/actions/gestion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Movimiento {
  id: string;
  fecha: string;
  tipo: string;
  concepto: string;
  metodo: string;
  importe: number;
  patient: { nombre: string; apellidos: string } | null;
}
interface Sesion {
  id: string;
  fecha: string;
  apertura: number;
  estado: string;
}

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const esIngreso = (t: string) => t === "ingreso" || t === "pago_cuenta";

export function CajaView({
  sesion,
  movimientos,
  pacientes,
}: {
  sesion: Sesion | null;
  movimientos: Movimiento[];
  pacientes: { value: string; label: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [apertura, setApertura] = useState("0");
  const [cierre, setCierre] = useState("");

  const totales = useMemo(() => {
    let ingresos = 0, gastos = 0;
    const porMetodo: Record<string, number> = {};
    for (const m of movimientos) {
      const imp = Number(m.importe);
      if (esIngreso(m.tipo)) { ingresos += imp; porMetodo[m.metodo] = (porMetodo[m.metodo] ?? 0) + imp; }
      else { gastos += imp; }
    }
    return { ingresos, gastos, neto: ingresos - gastos, porMetodo };
  }, [movimientos]);

  const efectivoEsperado = (sesion ? Number(sesion.apertura) : 0) + (totales.porMetodo["efectivo"] ?? 0);

  function abrir() {
    startTransition(async () => {
      const res = await abrirCaja(Number(apertura.replace(",", ".")) || 0);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Caja abierta.");
      router.refresh();
    });
  }
  function cerrar() {
    if (!sesion) return;
    startTransition(async () => {
      const res = await cerrarCaja(sesion.id, Number(cierre.replace(",", ".")) || 0);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Caja cerrada.");
      router.refresh();
    });
  }
  function nuevoMovimiento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registrarMovimiento(fd);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Movimiento registrado.");
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Caja</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">Ingresos del día, pagos a cuenta y cierre de caja.</p>
      </div>

      {/* Estado de caja */}
      {!sesion ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <Wallet size={20} className="text-[var(--text-soft)]" />
          <p className="text-sm text-[var(--text-soft)]">No hay caja abierta.</p>
          <div className="ml-auto flex items-center gap-2">
            <Input value={apertura} onChange={(e) => setApertura(e.target.value)} className="w-32" placeholder="Saldo inicial" inputMode="decimal" />
            <Button className="gap-1.5" disabled={pending} onClick={abrir}><LockOpen size={15} /> Abrir caja</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-4">
          <Kpi icon={<ArrowDownCircle size={15} />} label="Ingresos" value={eur(totales.ingresos)} tone="exito" />
          <Kpi icon={<ArrowUpCircle size={15} />} label="Gastos" value={eur(totales.gastos)} tone="error" />
          <Kpi icon={<HandCoins size={15} />} label="Neto del día" value={eur(totales.neto)} />
          <Kpi icon={<Wallet size={15} />} label="Efectivo esperado" value={eur(efectivoEsperado)} />
        </div>
      )}

      {sesion && (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* Movimientos */}
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
              Movimientos de hoy
            </div>
            {movimientos.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-soft)]">Sin movimientos todavía.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border)]/60 last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-[var(--text)]">{m.concepto}</p>
                        <p className="text-[11px] text-[var(--text-soft)]">
                          {new Date(m.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          {" · "}{m.metodo}{m.patient ? ` · ${m.patient.nombre} ${m.patient.apellidos}` : ""}
                        </p>
                      </td>
                      <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", esIngreso(m.tipo) ? "text-[var(--exito)]" : "text-[var(--error)]")}>
                        {esIngreso(m.tipo) ? "+" : "−"}{eur(Number(m.importe))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Form nuevo movimiento + cierre */}
          <div className="space-y-4">
            <form ref={formRef} onSubmit={nuevoMovimiento} className="space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-[var(--text)]">Nuevo movimiento</p>
              <select name="tipo" defaultValue="ingreso" className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm">
                <option value="ingreso">Ingreso</option>
                <option value="pago_cuenta">Pago a cuenta</option>
                <option value="gasto">Gasto / salida</option>
              </select>
              <Input name="concepto" placeholder="Concepto" required />
              <Input name="importe" placeholder="Importe (€)" inputMode="decimal" step="any" type="number" required />
              <select name="metodo" defaultValue="efectivo" className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm">
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="bizum">Bizum</option>
              </select>
              <select name="patient_id" defaultValue="" className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm">
                <option value="">Sin paciente</option>
                {pacientes.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <Button type="submit" className="w-full" disabled={pending}>Registrar</Button>
            </form>

            <div className="space-y-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-[var(--text)]">Cerrar caja</p>
              <Input value={cierre} onChange={(e) => setCierre(e.target.value)} placeholder="Efectivo contado" inputMode="decimal" />
              <Button variant="outline" className="w-full gap-1.5" disabled={pending} onClick={cerrar}>
                <Lock size={15} /> Cerrar caja del día
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "exito" | "error" }) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
        <span className={cn(tone === "exito" ? "text-[var(--exito)]" : tone === "error" ? "text-[var(--error)]" : "text-[var(--brand)]")}>{icon}</span>
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
