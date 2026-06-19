"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface RecetaItemInput {
  medicamento: string;
  posologia?: string;
  duracion?: string;
  cantidad?: string;
  observaciones?: string;
}

export interface RecetaInput {
  patient_id: string;
  fecha?: string;
  diagnostico?: string;
  observaciones?: string;
  items: RecetaItemInput[];
}

/** Crea una receta con sus líneas de medicación. */
export async function crearReceta(input: RecetaInput): Promise<{ error?: string; id?: string }> {
  if (!input.patient_id) return { error: "Falta el paciente." };
  const items = (input.items ?? []).filter((it) => it.medicamento?.trim());
  if (items.length === 0) return { error: "Añade al menos un medicamento." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rec, error } = await supabase
    .from("recipes")
    .insert({
      patient_id: input.patient_id,
      doctora_id: user?.id ?? null,
      fecha: input.fecha || undefined,
      diagnostico: input.diagnostico?.trim() || null,
      observaciones: input.observaciones?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !rec) return { error: "No se pudo crear la receta." };

  const { error: itErr } = await supabase.from("recipe_items").insert(
    items.map((it) => ({
      recipe_id: rec.id,
      medicamento: it.medicamento.trim(),
      posologia: it.posologia?.trim() || null,
      duracion: it.duracion?.trim() || null,
      cantidad: it.cantidad?.trim() || null,
      observaciones: it.observaciones?.trim() || null,
    })),
  );
  if (itErr) return { error: "Receta creada, pero fallaron las líneas." };

  revalidatePath(`/pacientes/${input.patient_id}`);
  revalidatePath("/recetas");
  return { id: rec.id };
}

export async function eliminarReceta(id: string, patientId?: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la receta." };
  if (patientId) revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/recetas");
  return {};
}
