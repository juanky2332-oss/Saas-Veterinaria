import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NuevoPresupuestoForm } from "./nuevo-presupuesto-form";

export const metadata = { title: "Nuevo presupuesto — Clinicomatic" };

export default async function NuevoPresupuestoPage() {
  const supabase = await createClient();
  const [pacientesRes, tratamientosRes, settingsRes] = await Promise.all([
    supabase.from("patients").select("id, nombre, apellidos, dni, direccion").is("deleted_at", null).order("nombre").limit(500),
    supabase.from("treatments").select("nombre, precio_orientativo").eq("activo", true).order("nombre"),
    supabase.from("billing_settings").select("iva_default").maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link href="/presupuestos" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> Presupuestos
      </Link>
      <NuevoPresupuestoForm
        pacientes={pacientesRes.data ?? []}
        tratamientos={tratamientosRes.data ?? []}
        ivaDefault={Number(settingsRes.data?.iva_default ?? 21)}
      />
    </div>
  );
}
