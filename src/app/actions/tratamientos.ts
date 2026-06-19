"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TratamientoSchema = z.object({
  nombre: z.string().min(2),
  categoria: z.enum(["facial", "corporal", "capilar", "otro", "dental", "medicina", "fisioterapia", "bienestar"]),
  duracion_min: z.coerce.number().min(5).max(480),
  precio_orientativo: z.coerce.number().min(0).nullable(),
  periodicidad_meses: z.coerce.number().min(1).max(36).nullable(),
  activo: z.boolean().default(true),
});

export type TratamientoInput = z.infer<typeof TratamientoSchema>;

export async function crearTratamiento(data: TratamientoInput) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = TratamientoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Datos inválidos: " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }

  const { error } = await db.from("treatments").insert({
    nombre: parsed.data.nombre,
    categoria: parsed.data.categoria,
    duracion_min: Math.round(parsed.data.duracion_min),
    precio_orientativo: parsed.data.precio_orientativo,
    periodicidad_meses: parsed.data.periodicidad_meses ? Math.round(parsed.data.periodicidad_meses) : null,
    activo: parsed.data.activo,
  });

  if (error) return { error: error.message };
  revalidatePath("/configuracion/tratamientos");
  return { ok: true };
}

export async function actualizarTratamiento(id: string, data: TratamientoInput) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = TratamientoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const { error } = await db.from("treatments").update({
    nombre: parsed.data.nombre,
    categoria: parsed.data.categoria,
    duracion_min: Math.round(parsed.data.duracion_min),
    precio_orientativo: parsed.data.precio_orientativo,
    periodicidad_meses: parsed.data.periodicidad_meses ? Math.round(parsed.data.periodicidad_meses) : null,
    activo: parsed.data.activo,
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/configuracion/tratamientos");
  return { ok: true };
}

export async function toggleTratamientoActivo(id: string, activo: boolean) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("treatments").update({ activo }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/configuracion/tratamientos");
  revalidatePath("/pacientes");
  return { ok: true };
}

// ── Asignar tratamiento a paciente ─────────────────────────────────────
 export async function asignarTratamientoAPaciente(data: {
  patient_id: string;
  treatment_id: string;
  periodicidad_meses: number;
  ultima_sesion_at?: string;
}) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  if (!data.patient_id || !data.treatment_id) {
    return { error: "Faltan datos obligatorios" };
  }
  if (!data.periodicidad_meses || data.periodicidad_meses < 1) {
    return { error: "La periodicidad debe ser al menos 1 mes" };
  }

  // Comprobar si ya existe
  const { data: existing } = await db
    .from("patient_treatments")
    .select("id")
    .eq("patient_id", data.patient_id)
    .eq("treatment_id", data.treatment_id)
    .maybeSingle();

  let error;
  if (existing) {
    // Actualizar periodicidad
    const { error: updateError } = await db
      .from("patient_treatments")
      .update({
        periodicidad_meses: Math.round(data.periodicidad_meses),
        ultima_sesion_at: data.ultima_sesion_at ?? null,
        estado: "activo",
      })
      .eq("id", existing.id);
    error = updateError;
  } else {
    // Insertar nuevo
    const { error: insertError } = await db
      .from("patient_treatments")
      .insert({
        patient_id: data.patient_id,
        treatment_id: data.treatment_id,
        periodicidad_meses: Math.round(data.periodicidad_meses),
        ultima_sesion_at: data.ultima_sesion_at ?? null,
        estado: "activo",
      });
    error = insertError;
  }

  if (error) return { error: error.message as string };
  revalidatePath(`/pacientes/${data.patient_id}`);
  return { ok: true };
}

// ── Registrar visita clínica ────────────────────────────────────────
 export async function registrarVisita(data: {
  patient_id: string;
  appointment_id?: string;
  treatment_ids: string[];
  informe: {
    motivo: string;
    tratamiento: string;
    producto_lote: string;
    observaciones: string;
    pauta_seguimiento: string;
  };
  notas?: string;
  fecha_visita: string;
  origen?: "voz" | "escrito";
}) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 1. Si no viene de una cita existente, se crea la visita en la agenda
  //    (completada) para que quede SIEMPRE registrada en el historial.
  let appointmentId = data.appointment_id ?? null;
  if (!appointmentId) {
    const inicio = new Date(data.fecha_visita);
    const fin = new Date(inicio.getTime() + 45 * 60000);
    const { data: cita, error: citaError } = await db
      .from("appointments")
      .insert({
        patient_id: data.patient_id,
        treatment_id: data.treatment_ids[0] ?? null,
        doctora_id: user.id,
        sala: 1,
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        estado: "completada",
        origen: "manual",
        notas: data.notas ?? null,
      })
      .select("id")
      .single();
    if (citaError) return { error: citaError.message as string };
    appointmentId = (cita as { id: string }).id;
  }

  // 2. Crear informe clínico vinculado a la visita
  const { data: report, error: reportError } = await db
    .from("clinical_reports")
    .insert({
      patient_id: data.patient_id,
      appointment_id: appointmentId,
      doctora_id: user.id,
      contenido: data.informe,
      transcripcion_origen: data.origen ?? "escrito",
      version: 1,
    })
    .select("id")
    .single();

  if (reportError) return { error: reportError.message as string };

  // 3. Registrar el tratamiento en la ficha del paciente: si ya lo tiene asignado
  //    actualiza la última sesión; si NO, lo crea (para que aparezca en su pestaña
  //    de Tratamientos). Cada tratamiento distinto es una entrada activa propia.
  for (const treatmentId of data.treatment_ids) {
    const { data: pt } = await db
      .from("patient_treatments")
      .select("id")
      .eq("patient_id", data.patient_id)
      .eq("treatment_id", treatmentId)
      .maybeSingle();
    if (pt) {
      await db
        .from("patient_treatments")
        .update({ ultima_sesion_at: data.fecha_visita, estado: "activo" })
        .eq("id", (pt as { id: string }).id);
    } else {
      const { data: tr } = await db
        .from("treatments")
        .select("periodicidad_meses")
        .eq("id", treatmentId)
        .maybeSingle();
      await db.from("patient_treatments").insert({
        patient_id: data.patient_id,
        treatment_id: treatmentId,
        periodicidad_meses: (tr?.periodicidad_meses as number | null) ?? 3,
        ultima_sesion_at: data.fecha_visita,
        estado: "activo",
      });
    }
  }

  // 4. Marcar la cita original como completada si procede
  if (data.appointment_id) {
    await db
      .from("appointments")
      .update({ estado: "completada", notas: data.notas ?? null })
      .eq("id", data.appointment_id);
  }

  revalidatePath(`/pacientes/${data.patient_id}`);
  revalidatePath("/agenda");
  return { ok: true, reportId: (report as { id: string }).id };
}
