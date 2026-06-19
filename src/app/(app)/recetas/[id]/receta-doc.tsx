"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Item { id: string; medicamento: string; posologia: string | null; duracion: string | null; cantidad: string | null; observaciones: string | null }
interface Receta {
  id: string;
  fecha: string;
  diagnostico: string | null;
  observaciones: string | null;
  items: Item[];
  paciente: { nombre: string; apellidos: string; dni: string | null; fecha_nacimiento: string | null } | null;
  doctora: string | null;
}
interface Emisor { nombre: string; nif: string | null; direccion: string | null; logoUrl: string | null; brandColor: string }

const fmt = (iso: string | null) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—");

export function RecetaDoc({ receta, emisor }: { receta: Receta; emisor: Emisor }) {
  const color = emisor.brandColor;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-display text-xl font-bold text-[var(--text)]">Receta médica</h1>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
          <Printer size={14} /> Imprimir / PDF
        </Button>
      </div>

      <div className="print-area mx-auto w-full max-w-[760px]">
        <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-white text-[#1d2733] shadow-[var(--shadow-card)] print:rounded-none print:border-0 print:shadow-none">
          {/* Cabecera */}
          <div className="flex items-start justify-between px-8 py-6 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
            <div className="flex items-center gap-3">
              {emisor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={emisor.logoUrl} alt="" className="h-12 w-12 rounded-[10px] bg-white/10 object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white/15 text-xl font-bold">{emisor.nombre.charAt(0)}</span>
              )}
              <div>
                <p className="text-lg font-bold leading-tight">{emisor.nombre}</p>
                {emisor.nif && <p className="text-xs text-white/80">{emisor.nif}</p>}
                {emisor.direccion && <p className="text-xs text-white/80">{emisor.direccion}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/75">Receta</p>
              <p className="text-sm font-semibold tabular-nums">{fmt(receta.fecha)}</p>
            </div>
          </div>

          {/* Paciente */}
          <div className="grid gap-4 border-b border-[#e8edf2] px-8 py-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8694]">Paciente</p>
              <p className="font-bold">{receta.paciente ? `${receta.paciente.nombre} ${receta.paciente.apellidos}` : "—"}</p>
              {receta.paciente?.dni && <p className="text-sm text-[#5a6675]">DNI: {receta.paciente.dni}</p>}
              {receta.paciente?.fecha_nacimiento && <p className="text-sm text-[#5a6675]">Nac.: {fmt(receta.paciente.fecha_nacimiento)}</p>}
            </div>
            {receta.diagnostico && (
              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8694]">Diagnóstico</p>
                <p className="text-sm">{receta.diagnostico}</p>
              </div>
            )}
          </div>

          {/* Medicación */}
          <div className="px-8 py-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#7a8694]">Prescripción</p>
            <ul className="space-y-3">
              {receta.items?.length ? receta.items.map((it, i) => (
                <li key={it.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: color }}>{i + 1}</span>
                  <div>
                    <p className="font-semibold">{it.medicamento}{it.cantidad ? ` · ${it.cantidad}` : ""}</p>
                    <p className="text-sm text-[#5a6675]">
                      {[it.posologia, it.duracion].filter(Boolean).join(" · ") || "Según indicación"}
                    </p>
                    {it.observaciones && <p className="text-xs italic text-[#7a8694]">{it.observaciones}</p>}
                  </div>
                </li>
              )) : <li className="text-sm text-[#7a8694]">Sin medicación.</li>}
            </ul>
          </div>

          {/* Observaciones + firma */}
          <div className="px-8 pb-8">
            {receta.observaciones && (
              <div className="mb-6 rounded-[10px] bg-[#fafbfc] p-3 text-sm text-[#5a6675]">{receta.observaciones}</div>
            )}
            <div className="mt-10 flex items-end justify-between">
              <p className="text-[10.5px] text-[#9aa6b2]">Documento generado con Clinicomatic.</p>
              <div className="text-center">
                <div className="h-px w-48 bg-[#1d2733]/40" />
                <p className="mt-1 text-sm font-semibold">{receta.doctora ?? "Profesional"}</p>
                <p className="text-[11px] text-[#7a8694]">Firma y sello</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
