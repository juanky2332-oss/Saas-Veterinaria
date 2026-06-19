"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PawPrint, Edit2, Check, X } from "lucide-react";
import { actualizarMascota } from "@/app/actions/mascotas";
import { toast } from "sonner";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";

type Mascota = {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  color: string | null;
  peso_kg: number | null;
  num_chip: string | null;
  esterilizado: boolean;
  alergias: string | null;
  observaciones: string | null;
  clientes: { nombre: string; apellidos: string | null; telefono: string | null; email: string | null } | null;
};

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return "—";
  const nac = new Date(fechaNac);
  const hoy = new Date();
  const años = differenceInYears(hoy, nac);
  if (años >= 1) return `${años} año${años > 1 ? "s" : ""}`;
  const meses = differenceInMonths(hoy, nac);
  return meses > 0 ? `${meses} mes${meses > 1 ? "es" : ""}` : "Recién nacido";
}

interface Props { mascota: Mascota }

export function TabInfo({ mascota }: Props) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    peso_kg:       mascota.peso_kg?.toString() ?? "",
    raza:          mascota.raza ?? "",
    color:         mascota.color ?? "",
    num_chip:      mascota.num_chip ?? "",
    esterilizado:  mascota.esterilizado,
    alergias:      mascota.alergias ?? "",
    observaciones: mascota.observaciones ?? "",
  });

  async function guardar() {
    const res = await actualizarMascota(mascota.id, {
      peso_kg:       form.peso_kg ? parseFloat(form.peso_kg) : null,
      raza:          form.raza,
      color:         form.color,
      num_chip:      form.num_chip,
      esterilizado:  form.esterilizado,
      alergias:      form.alergias,
      observaciones: form.observaciones,
    });
    if (res.error) { toast.error(res.error); return; }
    toast.success("Ficha actualizada");
    setEditando(false);
  }

  const filas = [
    { label: "Especie",         value: mascota.especie },
    { label: "Raza",            value: mascota.raza ?? "—" },
    { label: "Fecha nac.",      value: mascota.fecha_nacimiento ? format(new Date(mascota.fecha_nacimiento), "d MMM yyyy", { locale: es }) : "—" },
    { label: "Edad",            value: calcEdad(mascota.fecha_nacimiento) },
    { label: "Sexo",            value: mascota.sexo ?? "—" },
    { label: "Color",           value: mascota.color ?? "—" },
    { label: "Peso",            value: mascota.peso_kg ? `${mascota.peso_kg} kg` : "—" },
    { label: "Microchip",       value: mascota.num_chip ?? "—" },
    { label: "Esterilizado",    value: mascota.esterilizado ? "Sí" : "No" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Datos principales */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <PawPrint className="size-4 text-[var(--brand)]" /> Datos de la mascota
          </h3>
          {!editando ? (
            <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>
              <Edit2 className="size-3.5 mr-1" /> Editar
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>
                <X className="size-3.5" />
              </Button>
              <Button size="sm" onClick={guardar}>
                <Check className="size-3.5 mr-1" /> Guardar
              </Button>
            </div>
          )}
        </div>

        {!editando ? (
          <dl className="space-y-2">
            {filas.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-[var(--text-soft)]">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Raza", key: "raza" },
              { label: "Color", key: "color" },
              { label: "Microchip", key: "num_chip" },
              { label: "Peso (kg)", key: "peso_kg" },
              { label: "Alergias", key: "alergias" },
              { label: "Observaciones", key: "observaciones" },
            ].map(({ label, key }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ))}
            <div>
              <Label className="text-xs">Esterilizado</Label>
              <Select
                value={form.esterilizado ? "si" : "no"}
                onValueChange={(v) => setForm((f) => ({ ...f, esterilizado: v === "si" }))}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Propietario */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Propietario</h3>
        {mascota.clientes ? (
          <dl className="space-y-2">
            {[
              { label: "Nombre", value: `${mascota.clientes.nombre}${mascota.clientes.apellidos ? ` ${mascota.clientes.apellidos}` : ""}` },
              { label: "Teléfono", value: mascota.clientes.telefono ?? "—" },
              { label: "Email", value: mascota.clientes.email ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-[var(--text-soft)]">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-[var(--text-soft)]">Sin propietario asignado.</p>
        )}

        {mascota.alergias && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-semibold text-red-700 mb-1">Alergias conocidas</p>
            <p className="text-sm text-red-600">{mascota.alergias}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
