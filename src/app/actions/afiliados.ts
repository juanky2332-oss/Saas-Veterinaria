"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/org";

function slugCodigo(nombre: string): string {
  const base = nombre
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "AFIL";
  const suf = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suf}`;
}

export async function registrarmeComoAfiliado(input: {
  nombre: string;
  email: string;
  metodo_pago: string;
  cuenta_pago: string;
}): Promise<{ error?: string; codigo?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const profile = await getCurrentProfile();

  // ¿Ya es afiliado?
  const { data: existente } = await supabase.from("affiliates").select("id").eq("user_id", user.id).maybeSingle();
  if (existente) return { error: "Ya estás dado de alta como afiliado." };

  if (!input.nombre.trim()) return { error: "Indica tu nombre." };
  if (!input.email.trim()) return { error: "Indica un email de contacto." };

  // Genera un código único (reintenta ante colisión)
  let codigo = slugCodigo(input.nombre);
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase.from("affiliates").select("id").eq("codigo", codigo).maybeSingle();
    if (!clash) break;
    codigo = slugCodigo(input.nombre);
  }

  const { error } = await supabase.from("affiliates").insert({
    user_id: user.id,
    organization_id: profile?.organization_id ?? null,
    nombre: input.nombre.trim(),
    email: input.email.trim(),
    codigo,
    datos_pago: { metodo: input.metodo_pago, cuenta: input.cuenta_pago },
  });
  if (error) return { error: "No se pudo completar el alta de afiliado." };

  revalidatePath("/afiliados");
  return { codigo };
}

export async function actualizarDatosPago(input: { metodo_pago: string; cuenta_pago: string }): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };
  const { error } = await supabase
    .from("affiliates")
    .update({ datos_pago: { metodo: input.metodo_pago, cuenta: input.cuenta_pago } })
    .eq("user_id", user.id);
  if (error) return { error: "No se pudieron guardar los datos de pago." };
  revalidatePath("/afiliados");
  return {};
}
