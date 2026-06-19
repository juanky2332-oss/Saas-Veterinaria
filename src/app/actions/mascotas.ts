"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/auth/org";

export interface MascotaInput {
  cliente_id?: string | null;
  nombre: string;
  especie: string;
  raza?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
  color?: string | null;
  peso_kg?: number | null;
  num_chip?: string | null;
  esterilizado?: boolean;
  alergias?: string | null;
  observaciones?: string | null;
}

const norm = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

export async function crearMascota(input: MascotaInput): Promise<{ id?: string; error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mascotas")
    .insert({
      organization_id: orgId,
      cliente_id:      input.cliente_id ?? null,
      nombre:          input.nombre.trim(),
      especie:         input.especie,
      raza:            norm(input.raza),
      fecha_nacimiento:input.fecha_nacimiento ?? null,
      sexo:            input.sexo ?? null,
      color:           norm(input.color),
      peso_kg:         input.peso_kg ?? null,
      num_chip:        norm(input.num_chip),
      esterilizado:    input.esterilizado ?? false,
      alergias:        norm(input.alergias),
      observaciones:   norm(input.observaciones),
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear la mascota." };
  revalidatePath("/mascotas");
  return { id: data.id };
}

export async function actualizarMascota(
  mascotaId: string,
  input: Partial<MascotaInput>,
): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("mascotas")
    .update({
      ...(input.nombre           !== undefined && { nombre:           input.nombre.trim() }),
      ...(input.especie          !== undefined && { especie:          input.especie }),
      ...(input.raza             !== undefined && { raza:             norm(input.raza) }),
      ...(input.fecha_nacimiento !== undefined && { fecha_nacimiento: input.fecha_nacimiento }),
      ...(input.sexo             !== undefined && { sexo:             input.sexo }),
      ...(input.color            !== undefined && { color:            norm(input.color) }),
      ...(input.peso_kg          !== undefined && { peso_kg:          input.peso_kg }),
      ...(input.num_chip         !== undefined && { num_chip:         norm(input.num_chip) }),
      ...(input.esterilizado     !== undefined && { esterilizado:     input.esterilizado }),
      ...(input.alergias         !== undefined && { alergias:         norm(input.alergias) }),
      ...(input.observaciones    !== undefined && { observaciones:    norm(input.observaciones) }),
      ...(input.cliente_id       !== undefined && { cliente_id:       input.cliente_id }),
    })
    .eq("id", mascotaId)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo actualizar la mascota." };
  revalidatePath(`/mascotas/${mascotaId}`);
  revalidatePath("/mascotas");
  return {};
}

export async function eliminarMascota(mascotaId: string): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("mascotas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", mascotaId)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo eliminar la mascota." };
  revalidatePath("/mascotas");
  return {};
}

// ── Historia clínica ──

export interface HistoriaVetInput {
  mascota_id: string;
  fecha: string;
  motivo?: string | null;
  anamnesis?: string | null;
  exploracion?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  observaciones?: string | null;
}

export async function crearRegistroHistoria(input: HistoriaVetInput): Promise<{ id?: string; error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("historia_clinica_vet")
    .insert({
      organization_id: orgId,
      mascota_id:      input.mascota_id,
      fecha:           input.fecha,
      motivo:          norm(input.motivo),
      anamnesis:       norm(input.anamnesis),
      exploracion:     norm(input.exploracion),
      diagnostico:     norm(input.diagnostico),
      tratamiento:     norm(input.tratamiento),
      observaciones:   norm(input.observaciones),
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo guardar el registro clínico." };
  revalidatePath(`/mascotas/${input.mascota_id}`);
  return { id: data.id };
}

export async function eliminarRegistroHistoria(registroId: string, mascotaId: string): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("historia_clinica_vet")
    .delete()
    .eq("id", registroId)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo eliminar el registro." };
  revalidatePath(`/mascotas/${mascotaId}`);
  return {};
}
