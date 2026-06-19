import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { resolveFeatures, type FeatureState } from "@/lib/features";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type Rol = Database["public"]["Enums"]["rol_usuario"];

/**
 * Helpers de tenancy para Server Components / Server Actions / Route Handlers.
 * La RLS ya aísla por organización en BBDD; estos helpers dan el contexto en el
 * servidor (organization_id, rol) para las consultas y los guards de la app.
 */

/** Perfil del usuario autenticado (incluye organization_id y rol). null si no hay sesión/perfil. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
}

/** organization_id del usuario actual; lanza si no hay sesión o no pertenece a una organización. */
export async function getOrgId(): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile?.organization_id) {
    throw new Error("Sin organización: el usuario no pertenece a ninguna clínica.");
  }
  return profile.organization_id;
}

/** organization_id del usuario actual o null (sin lanzar) — útil para redirigir a onboarding. */
export async function getOrgIdOrNull(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.organization_id ?? null;
}

/** Organización completa del usuario actual (marca, plan, suscripción…). null si no aplica. */
export async function getCurrentOrg(): Promise<Organization | null> {
  const orgId = await getOrgIdOrNull();
  if (!orgId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  return data ?? null;
}

/** ¿El usuario actual tiene alguno de estos roles? */
export async function currentUserHasRole(roles: Rol[]): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile ? roles.includes(profile.rol) : false;
}

/**
 * Funciones (módulos + secciones de ficha) activas para la organización actual,
 * resueltas a partir de su vertical y de los overrides guardados en `features`.
 * Si no hay organización, devuelve el preset "general".
 */
export async function getFeatures(): Promise<FeatureState> {
  const org = await getCurrentOrg();
  return resolveFeatures(org?.vertical, org?.features);
}
