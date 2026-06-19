"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgId, getCurrentOrg, currentUserHasRole } from "@/lib/auth/org";
import {
  FEATURES,
  resolveFeatures,
  diffFromPreset,
  type FeatureKey,
  type FeatureState,
} from "@/lib/features";

const KEYS = new Set<string>(FEATURES.map((f) => f.key));

/**
 * Guarda qué funciones (módulos + secciones de ficha) están activas para la
 * clínica. El cliente envía el estado completo; persistimos solo los overrides
 * que difieren del preset del vertical, para que cambiar de especialidad siga
 * teniendo sentido. Owner/admin.
 */
export async function guardarFunciones(
  state: Partial<Record<FeatureKey, boolean>>,
): Promise<{ error?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden cambiar las funciones." };
  }

  const org = await getCurrentOrg();
  // Partimos del estado por defecto del vertical y aplicamos lo que envía el cliente.
  const full: FeatureState = resolveFeatures(org?.vertical, {});
  for (const [k, v] of Object.entries(state)) {
    if (KEYS.has(k) && typeof v === "boolean") full[k as FeatureKey] = v;
  }
  const overrides = diffFromPreset(org?.vertical, full);

  const orgId = await getOrgId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ features: overrides })
    .eq("id", orgId);
  if (error) return { error: "No se pudieron guardar las funciones." };

  revalidatePath("/", "layout");
  return {};
}
