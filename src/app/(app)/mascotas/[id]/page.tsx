import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { FichaMascota } from "@/components/modules/mascotas/ficha-mascota";
import { getFeatures } from "@/lib/auth/org";
import { PawPrint } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("mascotas").select("nombre").eq("id", id).maybeSingle();
  return { title: data ? `${data.nombre} — Veteriblandenguer` : "Mascota" };
}

export default async function FichaMascotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const features = await getFeatures();

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("*, clientes(id, nombre, apellidos, telefono, email)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!mascota) notFound();

  const [{ data: historia }, { data: vacunaciones }, { data: desparasitaciones }] = await Promise.all([
    supabase.from("historia_clinica_vet").select("*").eq("mascota_id", id).order("fecha", { ascending: false }),
    supabase.from("vacunaciones_vet").select("*").eq("mascota_id", id).order("fecha_aplicacion", { ascending: false }),
    supabase.from("desparasitaciones_vet").select("*").eq("mascota_id", id).order("fecha_aplicacion", { ascending: false }),
  ]);

  const especie = mascota.especie?.charAt(0).toUpperCase() + (mascota.especie?.slice(1) ?? "");

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={mascota.nombre}
        back="/mascotas"
        subtitle={`${especie}${mascota.raza ? ` · ${mascota.raza}` : ""}`}
        icon={<PawPrint className="size-5 text-[var(--brand)]" />}
      />
      <div className="flex-1 p-4 md:p-6">
        <FichaMascota
          mascota={mascota}
          historia={historia ?? []}
          vacunaciones={vacunaciones ?? []}
          desparasitaciones={desparasitaciones ?? []}
          features={features}
        />
      </div>
    </div>
  );
}
