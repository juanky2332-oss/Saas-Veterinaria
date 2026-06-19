"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearMascota } from "@/app/actions/mascotas";
import { toast } from "sonner";

export default function NuevaMascotaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "", especie: "perro", raza: "", fecha_nacimiento: "",
    sexo: "desconocido", color: "", peso_kg: "", num_chip: "",
    esterilizado: false, alergias: "", observaciones: "",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setLoading(true);
    const res = await crearMascota({
      ...form,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
      fecha_nacimiento: form.fecha_nacimiento || null,
    });
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Mascota registrada");
    router.push(`/mascotas/${res.id}`);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Nueva mascota" back="/mascotas" />
      <div className="flex-1 p-4 md:p-6 max-w-2xl">
        <form onSubmit={submit}>
          <Card className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre de la mascota" className="mt-1" required />
              </div>

              <div>
                <Label>Especie *</Label>
                <Select value={form.especie} onValueChange={(v) => set("especie", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["perro", "gato", "conejo", "ave", "reptil", "roedor", "pez", "otro"].map((e) => (
                      <SelectItem key={e} value={e} className="capitalize">{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Raza</Label>
                <Input value={form.raza} onChange={(e) => set("raza", e.target.value)} placeholder="Ej: Labrador" className="mt-1" />
              </div>

              <div>
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.fecha_nacimiento} onChange={(e) => set("fecha_nacimiento", e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => set("sexo", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                    <SelectItem value="desconocido">Desconocido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" step="0.1" value={form.peso_kg} onChange={(e) => set("peso_kg", e.target.value)} placeholder="Ej: 12.5" className="mt-1" />
              </div>

              <div>
                <Label>Color / pelaje</Label>
                <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej: Negro con manchas blancas" className="mt-1" />
              </div>

              <div>
                <Label>Nº microchip</Label>
                <Input value={form.num_chip} onChange={(e) => set("num_chip", e.target.value)} placeholder="15 dígitos" className="mt-1" />
              </div>

              <div>
                <Label>Esterilizado</Label>
                <Select value={form.esterilizado ? "si" : "no"} onValueChange={(v) => set("esterilizado", v === "si")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="si">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label>Alergias conocidas</Label>
                <Input value={form.alergias} onChange={(e) => set("alergias", e.target.value)} placeholder="Ej: Penicilina, pollo…" className="mt-1" />
              </div>

              <div className="sm:col-span-2">
                <Label>Observaciones</Label>
                <Input value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} placeholder="Notas adicionales" className="mt-1" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Guardando…" : "Crear mascota"}</Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
