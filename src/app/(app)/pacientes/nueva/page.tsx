"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function NuevaPacientePage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nombre: "", apellidos: "", telefono: "", email: "",
    fecha_nacimiento: "", sexo: "", dni: "", direccion: "",
    alergias: "", observaciones: "", origen: "directa",
  });
  const [recordatorios, setRecordatorios] = useState(true);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.apellidos || !form.telefono) {
      toast.error("Nombre, apellidos y teléfono son obligatorios");
      return;
    }
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("patients") as any).insert({
        nombre: form.nombre,
        apellidos: form.apellidos,
        telefono: form.telefono,
        email: form.email || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        sexo: (form.sexo as "femenino" | "masculino" | "otro") || null,
        dni: form.dni || null,
        direccion: form.direccion || null,
        alergias: form.alergias || null,
        observaciones: form.observaciones || null,
        origen: form.origen || null,
        recordatorios_wa: recordatorios,
      }).select("id").single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe una paciente con ese número de teléfono");
        } else {
          toast.error(`Error: ${error.message}`);
        }
        return;
      }
      toast.success(`Paciente ${form.nombre} ${form.apellidos} creada correctamente`);
      router.push(`/pacientes/${(data as { id: string }).id}`);
    });
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Nueva paciente" />
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
          <Link href="/pacientes"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--tinta-suave)] hover:text-[var(--oliva)] transition-colors">
            <ChevronLeft size={14} strokeWidth={2} /> Volver a pacientes
          </Link>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Datos personales */}
            <Card>
              <CardHeader>
                <CardTitle>Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Nombre *</Label>
                    <Input required placeholder="Ej. María" value={form.nombre}
                      onChange={e => set("nombre", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Apellidos *</Label>
                    <Input required placeholder="Ej. García López" value={form.apellidos}
                      onChange={e => set("apellidos", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Fecha de nacimiento</Label>
                    <DatePicker value={form.fecha_nacimiento}
                      onChange={v => set("fecha_nacimiento", v)}
                      max={new Date().toISOString().slice(0, 10)}
                      clearable
                      placeholder="dd/mm/aaaa" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sexo</Label>
                    <Select value={form.sexo} onValueChange={v => set("sexo", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>DNI / NIF</Label>
                  <Input placeholder="Ej. 12345678A" value={form.dni}
                    onChange={e => set("dni", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Teléfono *</Label>
                    <Input required type="tel" placeholder="+34 600 000 000" value={form.telefono}
                      onChange={e => set("telefono", e.target.value)} />
                    <p className="text-[11px] text-[var(--tinta-suave)]">Se usa para vincular mensajes de WhatsApp</p>
                    <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--tinta)]">
                      <input type="checkbox" checked={recordatorios} onChange={e => setRecordatorios(e.target.checked)}
                        className="h-4 w-4 accent-[var(--oliva)]" />
                      Enviar recordatorios automáticos por WhatsApp
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="paciente@email.com" value={form.email}
                      onChange={e => set("email", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Dirección</Label>
                  <Input placeholder="Calle, ciudad…" value={form.direccion}
                    onChange={e => set("direccion", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Clínico */}
            <Card>
              <CardHeader>
                <CardTitle>Información clínica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Alergias conocidas</Label>
                  <Input placeholder="Ej. Ibuprofeno, látex…" value={form.alergias}
                    onChange={e => set("alergias", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Observaciones generales</Label>
                  <textarea value={form.observaciones}
                    onChange={e => set("observaciones", e.target.value)}
                    placeholder="Notas relevantes sobre la paciente…"
                    rows={3}
                    className="w-full rounded-[12px] border border-[var(--lino)] bg-white px-3 py-2 text-sm text-[var(--tinta)] placeholder:text-[var(--tinta-suave)] resize-none focus:outline-none focus:border-[var(--oliva)] focus:ring-2 focus:ring-[rgba(117,128,107,.25)]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Origen / Cómo nos conoció</Label>
                  <Select value={form.origen} onValueChange={v => set("origen", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directa">Directa / Paseo</SelectItem>
                      <SelectItem value="recomendacion">Recomendación</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="crm">Lead CRM</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex items-center gap-3 justify-end pb-6">
              <Link href="/pacientes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? "Guardando…" : <><UserPlus size={14} strokeWidth={1.75} /> Crear paciente</>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
