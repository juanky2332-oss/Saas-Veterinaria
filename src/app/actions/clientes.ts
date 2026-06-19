"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgId } from "@/lib/auth/org";

export interface ClienteInput {
  nombre: string;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
  nif?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  cp?: string | null;
  notas?: string | null;
  recordatorios_wa?: boolean;
}

const norm = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

export async function crearCliente(input: ClienteInput): Promise<{ id?: string; error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      organization_id: orgId,
      nombre:          input.nombre.trim(),
      apellidos:       norm(input.apellidos),
      telefono:        norm(input.telefono),
      email:           norm(input.email),
      nif:             norm(input.nif),
      direccion:       norm(input.direccion),
      ciudad:          norm(input.ciudad),
      cp:              norm(input.cp),
      notas:           norm(input.notas),
      recordatorios_wa: input.recordatorios_wa ?? false,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el cliente." };
  revalidatePath("/clientes");
  return { id: data.id };
}

export async function actualizarCliente(
  clienteId: string,
  input: Partial<ClienteInput>,
): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({
      ...(input.nombre           !== undefined && { nombre:           input.nombre.trim() }),
      ...(input.apellidos        !== undefined && { apellidos:        norm(input.apellidos) }),
      ...(input.telefono         !== undefined && { telefono:         norm(input.telefono) }),
      ...(input.email            !== undefined && { email:            norm(input.email) }),
      ...(input.nif              !== undefined && { nif:              norm(input.nif) }),
      ...(input.direccion        !== undefined && { direccion:        norm(input.direccion) }),
      ...(input.ciudad           !== undefined && { ciudad:           norm(input.ciudad) }),
      ...(input.cp               !== undefined && { cp:               norm(input.cp) }),
      ...(input.notas            !== undefined && { notas:            norm(input.notas) }),
      ...(input.recordatorios_wa !== undefined && { recordatorios_wa: input.recordatorios_wa }),
    })
    .eq("id", clienteId)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo actualizar el cliente." };
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  return {};
}

export async function eliminarCliente(clienteId: string): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clienteId)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo eliminar el cliente." };
  revalidatePath("/clientes");
  return {};
}

export async function toggleRecordatoriosWa(clienteId: string, activo: boolean): Promise<{ error?: string }> {
  const orgId = await getOrgId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({ recordatorios_wa: activo })
    .eq("id", clienteId)
    .eq("organization_id", orgId);

  if (error) return { error: "No se pudo actualizar los recordatorios." };
  revalidatePath(`/clientes/${clienteId}`);
  return {};
}
