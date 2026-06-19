"use client";

import { useState, useRef } from "react";
import { FileCheck, PenLine, Upload, Download, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatFechaHora } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Paciente = Database["public"]["Tables"]["patients"]["Row"];

interface Consentimiento {
  id: string;
  titulo: string;
  pdf_path: string | null;
  firmado_at: string | null;
  origen: string;
  consent_templates: { titulo: string } | null;
}

interface TabConsentimientosProps {
  consentimientos: Record<string, unknown>[];
  paciente: Paciente;
}

export function TabConsentimientos({ consentimientos, paciente }: TabConsentimientosProps) {
  const lista = consentimientos as unknown as Consentimiento[];
  const [firmandoId, setFirmandoId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [hasFirma, setHasFirma] = useState(false);

  function empezarDibujo(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setDibujando(true);
    setHasFirma(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function dibujar(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dibujando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "var(--tinta)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function limpiarFirma() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasFirma(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--tinta-suave)]">
          {lista.length} consentimiento{lista.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Upload size={13} strokeWidth={1.75} />
            Subir papel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setFirmandoId("nuevo")}>
            <PenLine size={13} strokeWidth={1.75} />
            Nuevo consentimiento
          </Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <FileCheck size={28} strokeWidth={1.5} className="text-[var(--salvia)] mb-3" />
          <h3 className="font-display text-lg font-semibold text-[var(--tinta)]">Sin consentimientos</h3>
          <p className="mt-1 text-sm text-[var(--tinta-suave)]">
            Los consentimientos firmados aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                c.firmado_at ? "bg-[var(--exito-tint)]" : "bg-[var(--aviso-tint)]"
              }`}>
                {c.firmado_at
                  ? <CheckCircle size={18} strokeWidth={1.75} className="text-[var(--exito)]" />
                  : <Clock size={18} strokeWidth={1.75} className="text-[var(--aviso)]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--tinta)]">{c.titulo}</p>
                <p className="text-xs text-[var(--tinta-suave)]">
                  {c.firmado_at
                    ? `Firmado el ${formatFechaHora(c.firmado_at)}`
                    : "Pendiente de firma"}
                  {" · "}
                  <span className="capitalize">{c.origen}</span>
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!c.firmado_at && (
                  <Button size="sm" variant="outline" onClick={() => setFirmandoId(c.id)}>
                    Firmar
                  </Button>
                )}
                {c.pdf_path && (
                  <Button size="icon-sm" variant="ghost">
                    <Download size={14} strokeWidth={1.75} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de firma */}
      <Dialog open={!!firmandoId} onOpenChange={() => setFirmandoId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma digital del consentimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[var(--tinta-suave)]">
              {paciente.nombre} {paciente.apellidos} — usa el dedo o stylus para firmar.
            </p>
            <div className="rounded-[12px] border-2 border-dashed border-[var(--lino)] bg-[var(--arena)] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={empezarDibujo}
                onMouseMove={dibujar}
                onMouseUp={() => setDibujando(false)}
                onMouseLeave={() => setDibujando(false)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={limpiarFirma}>Borrar</Button>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setFirmandoId(null)}>Cancelar</Button>
              <Button size="sm" disabled={!hasFirma}>
                Guardar consentimiento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
