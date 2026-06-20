"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { crearRegistroHistoria, eliminarRegistroHistoria } from "@/app/actions/mascotas";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type HistoriaEntry = {
  id: string;
  fecha: string;
  motivo: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
};

interface Props {
  mascotaId: string;
  historia: HistoriaEntry[];
}

function RegistroCard({ entry, mascotaId }: { entry: HistoriaEntry; mascotaId: string }) {
  const [abierto, setAbierto] = useState(false);

  async function eliminar() {
    const res = await eliminarRegistroHistoria(entry.id, mascotaId);
    if (res.error) toast.error(res.error);
    else toast.success("Registro eliminado");
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--text-soft)]">
            {format(new Date(entry.fecha), "d MMM yyyy", { locale: es })}
          </p>
          <p className="font-medium text-sm mt-0.5">{entry.motivo ?? "Visita"}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => setAbierto((v) => !v)}>
            {abierto ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={eliminar} className="text-red-500 hover:text-red-700">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {abierto && (
        <dl className="mt-3 space-y-2 text-sm border-t pt-3">
          {[
            { label: "Diagnóstico",   value: entry.diagnostico },
            { label: "Tratamiento",   value: entry.tratamiento },
            { label: "Observaciones", value: entry.observaciones },
          ].filter((f) => f.value).map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-[var(--text-soft)] font-medium">{label}</dt>
              <dd className="mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

const EMPTY: Record<string, string> = {
  fecha: new Date().toISOString().slice(0, 10),
  motivo: "", anamnesis: "", exploracion: "", diagnostico: "", tratamiento: "", observaciones: "",
};

export function TabHistorial({ mascotaId, historia }: Props) {
  const [mostrando, setMostrando] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function guardar() {
    if (!form.fecha) { toast.error("Indica la fecha"); return; }
    const res = await crearRegistroHistoria({
      mascota_id:    mascotaId,
      fecha:         form.fecha,
      motivo:        form.motivo || null,
      anamnesis:     form.anamnesis || null,
      exploracion:   form.exploracion || null,
      diagnostico:   form.diagnostico || null,
      tratamiento:   form.tratamiento || null,
      observaciones: form.observaciones || null,
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Registro guardado");
    setForm(EMPTY);
    setMostrando(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setMostrando((v) => !v)}>
          <Plus className="size-4 mr-1" /> Nueva visita
        </Button>
      </div>

      {mostrando && (
        <Card className="p-4 space-y-3">
          <h4 className="font-semibold text-sm">Registrar visita</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Fecha", key: "fecha", type: "date" },
              { label: "Motivo de consulta", key: "motivo", type: "text" },
              { label: "Anamnesis", key: "anamnesis", type: "text" },
              { label: "Exploración", key: "exploracion", type: "text" },
              { label: "Diagnóstico", key: "diagnostico", type: "text" },
              { label: "Tratamiento", key: "tratamiento", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="text-xs">Observaciones</Label>
              <Input
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setMostrando(false)}>Cancelar</Button>
            <Button onClick={guardar}>Guardar visita</Button>
          </div>
        </Card>
      )}

      {historia.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin historial"
          description="Registra la primera visita de esta mascota."
        />
      ) : (
        <div className="space-y-2">
          {historia.map((e) => (
            <RegistroCard key={e.id} entry={e} mascotaId={mascotaId} />
          ))}
        </div>
      )}
    </div>
  );
}
