"use client";

import { useState } from "react";
import { Receipt, Plus, ExternalLink, CheckCircle, Clock, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFecha, formatEuro } from "@/lib/utils";
import { toast } from "sonner";

// Facturas demo (en producción vendrían de Supabase / Holded)
const facturasDemo = [
  { id: "F-2024-001", paciente: "María García López", concepto: "Toxina Botulínica", importe: 350, fecha: "2024-11-15", estado: "enviada", holded_id: "HOL-001" },
  { id: "F-2024-002", paciente: "Carmen Martínez Ruiz", concepto: "Ãcido Hialurónico Labios", importe: 420, fecha: "2024-11-12", estado: "pagada", holded_id: "HOL-002" },
  { id: "F-2024-003", paciente: "Ana López Fernández", concepto: "Radiofrecuencia Facial", importe: 280, fecha: "2024-11-10", estado: "enviada", holded_id: null },
  { id: "F-2024-004", paciente: "Isabel Sánchez Torres", concepto: "PRP Capilar", importe: 350, fecha: "2024-11-08", estado: "pendiente", holded_id: null },
];

const estadoConfig = {
  pagada: { label: "Pagada", variant: "exito" as const, icon: CheckCircle },
  enviada: { label: "Enviada", variant: "oliva" as const, icon: Send },
  pendiente: { label: "Pendiente", variant: "aviso" as const, icon: Clock },
  error: { label: "Error", variant: "error" as const, icon: AlertTriangle },
};

interface NuevaFactura {
  paciente: string;
  concepto: string;
  importe: string;
  proveedor: "holded" | "otro";
}

export function FacturacionView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nueva, setNueva] = useState<NuevaFactura>({
    paciente: "", concepto: "", importe: "", proveedor: "holded",
  });

  async function handleGenerarFactura(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    // Simula llamada al adaptador Holded / billing provider
    await new Promise((r) => setTimeout(r, 1500));
    setEnviando(false);
    setDialogOpen(false);
    toast.success(`Factura generada para ${nueva.paciente} y enviada a ${nueva.proveedor === "holded" ? "Holded" : "tu sistema de facturación"}.`);
    setNueva({ paciente: "", concepto: "", importe: "", proveedor: "holded" });
  }

  const totalMes = facturasDemo.reduce((s, f) => s + f.importe, 0);
  const pagadas = facturasDemo.filter(f => f.estado === "pagada").length;

  return (
    <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
      {/* Banner informativo */}
      <div className="flex items-start gap-3 rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--salvia-tint)]">
          <Receipt size={18} strokeWidth={1.75} className="text-[var(--oliva)]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--tinta)]">Facturación delegada en tu software externo</p>
          <p className="text-xs text-[var(--tinta-suave)] mt-0.5">
            Veteriblandenguer genera <strong>eventos de facturación</strong> que se envían automáticamente a tu programa de facturación (Holded u otro). No se almacenan datos fiscales aquí.
          </p>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus size={13} strokeWidth={2} />
          Nueva factura
        </Button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Este mes", value: formatEuro(totalMes), sub: `${facturasDemo.length} facturas` },
          { label: "Cobradas", value: pagadas.toString(), sub: `de ${facturasDemo.length}` },
          { label: "Pendientes", value: facturasDemo.filter(f => f.estado === "pendiente").length.toString(), sub: "sin enviar" },
          { label: "Conectado a", value: "Holded", sub: "modo mock activo" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold text-[var(--tinta-suave)] mb-1">{kpi.label}</p>
            <p className="text-xl font-display font-bold text-[var(--tinta)] tabular-nums">{kpi.value}</p>
            <p className="text-[11px] text-[var(--tinta-suave)] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla de facturas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Facturas recientes</CardTitle>
              <CardDescription>Registro de eventos de facturación enviados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--lino)]">
                  {["Nº Factura", "Paciente", "Concepto", "Importe", "Fecha", "Estado", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturasDemo.map((f, i) => {
                  const cfg = estadoConfig[f.estado as keyof typeof estadoConfig];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={f.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="border-b border-[var(--lino)] last:border-0 hover:bg-[var(--arena)] transition-colors animate-in fade-in-0"
                    >
                      <td className="px-5 py-3 text-sm font-semibold text-[var(--tinta)] tabular-nums">{f.id}</td>
                      <td className="px-5 py-3 text-sm text-[var(--tinta)]">{f.paciente}</td>
                      <td className="px-5 py-3 text-sm text-[var(--tinta-suave)] max-w-[180px] truncate">{f.concepto}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-[var(--tinta)] tabular-nums">{formatEuro(f.importe)}</td>
                      <td className="px-5 py-3 text-sm text-[var(--tinta-suave)] tabular-nums">{formatFecha(f.fecha)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={cfg.variant} className="gap-1 text-[10px]">
                          <Icon size={9} strokeWidth={2} />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {f.holded_id && (
                          <button className="flex items-center gap-1 text-xs text-[var(--oliva)] hover:underline">
                            <ExternalLink size={11} strokeWidth={1.75} />
                            Ver en Holded
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Configuración del proveedor */}
      <Card>
        <CardHeader>
          <CardTitle>Programa de facturación</CardTitle>
          <CardDescription>Elige con qué sistema quieres integrar la facturación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { id: "holded", name: "Holded", desc: "Software de gestión español, cumple Verifactu", active: true },
              { id: "facturadirecta", name: "Factura Directa", desc: "Compatible con Verifactu y Ticketbai", active: false },
              { id: "otro", name: "Otro (webhook)", desc: "Configura tu propio endpoint de recepción", active: false },
            ].map((p) => (
              <div
                key={p.id}
                className={`rounded-[14px] border p-4 cursor-pointer transition-all duration-150 ${
                  p.active
                    ? "border-[var(--oliva)] bg-[var(--salvia-tint)] shadow-[var(--shadow-card)]"
                    : "border-[var(--lino)] bg-[var(--arena)] hover:border-[var(--salvia)] opacity-70"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-sm font-semibold text-[var(--tinta)]">{p.name}</p>
                  {p.active && <Badge variant="oliva" className="text-[10px]">Activo</Badge>}
                </div>
                <p className="text-xs text-[var(--tinta-suave)]">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--tinta-suave)]">
            Para cambiar el proveedor o añadir credenciales reales, ve a <strong>Configuración â†’ Integraciones</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Dialog nueva factura */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar factura</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerarFactura} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Input
                required
                placeholder="Nombre de la paciente"
                value={nueva.paciente}
                onChange={(e) => setNueva(p => ({ ...p, paciente: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Concepto / Tratamiento</Label>
              <Input
                required
                placeholder="Ej. Toxina Botulínica — Frente"
                value={nueva.concepto}
                onChange={(e) => setNueva(p => ({ ...p, concepto: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Importe (â‚¬)</Label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={nueva.importe}
                onChange={(e) => setNueva(p => ({ ...p, importe: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enviar a</Label>
              <Select
                value={nueva.proveedor}
                onValueChange={(v) => setNueva(p => ({ ...p, proveedor: v as "holded" | "otro" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holded">Holded</SelectItem>
                  <SelectItem value="otro">Otro proveedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={enviando} className="gap-1.5">
                {enviando ? "Enviando…" : <><Send size={13} strokeWidth={1.75} /> Generar y enviar</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
