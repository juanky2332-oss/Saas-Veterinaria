"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const HEX = /^#[0-9a-fA-F]{6}$/;

/* ───────────────────────── Etapas ───────────────────────── */

export async function crearEtapa(nombre: string, color: string): Promise<{ error?: string }> {
  if (!nombre.trim()) return { error: "La etapa necesita un nombre." };
  if (!HEX.test(color)) return { error: "Color no válido." };
  const supabase = await createClient();

  const { data: pipeline } = await supabase.from("crm_pipelines").select("id").limit(1).maybeSingle();
  if (!pipeline) return { error: "No hay pipeline. Recarga la página." };

  const { data: last } = await supabase
    .from("crm_stages")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("crm_stages").insert({
    pipeline_id: pipeline.id,
    nombre: nombre.trim(),
    color,
    orden: (last?.orden ?? -1) + 1,
  });
  if (error) return { error: "No se pudo crear la etapa." };
  revalidatePath("/crm");
  return {};
}

export async function actualizarEtapa(
  id: string,
  patch: { nombre?: string; color?: string },
): Promise<{ error?: string }> {
  if (patch.nombre !== undefined && !patch.nombre.trim()) return { error: "El nombre no puede estar vacío." };
  if (patch.color !== undefined && !HEX.test(patch.color)) return { error: "Color no válido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_stages")
    .update({ ...(patch.nombre !== undefined && { nombre: patch.nombre.trim() }), ...(patch.color !== undefined && { color: patch.color }) })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar la etapa." };
  revalidatePath("/crm");
  return {};
}

/** Intercambia el orden con la etapa vecina (dir = -1 izquierda, +1 derecha). */
export async function moverEtapa(id: string, dir: -1 | 1): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: etapas } = await supabase.from("crm_stages").select("id, orden").order("orden");
  if (!etapas) return { error: "No se pudo leer el pipeline." };
  const idx = etapas.findIndex((e) => e.id === id);
  const vecino = etapas[idx + dir];
  if (idx < 0 || !vecino) return {};
  const actual = etapas[idx];
  const [r1, r2] = await Promise.all([
    supabase.from("crm_stages").update({ orden: vecino.orden }).eq("id", actual.id),
    supabase.from("crm_stages").update({ orden: actual.orden }).eq("id", vecino.id),
  ]);
  if (r1.error || r2.error) return { error: "No se pudo mover la etapa." };
  revalidatePath("/crm");
  return {};
}

export async function eliminarEtapa(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("crm_opportunities")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", id);
  if ((count ?? 0) > 0) return { error: "Mueve antes las oportunidades de esta etapa." };
  const { error } = await supabase.from("crm_stages").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la etapa." };
  revalidatePath("/crm");
  return {};
}

/* ─────────────────────── Oportunidades ─────────────────────── */

const oppSchema = z.object({
  stage_id: z.string().uuid(),
  nombre_contacto: z.string().min(1, "El nombre es obligatorio."),
  telefono: z.string().optional(),
  email: z.string().email("Email no válido").optional().or(z.literal("")),
  valor: z.coerce.number().min(0).optional().nullable(),
  origen: z.string().optional(),
  notas: z.string().optional(),
  color: z.string().regex(HEX).optional().nullable(),
});

export type OportunidadInput = z.infer<typeof oppSchema>;

export async function crearOportunidad(input: OportunidadInput): Promise<{ error?: string }> {
  const parsed = oppSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("crm_opportunities").insert({
    stage_id: d.stage_id,
    nombre_contacto: d.nombre_contacto.trim(),
    telefono: d.telefono?.trim() || null,
    email: d.email?.trim() || null,
    valor: d.valor ?? null,
    origen: d.origen?.trim() || "manual",
    notas: d.notas?.trim() || null,
    color: d.color ?? null,
  });
  if (error) return { error: "No se pudo crear la oportunidad." };
  revalidatePath("/crm");
  return {};
}

export async function actualizarOportunidad(
  id: string,
  input: Partial<OportunidadInput>,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const patch: {
    stage_id?: string;
    nombre_contacto?: string;
    telefono?: string | null;
    email?: string | null;
    valor?: number | null;
    origen?: string | null;
    notas?: string | null;
    color?: string | null;
  } = {};
  if (input.stage_id !== undefined) patch.stage_id = input.stage_id;
  if (input.nombre_contacto !== undefined) {
    if (!input.nombre_contacto.trim()) return { error: "El nombre es obligatorio." };
    patch.nombre_contacto = input.nombre_contacto.trim();
  }
  if (input.telefono !== undefined) patch.telefono = input.telefono?.trim() || null;
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.valor !== undefined) patch.valor = input.valor ?? null;
  if (input.origen !== undefined) patch.origen = input.origen?.trim() || null;
  if (input.notas !== undefined) patch.notas = input.notas?.trim() || null;
  if (input.color !== undefined) patch.color = input.color ?? null;

  const { error } = await supabase.from("crm_opportunities").update(patch).eq("id", id);
  if (error) return { error: "No se pudo guardar la oportunidad." };
  revalidatePath("/crm");
  return {};
}

export async function moverOportunidad(id: string, stageId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_opportunities").update({ stage_id: stageId }).eq("id", id);
  if (error) return { error: "No se pudo mover la oportunidad." };
  revalidatePath("/crm");
  return {};
}

export async function eliminarOportunidad(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_opportunities").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la oportunidad." };
  revalidatePath("/crm");
  return {};
}

/** Convierte la oportunidad en paciente (o la vincula si ya existe por teléfono). */
export async function convertirEnPaciente(id: string): Promise<{ error?: string; patientId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_paciente_desde_oportunidad", { oportunidad_id: id });
  if (error || !data) return { error: "No se pudo convertir en paciente." };
  revalidatePath("/crm");
  return { patientId: data };
}
