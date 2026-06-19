import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NuevaFacturaForm } from "./nueva-factura-form";

export const metadata = { title: "Nueva factura — Clinicomatic" };

export default async function NuevaFacturaPage() {
  const supabase = await createClient();

  const [pacientesRes, tratamientosRes, settingsRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id, nombre, apellidos, dni, direccion, telefono")
      .is("deleted_at", null)
      .order("nombre")
      .limit(500),
    supabase
      .from("treatments")
      .select("nombre, precio_orientativo")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("billing_settings").select("serie, proximo_numero, iva_default").maybeSingle(),
  ]);

  const serie = settingsRes.data?.serie ?? "A";
  const proximo = settingsRes.data?.proximo_numero ?? 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link href="/facturacion" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> Facturas de venta
      </Link>
      <NuevaFacturaForm
        pacientes={pacientesRes.data ?? []}
        tratamientos={tratamientosRes.data ?? []}
        numeroPreview={`${serie}-${String(proximo).padStart(4, "0")}`}
        ivaDefault={Number(settingsRes.data?.iva_default ?? 21)}
      />
    </div>
  );
}
