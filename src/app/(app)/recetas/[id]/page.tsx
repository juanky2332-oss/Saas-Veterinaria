import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/org";
import { RecetaDoc } from "./receta-doc";

export const metadata = { title: "Receta — Clinicomatic" };

export default async function RecetaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [recetaRes, settingsRes, org] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, fecha, diagnostico, observaciones, recipe_items(id, medicamento, posologia, duracion, cantidad, observaciones), patients(nombre, apellidos, dni, fecha_nacimiento), profiles!doctora_id(nombre)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("billing_settings").select("razon_social, nif, direccion").maybeSingle(),
    getCurrentOrg(),
  ]);

  const r = recetaRes.data;
  if (!r) notFound();

  const paciente = r.patients as { nombre: string; apellidos: string; dni: string | null; fecha_nacimiento: string | null } | null;
  const doctora = (r.profiles as { nombre: string } | null)?.nombre ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <Link href="/recetas" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text)] print:hidden">
        <ArrowLeft size={15} /> Recetas
      </Link>
      <RecetaDoc
        receta={{
          id: r.id,
          fecha: r.fecha,
          diagnostico: r.diagnostico,
          observaciones: r.observaciones,
          items: (r.recipe_items ?? []) as never,
          paciente,
          doctora,
        }}
        emisor={{
          nombre: settingsRes.data?.razon_social || org?.nombre || "Mi clínica",
          nif: settingsRes.data?.nif ?? null,
          direccion: settingsRes.data?.direccion ?? null,
          logoUrl: org?.logo_path ?? null,
          brandColor: org?.brand_color ?? "#0e9f8e",
        }}
      />
    </div>
  );
}
