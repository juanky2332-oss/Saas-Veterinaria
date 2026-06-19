"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/auth/org";

export interface VacunacionInput {
  mascota_id: string;
  vacuna: string;
  fabricante?: string | null;
  lote?: string | null;
  fecha_aplicacion: string;
  fecha_proxima?: string | null;
  notas?: string | null;
}

export interface DesparasitacionInput {
  mascota_id: string;
  tipo: "interna" | "externa" | "ambas";
  producto?: string | null;
  fecha_aplicacion: string;
  fecha_proxima?: string | null;
  notas?: string | null;
}

const norm = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

export async function crearVacunacion(input: VacunacionInput): Promise<{ id?: string; error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vacunaciones_vet")
    .insert({
      organization_id:  orgId,
      mascota_id:       input.mascota_id,
      vacuna:           input.vacuna.trim(),
      fabricante:       norm(input.fabricante),
      lote:             norm(input.lote),
      fecha_aplicacion: input.fecha_aplicacion,
      fecha_proxima:    input.fecha_proxima ?? null,
      notas:            norm(input.notas),
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo registrar la vacunación." };
  revalidatePath(`/mascotas/${input.mascota_id}`);
  revalidatePath("/vacunaciones");
  return { id: data.id };
}

export async function eliminarVacunacion(id: string, mascotaId: string): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vacunaciones_vet")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo eliminar la vacunación." };
  revalidatePath(`/mascotas/${mascotaId}`);
  revalidatePath("/vacunaciones");
  return {};
}

export async function crearDesparasitacion(input: DesparasitacionInput): Promise<{ id?: string; error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("desparasitaciones_vet")
    .insert({
      organization_id:  orgId,
      mascota_id:       input.mascota_id,
      tipo:             input.tipo,
      producto:         norm(input.producto),
      fecha_aplicacion: input.fecha_aplicacion,
      fecha_proxima:    input.fecha_proxima ?? null,
      notas:            norm(input.notas),
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo registrar la desparasitación." };
  revalidatePath(`/mascotas/${input.mascota_id}`);
  revalidatePath("/vacunaciones");
  return { id: data.id };
}

export async function eliminarDesparasitacion(id: string, mascotaId: string): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("desparasitaciones_vet")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo eliminar la desparasitación." };
  revalidatePath(`/mascotas/${mascotaId}`);
  revalidatePath("/vacunaciones");
  return {};
}
