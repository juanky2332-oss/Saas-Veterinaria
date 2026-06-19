"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "clinica";
}

export type OnboardingState = { error?: string } | null;

/** Crea la organización (clínica) y el perfil owner para el usuario actual. */
export async function crearClinica(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? "general");
  const especialidad = String(formData.get("especialidad") ?? "").trim();
  const tuNombre = String(formData.get("tu_nombre") ?? "").trim();

  if (!nombre) return { error: "El nombre de la clínica es obligatorio." };
  if (!["general", "dental", "estetica", "fisioterapia", "psicologia", "veterinaria"].includes(vertical)) {
    return { error: "Tipo de clínica no válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = `${slugify(nombre)}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase.rpc("create_organization_with_owner", {
    p_org_name: nombre,
    p_slug: slug,
    p_vertical: vertical,
    p_user_name: tuNombre || user.email || "Propietario",
  });

  if (error) return { error: "No se pudo crear la clínica. Inténtalo de nuevo." };

  // Guardamos la especialidad concreta (etiqueta fina) si se eligió.
  if (especialidad) {
    await supabase.from("organizations").update({ especialidad }).eq("slug", slug);
  }

  redirect("/dashboard");
}
