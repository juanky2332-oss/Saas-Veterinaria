"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgId, currentUserHasRole } from "@/lib/auth/org";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Guarda la identidad visual de la clínica (colores + logo). Owner/admin. */
export async function guardarApariencia(input: {
  brand_color: string | null;
  accent_color: string | null;
  logo_path?: string | null;
}): Promise<{ error?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden cambiar la apariencia." };
  }
  if (input.brand_color && !HEX.test(input.brand_color)) return { error: "Color primario no válido." };
  if (input.accent_color && !HEX.test(input.accent_color)) return { error: "Color de acento no válido." };

  const orgId = await getOrgId();
  const supabase = await createClient();

  const update: { brand_color: string | null; accent_color: string | null; logo_path?: string | null } = {
    brand_color: input.brand_color,
    accent_color: input.accent_color,
  };
  if (input.logo_path !== undefined) update.logo_path = input.logo_path;

  const { error } = await supabase.from("organizations").update(update).eq("id", orgId);
  if (error) return { error: "No se pudo guardar la apariencia." };

  revalidatePath("/", "layout");
  return {};
}

/** Guarda la zona horaria de la clínica (afecta a la agenda). Owner/admin. */
export async function guardarZonaHoraria(timezone: string): Promise<{ error?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden cambiar la zona horaria." };
  }
  if (!timezone || timezone.length > 64) return { error: "Zona horaria no válida." };
  const orgId = await getOrgId();
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ timezone }).eq("id", orgId);
  if (error) return { error: "No se pudo guardar la zona horaria." };
  revalidatePath("/", "layout");
  return {};
}
