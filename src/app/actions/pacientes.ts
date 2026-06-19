"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Activa/desactiva los recordatorios automáticos de WhatsApp para un paciente. */
export async function toggleRecordatoriosWa(patientId: string, activo: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({ recordatorios_wa: activo })
    .eq("id", patientId);
  if (error) return { error: "No se pudo actualizar el ajuste de recordatorios." };
  revalidatePath(`/pacientes/${patientId}`);
  return {};
}

/** Datos médicos estructurados de la ficha del paciente. */
export interface DatosMedicosInput {
  antecedentes: string | null;
  alergias: string | null;
  medicacion: string | null;
  grupo_sanguineo: string | null;
  profesion: string | null;
  mutua: string | null;
  num_poliza: string | null;
}

const norm = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

/** Guarda los datos médicos de un paciente. */
export async function guardarDatosMedicos(
  patientId: string,
  input: DatosMedicosInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({
      antecedentes: norm(input.antecedentes),
      alergias: norm(input.alergias),
      medicacion: norm(input.medicacion),
      grupo_sanguineo: norm(input.grupo_sanguineo),
      profesion: norm(input.profesion),
      mutua: norm(input.mutua),
      num_poliza: norm(input.num_poliza),
    })
    .eq("id", patientId);
  if (error) return { error: "No se pudieron guardar los datos médicos." };
  revalidatePath(`/pacientes/${patientId}`);
  return {};
}

/** Una medición biométrica (los campos numéricos llegan como número o null). */
export interface MetricaInput {
  fecha: string;
  peso: number | null;
  altura: number | null;
  tension_sis: number | null;
  tension_dia: number | null;
  grasa_pct: number | null;
  notas: string | null;
}

/** Registra una medición biométrica. El IMC se calcula a partir de peso y altura. */
export async function registrarMetrica(
  patientId: string,
  input: MetricaInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const peso = Number.isFinite(input.peso as number) ? input.peso : null;
  const altura = Number.isFinite(input.altura as number) ? input.altura : null;
  let imc: number | null = null;
  if (peso && altura && altura > 0) {
    const m = altura / 100; // cm → m
    imc = Math.round((peso / (m * m)) * 10) / 10;
  }

  const { error } = await supabase.from("patient_metrics").insert({
    patient_id: patientId,
    fecha: input.fecha,
    peso,
    altura,
    imc,
    tension_sis: input.tension_sis,
    tension_dia: input.tension_dia,
    grasa_pct: input.grasa_pct,
    notas: norm(input.notas),
  });
  if (error) return { error: "No se pudo registrar la medición." };
  revalidatePath(`/pacientes/${patientId}`);
  return {};
}

/** Elimina una medición biométrica. */
export async function eliminarMetrica(
  patientId: string,
  metricaId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("patient_metrics").delete().eq("id", metricaId);
  if (error) return { error: "No se pudo eliminar la medición." };
  revalidatePath(`/pacientes/${patientId}`);
  return {};
}
