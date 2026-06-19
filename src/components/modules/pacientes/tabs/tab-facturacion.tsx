"use client";

import { useState } from "react";
import { Receipt, Plus, Send, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFecha, formatEuro } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Paciente = Database["public"]["Tables"]["patients"]["Row"];

// Facturas demo por paciente (en producción: query a Supabase billing_events o Holded API)
const facturasDemo = [
  { id: "F-001", concepto: "Toxina Botulínica — Frente", importe: 350, fecha: "2024-09-20", estado: "pagada" },
  { id: "F-002", concepto: "Vitaminas IV Mesoterapia", importe: 180, fecha: "2024-06-15", estado: "enviada" },
];

interface TabFacturacionProps {
  paciente: Paciente;
}

export function TabFacturacion({ paciente }: TabFacturacionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [proveedor, setProveedor] = useState("holded");

  const totalFacturado = facturasDemo.reduce((s, f) => s + f.importe, 0);

  async function handleFacturar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await new Promise((r) => setTimeout(r, 1200));
    setEnviando(false);
    setDialogOpen(false);
    toast.success(`Factura generada para ${paciente.nombre} y enviada a ${proveedor === "holded" ? "Holded" : "tu sistema de facturación"}.`);
    setConcepto("");
    setImporte("");
  }

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold text-[var(--tinta-suave)]">Total facturado</p>
          <p className="text-xl font-display font-bold text-[var(--tinta)] tabular-nums mt-1">{formatEuro(totalFacturado)}</p>
        </div>
        <div className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold text-[var(--tinta-suave)]">Facturas</p>
          <p className="text-xl font-display font-bold text-[var(--tinta)] tabular-nums mt-1">{facturasDemo.length}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
          <Button
            size="sm"
            variant="terracota"
            className="gap-1.5 w-full sm:w-auto"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={13} strokeWidth={2} />
            Generar factura
          </Button>
        </div>
      </div>

      {/* Historial de facturas */}
      {facturasDemo.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--salvia-tint)] mb-3">
            <Receipt size={24} strokeWidth={1.5} className="text-[var(--salvia)]" />
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--tinta)]">Sin facturas</h3>
          <p className="mt-1 text-sm text-[var(--tinta-suave)]">Las facturas generadas para esta paciente aparecerán aquí.</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus size={13} strokeWidth={2} />
            Primera factura
          </Button>
        </div>
      ) : (
        <div className="rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] overflow-hidden shadow-[var(--shadow-card)]">
          <div className="divide-y divide-[var(--lino)]">
            {facturasDemo.map((f, i) => (
              <div
                key={f.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--arena)] transition-colors animate-in fade-in-0 slide-in-from-left-2"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                  f.estado === "pagada" ? "bg-[var(--exito-tint)]" : "bg-[var(--aviso-tint)]"
                }`}>
                  {f.estado === "pagada"
                    ? <CheckCircle size={16} strokeWidth={1.75} className="text-[var(--exito)]" />
                    : <Clock size={16} strokeWidth={1.75} className="text-[var(--aviso)]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--tinta)] truncate">{f.concepto}</p>
                  <p className="text-xs text-[var(--tinta-suave)]">{f.id} · {formatFecha(f.fecha)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-[var(--tinta)] tabular-nums">{formatEuro(f.importe)}</span>
                  <Badge variant={f.estado === "pagada" ? "exito" : "aviso"} className="text-[10px]">
                    {f.estado === "pagada" ? "Pagada" : "Enviada"}
                  </Badge>
                  <button className="flex items-center gap-1 text-[11px] text-[var(--oliva)] hover:underline">
                    <ExternalLink size={10} strokeWidth={1.75} />
                    Holded
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar factura para {paciente.nombre} {paciente.apellidos}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFacturar} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Concepto / Tratamiento</Label>
              <Input
                required
                placeholder="Ej. Toxina Botulínica — Frente y Glabela"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Importe (€)</Label>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enviar a</Label>
              <Select value={proveedor} onValueChange={setProveedor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holded">Holded</SelectItem>
                  <SelectItem value="facturadirecta">Factura Directa</SelectItem>
                  <SelectItem value="otro">Otro proveedor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[var(--tinta-suave)]">
                La factura se genera en tu sistema externo. Clinicomatic no almacena datos fiscales.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="terracota" disabled={enviando} className="gap-1.5">
                {enviando ? "Generando…" : <><Send size={13} strokeWidth={1.75} /> Generar y enviar</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
