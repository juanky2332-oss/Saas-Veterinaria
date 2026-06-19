"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aprovisionarVerifacti, toggleVerifacti } from "@/app/actions/facturacion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Regimen = "verifactu" | "ticketbai";
type Territorio = "araba" | "bizkaia" | "gipuzkoa";

interface Props {
  conectado: boolean;
  nifConectado: string | null;
  regimenConectado: Regimen | null;
  nifFiscal: string | null;
  razonSocial: string | null;
  activo: boolean;
  modoLive: boolean;
}

const TERRITORIOS: { value: Territorio; label: string }[] = [
  { value: "araba", label: "Álava / Araba" },
  { value: "bizkaia", label: "Bizkaia" },
  { value: "gipuzkoa", label: "Gipuzkoa" },
];

export function VerifactuClient({ conectado, nifConectado, regimenConectado, nifFiscal, razonSocial, activo: activoIni, modoLive }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activo, setActivo] = useState(activoIni);
  const [regimen, setRegimen] = useState<Regimen>("verifactu");
  const [territorio, setTerritorio] = useState<Territorio>("bizkaia");
  const [nif1, setNif1] = useState("");
  const [nif2, setNif2] = useState("");

  const norm = (s: string) => s.trim().toUpperCase().replace(/[\s-]/g, "");
  const nifObjetivo = norm(nifFiscal ?? "");
  const nifIntroducido = norm(nif1);
  const coincide = nifIntroducido !== "" && nifIntroducido === norm(nif2);
  const nifOk = coincide && nifIntroducido === nifObjetivo;

  function activar() {
    if (!nifOk) {
      toast.error(nifIntroducido && !coincide ? "Los dos NIF no coinciden." : "Introduce y confirma tu NIF fiscal para activar.");
      return;
    }
    startTransition(async () => {
      const res = await aprovisionarVerifacti({ regimen, territorio: regimen === "ticketbai" ? territorio : undefined });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`${res.regimen === "ticketbai" ? "TicketBAI" : "Verifactu"} activado para el NIF ${res.nif}.`);
      setActivo(true);
      router.refresh();
    });
  }

  function toggle(next: boolean) {
    setActivo(next);
    startTransition(async () => {
      const res = await toggleVerifacti(next);
      if (res.error) { toast.error(res.error); setActivo(!next); return; }
      toast.success(next ? "Envío automático activado." : "Envío automático pausado.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={17} className="text-[var(--brand)]" />
          <h2 className="font-display font-semibold text-[var(--text)]">Estado de la conexión</h2>
        </div>

        {!modoLive && (
          <p className="mb-4 rounded-[10px] bg-[var(--aviso-tint)] px-3 py-2 text-xs text-[var(--aviso)]">
            Modo demostración: la activación y el registro se simulan. En producción se conecta con Verifacti real.
          </p>
        )}

        {/* Estado */}
        {conectado ? (
          <div className="flex items-center gap-3 rounded-[12px] bg-[var(--exito-tint)] px-4 py-3">
            <CheckCircle2 size={20} className="text-[var(--exito)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {regimenConectado === "ticketbai" ? "TicketBAI" : "Verifactu"} conectado
              </p>
              <p className="text-xs text-[var(--text-soft)]">NIF registrado: <span className="font-mono">{nifConectado ?? nifFiscal}</span></p>
            </div>
          </div>
        ) : nifFiscal ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-[12px] bg-[var(--surface-2)] px-4 py-3">
              <AlertTriangle size={20} className="text-[var(--aviso)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Aún no conectado</p>
                <p className="text-xs text-[var(--text-soft)]">Vamos a registrar tu NIF <span className="font-mono">{nifFiscal}</span>{razonSocial ? ` (${razonSocial})` : ""}.</p>
              </div>
            </div>

            {/* Sistema fiscal */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-soft)]">Sistema fiscal</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button" onClick={() => setRegimen("verifactu")}
                  className={cn("rounded-[12px] border p-3 text-left transition-colors", regimen === "verifactu" ? "border-[var(--brand)] bg-[var(--brand-tint)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]")}
                >
                  <p className="text-sm font-semibold text-[var(--text)]">Verifactu</p>
                  <p className="text-[11px] text-[var(--text-soft)]">Territorio común (AEAT)</p>
                </button>
                <button
                  type="button" onClick={() => setRegimen("ticketbai")}
                  className={cn("rounded-[12px] border p-3 text-left transition-colors", regimen === "ticketbai" ? "border-[var(--brand)] bg-[var(--brand-tint)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]")}
                >
                  <p className="text-sm font-semibold text-[var(--text)]">TicketBAI</p>
                  <p className="text-[11px] text-[var(--text-soft)]">País Vasco (Hacienda Foral)</p>
                </button>
              </div>
              {regimen === "ticketbai" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-soft)]">Territorio foral</label>
                  <select
                    value={territorio} onChange={(e) => setTerritorio(e.target.value as Territorio)}
                    className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                  >
                    {TERRITORIOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Confirmación del NIF (doble verificación) */}
            <div className="space-y-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
              <p className="text-xs font-semibold text-[var(--text-soft)]">Para evitar errores, escribe tu NIF dos veces. Debe coincidir con el de tus datos fiscales.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={nif1} onChange={(e) => setNif1(e.target.value)} placeholder="Introduce tu NIF" autoComplete="off"
                  className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm uppercase text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                />
                <input
                  value={nif2} onChange={(e) => setNif2(e.target.value)} placeholder="Confirma tu NIF" autoComplete="off"
                  className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm uppercase text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                />
              </div>
              {nif1 && nif2 && !coincide && <p className="text-[11px] font-semibold text-[var(--error)]">Los dos NIF no coinciden.</p>}
              {coincide && !nifOk && <p className="text-[11px] font-semibold text-[var(--error)]">No coincide con tu NIF fiscal ({nifFiscal}).</p>}
              {nifOk && <p className="text-[11px] font-semibold text-[var(--exito)]">✓ NIF verificado</p>}
            </div>

            <Button className="gap-1.5" disabled={pending || !nifOk} onClick={activar}>
              <Zap size={15} /> {pending ? "Activando…" : `Activar ${regimen === "ticketbai" ? "TicketBAI" : "Verifactu"}`}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[12px] bg-[var(--error-tint)] px-4 py-3">
            <AlertTriangle size={20} className="text-[var(--error)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Falta tu NIF fiscal</p>
              <p className="text-xs text-[var(--text-soft)]">
                Añade el NIF de la clínica en <Link href="/facturacion" className="font-semibold text-[var(--brand)] hover:underline">Facturación → Datos fiscales</Link> y vuelve aquí.
              </p>
            </div>
          </div>
        )}

        {/* Toggle de envío automático */}
        {conectado && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Envío automático a Verifactu</p>
              <p className="text-xs text-[var(--text-soft)]">Registra cada factura emitida ante la AEAT.</p>
            </div>
            <button
              type="button" role="switch" aria-checked={activo} aria-label="Envío automático"
              onClick={() => toggle(!activo)} disabled={pending}
              className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", activo ? "bg-[var(--brand)]" : "bg-[var(--border)]")}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", activo ? "translate-x-[22px]" : "translate-x-0.5")} />
            </button>
          </div>
        )}
      </section>

      <aside>
        <div className="sticky top-6 space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-[var(--text)]">Cómo funciona</h3>
          <p className="text-sm text-[var(--text-soft)]">
            Nosotros nos encargamos de todo el alta y el registro de tu NIF <strong className="text-[var(--text)]">de forma interna</strong>:
            no necesitas crear ninguna cuenta ni configurar claves en ningún sitio.
          </p>
          <p className="text-sm text-[var(--text-soft)]">
            Una vez activado, al aprobar una factura se <strong className="text-[var(--text)]">registra ante la AEAT</strong> y se genera
            automáticamente el QR verificable (Verifactu) o el de la Hacienda Foral (TicketBAI) en el documento.
          </p>
        </div>
      </aside>
    </div>
  );
}
