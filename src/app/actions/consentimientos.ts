"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { currentUserHasRole } from "@/lib/auth/org";
import { PLANTILLAS_CONSENTIMIENTO } from "@/lib/consentimientos/plantillas";
import type { Json } from "@/lib/database.types";

async function puede(): Promise<boolean> {
  return currentUserHasRole(["owner", "admin", "profesional"]);
}

export interface PlantillaInput {
  titulo: string;
  cuerpo_richtext: string;
  especialidad?: string | null;
  variables?: { clave: string; label: string }[];
}

/** Crea una plantilla de consentimiento personalizada (editor de texto). */
export async function crearPlantilla(input: PlantillaInput): Promise<{ error?: string; id?: string }> {
  if (!(await puede())) return { error: "No tienes permisos para gestionar plantillas." };
  if (!input.titulo.trim()) return { error: "El título es obligatorio." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consent_templates")
    .insert({
      titulo: input.titulo.trim(),
      cuerpo_richtext: input.cuerpo_richtext ?? "",
      especialidad: input.especialidad ?? null,
      variables: (input.variables ?? []) as unknown as Json,
      tipo: "personalizada",
    })
    .select("id")
    .single();
  if (error) return { error: "No se pudo crear la plantilla." };
  revalidatePath("/configuracion/consentimientos");
  return { id: data.id };
}

/** Actualiza el contenido de una plantilla. */
export async function actualizarPlantilla(id: string, input: PlantillaInput): Promise<{ error?: string }> {
  if (!(await puede())) return { error: "No tienes permisos para gestionar plantillas." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("consent_templates")
    .update({
      titulo: input.titulo.trim(),
      cuerpo_richtext: input.cuerpo_richtext ?? "",
      especialidad: input.especialidad ?? null,
      variables: (input.variables ?? []) as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar la plantilla." };
  revalidatePath("/configuracion/consentimientos");
  return {};
}

export async function eliminarPlantilla(id: string): Promise<{ error?: string }> {
  if (!(await puede())) return { error: "No tienes permisos." };
  const supabase = await createClient();
  const { error } = await supabase.from("consent_templates").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la plantilla." };
  revalidatePath("/configuracion/consentimientos");
  return {};
}

/** Añade a la organización una plantilla de la biblioteca predefinida (de la investigación legal). */
export async function anadirDesdeBiblioteca(plantillaId: string): Promise<{ error?: string; id?: string }> {
  if (!(await puede())) return { error: "No tienes permisos." };
  const base = PLANTILLAS_CONSENTIMIENTO.find((p) => p.id === plantillaId);
  if (!base) return { error: "Plantilla no encontrada." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consent_templates")
    .insert({
      titulo: base.titulo,
      cuerpo_richtext: base.cuerpoHtml,
      especialidad: base.especialidad,
      variables: base.variables as unknown as Json,
      tipo: "predefinida",
    })
    .select("id")
    .single();
  if (error) return { error: "No se pudo añadir la plantilla." };
  revalidatePath("/configuracion/consentimientos");
  return { id: data.id };
}

/** Registra una plantilla subida (Word/PDF) tras subir el archivo a Storage. */
export async function registrarPlantillaArchivo(input: { titulo: string; archivo_path: string }): Promise<{ error?: string }> {
  if (!(await puede())) return { error: "No tienes permisos." };
  if (!input.titulo.trim() || !input.archivo_path) return { error: "Faltan datos del archivo." };
  const supabase = await createClient();
  const { error } = await supabase.from("consent_templates").insert({
    titulo: input.titulo.trim(),
    cuerpo_richtext: "",
    archivo_path: input.archivo_path,
    tipo: "subida",
  });
  if (error) return { error: "No se pudo registrar el documento." };
  revalidatePath("/configuracion/consentimientos");
  return {};
}
