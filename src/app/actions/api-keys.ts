"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { currentUserHasRole } from "@/lib/auth/org";

const SCOPES_VALIDOS = ["patients:read", "appointments:read", "appointments:write", "*"];

/**
 * Genera una API key para integrar otras aplicaciones (CRM, facturación,
 * pacientes…). La clave en claro SOLO se devuelve aquí una vez; en BBDD se
 * guarda su hash SHA-256.
 */
export async function generarApiKey(
  nombre: string,
  scopes: string[],
): Promise<{ error?: string; key?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden crear claves." };
  }
  if (!nombre.trim()) return { error: "Ponle un nombre a la clave (ej. 'Integración web')." };
  const limpios = scopes.filter((s) => SCOPES_VALIDOS.includes(s));
  if (limpios.length === 0) return { error: "Selecciona al menos un permiso." };

  const key = `cf_${crypto.randomBytes(24).toString("base64url")}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").insert({
    nombre: nombre.trim(),
    hash_key: hash,
    scopes: limpios,
    activo: true,
  });
  if (error) return { error: "No se pudo crear la clave." };

  revalidatePath("/configuracion/api");
  return { key };
}

export async function revocarApiKey(id: string, activo: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").update({ activo }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la clave." };
  revalidatePath("/configuracion/api");
  return {};
}

export async function eliminarApiKey(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la clave." };
  revalidatePath("/configuracion/api");
  return {};
}
