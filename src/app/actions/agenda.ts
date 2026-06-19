"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getOrgId } from "@/lib/auth/org";
import type { Database } from "@/lib/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita"];

/** Duración válida de una cita en minutos (5 min – 10 h). */
const clampDuracion = (min: number) => Math.min(Math.max(Math.round(min || 30), 5), 600);

/** Crea una cita en la agenda (cita rápida). doctora_id por defecto = usuario actual. */
export async function crearCita(input: {
  patient_id: string;
  treatment_id?: string | null;
  doctora_id?: string | null;
  sala: number;
  inicio: string; // ISO
  duracion_min: number;
  estado?: EstadoCita;
  notas?: string;
}): Promise<{ error?: string; id?: string }> {
  if (!input.patient_id) return { error: "Selecciona un paciente." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const doctora = input.doctora_id || user?.id;
  if (!doctora) return { error: "No hay profesional asignado." };

  const inicio = new Date(input.inicio);
  if (Number.isNaN(inicio.getTime())) return { error: "Fecha u hora no válida." };
  const fin = new Date(inicio.getTime() + clampDuracion(input.duracion_min) * 60000);
  const organization_id = await getOrgId();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      organization_id,
      patient_id: input.patient_id,
      treatment_id: input.treatment_id || null,
      doctora_id: doctora,
      sala: input.sala || 1,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      estado: input.estado ?? "confirmada",
      origen: "manual",
      notas: input.notas || null,
    })
    .select("id")
    .single();
  if (error) return { error: "No se pudo crear la cita." };

  revalidatePath("/agenda");
  return { id: data.id };
}

/** Cambia el estado de una cita (confirmar, completar, cancelar, no-show…). */
export async function actualizarEstadoCita(id: string, estado: EstadoCita): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ estado }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la cita." };
  revalidatePath("/agenda");
  return {};
}

/** Reprograma una cita (cambiar inicio/duración/sala) — usado por arrastrar o editar. */
export async function moverCita(input: {
  id: string;
  inicio: string;
  duracion_min: number;
  sala?: number;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const inicio = new Date(input.inicio);
  if (Number.isNaN(inicio.getTime())) return { error: "Fecha u hora no válida." };
  const fin = new Date(inicio.getTime() + clampDuracion(input.duracion_min) * 60000);
  const update: { inicio: string; fin: string; sala?: number } = {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
  };
  if (input.sala) update.sala = input.sala;
  const { error } = await supabase.from("appointments").update(update).eq("id", input.id);
  if (error) return { error: "No se pudo reprogramar la cita." };
  revalidatePath("/agenda");
  return {};
}
