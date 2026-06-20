"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Syringe, Bug, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  crearVacunacion, eliminarVacunacion,
  crearDesparasitacion, eliminarDesparasitacion,
} from "@/app/actions/vacunaciones";
import { toast } from "sonner";
import { format, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

type Vacunacion = {
  id: string; vacuna: string; fabricante: string | null;
  fecha_aplicacion: string; fecha_proxima: string | null; notas: string | null;
};
type Desparasitacion = {
  id: string; tipo: string; producto: string | null;
  fecha_aplicacion: string; fecha_proxima: string | null;
};

function estaVencida(fecha: string | null): boolean {
  if (!fecha) return false;
  return isBefore(new Date(fecha), new Date());
}
function proxima(fecha: string | null): boolean {
  if (!fecha) return false;
  return isBefore(new Date(fecha), addDays(new Date(), 30));
}

interface Props {
  mascotaId: string;
  vacunaciones: Vacunacion[];
  desparasitaciones: Desparasitacion[];
}

export function TabVacunaciones({ mascotaId, vacunaciones, desparasitaciones }: Props) {
  const [tabActivo, setTabActivo] = useState<"vacunas" | "desparasitaciones">("vacunas");
  const [mostrando, setMostrando] = useState(false);
  const [formV, setFormV] = useState({ vacuna: "", fabricante: "", lote: "", fecha_aplicacion: new Date().toISOString().slice(0, 10), fecha_proxima: "", notas: "" });
  const [formD, setFormD] = useState({ tipo: "interna", producto: "", fecha_aplicacion: new Date().toISOString().slice(0, 10), fecha_proxima: "" });

  async function guardarVacuna() {
    if (!formV.vacuna || !formV.fecha_aplicacion) { toast.error("Rellena vacuna y fecha"); return; }
    const res = await crearVacunacion({ mascota_id: mascotaId, ...formV });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Vacunación registrada");
    setMostrando(false);
  }

  async function guardarDesparasitacion() {
    if (!formD.fecha_aplicacion) { toast.error("Indica la fecha"); return; }
    const res = await crearDesparasitacion({
      mascota_id:       mascotaId,
      tipo:             formD.tipo as "interna" | "externa" | "ambas",
      producto:         formD.producto || null,
      fecha_aplicacion: formD.fecha_aplicacion,
      fecha_proxima:    formD.fecha_proxima || null,
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Desparasitación registrada");
    setMostrando(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant={tabActivo === "vacunas" ? "default" : "outline"} onClick={() => setTabActivo("vacunas")}>
            <Syringe className="size-3.5 mr-1" /> Vacunas ({vacunaciones.length})
          </Button>
          <Button size="sm" variant={tabActivo === "desparasitaciones" ? "default" : "outline"} onClick={() => setTabActivo("desparasitaciones")}>
            <Bug className="size-3.5 mr-1" /> Desparasitaciones ({desparasitaciones.length})
          </Button>
        </div>
        <Button size="sm" onClick={() => setMostrando((v) => !v)}>
          <Plus className="size-3.5 mr-1" /> {tabActivo === "vacunas" ? "Vacuna" : "Desparasitación"}
        </Button>
      </div>

      {mostrando && tabActivo === "vacunas" && (
        <Card className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Vacuna*", key: "vacuna" }, { label: "Fabricante", key: "fabricante" },
              { label: "Lote", key: "lote" },
              { label: "Fecha aplicación*", key: "fecha_aplicacion", type: "date" },
              { label: "Próxima dosis", key: "fecha_proxima", type: "date" },
            ].map(({ label, key, type = "text" }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input type={type} value={formV[key as keyof typeof formV]} onChange={(e) => setFormV((f) => ({ ...f, [key]: e.target.value }))} className="mt-1" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setMostrando(false)}>Cancelar</Button>
            <Button onClick={guardarVacuna}>Guardar</Button>
          </div>
        </Card>
      )}

      {mostrando && tabActivo === "desparasitaciones" && (
        <Card className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Tipo*</Label>
              <select value={formD.tipo} onChange={(e) => setFormD((f) => ({ ...f, tipo: e.target.value }))} className="mt-1 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                <option value="interna">Interna</option>
                <option value="externa">Externa</option>
                <option value="ambas">Ambas</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Producto</Label>
              <Input value={formD.producto} onChange={(e) => setFormD((f) => ({ ...f, producto: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Fecha aplicación*</Label>
              <Input type="date" value={formD.fecha_aplicacion} onChange={(e) => setFormD((f) => ({ ...f, fecha_aplicacion: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Próxima</Label>
              <Input type="date" value={formD.fecha_proxima} onChange={(e) => setFormD((f) => ({ ...f, fecha_proxima: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setMostrando(false)}>Cancelar</Button>
            <Button onClick={guardarDesparasitacion}>Guardar</Button>
          </div>
        </Card>
      )}

      {tabActivo === "vacunas" && (
        vacunaciones.length === 0 ? (
          <EmptyState icon={Syringe} title="Sin vacunas" description="Registra la primera vacunación." />
        ) : (
          <div className="space-y-2">
            {vacunaciones.map((v) => (
              <Card key={v.id} className="p-3 flex items-center gap-3">
                <Syringe className="size-4 text-[var(--brand)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{v.vacuna}</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    {format(new Date(v.fecha_aplicacion), "d MMM yyyy", { locale: es })}
                    {v.fabricante ? ` · ${v.fabricante}` : ""}
                  </p>
                </div>
                {v.fecha_proxima && (
                  <Badge variant={estaVencida(v.fecha_proxima) ? "error" : proxima(v.fecha_proxima) ? "aviso" : "muted"} className="text-xs shrink-0">
                    {estaVencida(v.fecha_proxima) && <AlertCircle className="size-3 mr-1" />}
                    Próx: {format(new Date(v.fecha_proxima), "d MMM yyyy", { locale: es })}
                  </Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => eliminarVacunacion(v.id, mascotaId).then((r) => r.error ? toast.error(r.error) : toast.success("Eliminada"))} className="text-red-500 hover:text-red-700 shrink-0">
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        )
      )}

      {tabActivo === "desparasitaciones" && (
        desparasitaciones.length === 0 ? (
          <EmptyState icon={Bug} title="Sin desparasitaciones" description="Registra el primer tratamiento." />
        ) : (
          <div className="space-y-2">
            {desparasitaciones.map((d) => (
              <Card key={d.id} className="p-3 flex items-center gap-3">
                <Bug className="size-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm capitalize">{d.tipo}{d.producto ? ` · ${d.producto}` : ""}</p>
                  <p className="text-xs text-[var(--text-soft)]">{format(new Date(d.fecha_aplicacion), "d MMM yyyy", { locale: es })}</p>
                </div>
                {d.fecha_proxima && (
                  <Badge variant={estaVencida(d.fecha_proxima) ? "error" : "muted"} className="text-xs shrink-0">
                    Próx: {format(new Date(d.fecha_proxima), "d MMM yyyy", { locale: es })}
                  </Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => eliminarDesparasitacion(d.id, mascotaId).then((r) => r.error ? toast.error(r.error) : toast.success("Eliminada"))} className="text-red-500 hover:text-red-700 shrink-0">
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
