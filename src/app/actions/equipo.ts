"use server";

import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { getOrgId, currentUserHasRole } from "@/lib/auth/org";
import { revalidatePath } from "next/cache";

const ROLES = ["owner", "admin", "profesional", "recepcion", "contable"] as const;
type Rol = (typeof ROLES)[number];
const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Invita a un miembro al equipo de la clínica (crea usuario + perfil con rol). */
export async function invitarMiembro(email: string, nombre: string, rol: string): Promise<{ error?: string; ok?: boolean }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) return { error: "No tienes permisos para invitar." };
  if (!email || !email.includes("@")) return { error: "Email no válido." };
  if (!ROLES.includes(rol as Rol) || rol === "owner") return { error: "Rol no válido." };

  const orgId = await getOrgId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = getServiceClient() as any;

  const { data, error } = await svc.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP}/auth/callback?next=/dashboard`,
  });
  const userId = data?.user?.id as string | undefined;
  if (error || !userId) return { error: "No se pudo invitar. ¿Ese email ya tiene cuenta?" };

  // service_role: organization_id explícito (sin sesión, el trigger no lo rellena)
  const { error: pErr } = await svc.from("profiles").upsert({
    id: userId,
    nombre: nombre || email.split("@")[0],
    rol,
    organization_id: orgId,
    activo: true,
  });
  if (pErr) return { error: "Usuario invitado pero no se pudo asignar a la clínica." };

  revalidatePath("/configuracion/equipo");
  return { ok: true };
}

/** Cambia el rol de un miembro (RLS exige owner/admin de la misma organización). */
export async function cambiarRol(userId: string, rol: string): Promise<{ error?: string }> {
  if (!ROLES.includes(rol as Rol)) return { error: "Rol no válido." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ rol: rol as Rol }).eq("id", userId);
  if (error) return { error: "No se pudo cambiar el rol." };
  revalidatePath("/configuracion/equipo");
  return {};
}

/** Activa/desactiva un miembro. */
export async function toggleActivoMiembro(userId: string, activo: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ activo }).eq("id", userId);
  if (error) return { error: "No se pudo actualizar el miembro." };
  revalidatePath("/configuracion/equipo");
  return {};
}
