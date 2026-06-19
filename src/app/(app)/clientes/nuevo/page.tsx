"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearCliente } from "@/app/actions/clientes";
import { toast } from "sonner";

export default function NuevoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "", apellidos: "", telefono: "", email: "",
    nif: "", direccion: "", ciudad: "", cp: "", notas: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setLoading(true);
    const res = await crearCliente(form);
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Cliente registrado");
    router.push(`/clientes/${res.id}`);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Nuevo cliente" back="/clientes" />
      <div className="flex-1 p-4 md:p-6 max-w-2xl">
        <form onSubmit={submit}>
          <Card className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre" className="mt-1" required />
              </div>
              <div>
                <Label>Apellidos</Label>
                <Input value={form.apellidos} onChange={(e) => set("apellidos", e.target.value)} placeholder="Apellidos" className="mt-1" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input type="tel" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+34 600 000 000" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@ejemplo.com" className="mt-1" />
              </div>
              <div>
                <Label>NIF / DNI</Label>
                <Input value={form.nif} onChange={(e) => set("nif", e.target.value)} placeholder="Para facturación" className="mt-1" />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Ciudad" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle y número" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Notas internas</Label>
                <Input value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Observaciones sobre el cliente" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Guardando…" : "Crear cliente"}</Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
