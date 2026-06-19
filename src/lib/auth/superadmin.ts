import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/org";

/**
 * Guards de plataforma (superadmin). El superadmin opera por ENCIMA de los
 * tenants: ve todas las organizaciones, usuarios, métricas y afiliados. Las
 * páginas /superadmin usan `createServiceClient()` (salta RLS) tras pasar
 * estos guards.
 */

/** ¿El usuario actual es superadmin de la plataforma? */
export async function isCurrentUserSuperadmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return Boolean(profile?.is_superadmin);
}

/** Exige superadmin; si no, redirige. Devuelve el id del usuario. */
export async function requireSuperadmin(): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_superadmin) redirect("/dashboard");
  return profile.id;
}
