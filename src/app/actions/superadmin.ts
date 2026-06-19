"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { isCurrentUserSuperadmin } from "@/lib/auth/superadmin";
import type { PlanKey } from "@/lib/plans";
import type { Database } from "@/lib/database.types";

type OrgUpdate = Database["public"]["Tables"]["organizations"]["Update"];
type AffiliateUpdate = Database["public"]["Tables"]["affiliates"]["Update"];
type ReferralUpdate = Database["public"]["Tables"]["referrals"]["Update"];

/** Todas las acciones aquí requieren superadmin y operan con service role (cross-org). */
async function guard(): Promise<{ ok: boolean }> {
  return { ok: await isCurrentUserSuperadmin() };
}

export async function actualizarOrganizacion(
  id: string,
  cambios: { plan?: PlanKey; subscription_status?: string; max_usuarios?: number },
): Promise<{ error?: string }> {
  if (!(await guard()).ok) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const patch: OrgUpdate = {};
  if (cambios.plan) patch.plan = cambios.plan;
  if (cambios.subscription_status) patch.subscription_status = cambios.subscription_status;
  if (typeof cambios.max_usuarios === "number") patch.max_usuarios = cambios.max_usuarios;
  if (Object.keys(patch).length === 0) return {};
  const { error } = await supabase.from("organizations").update(patch).eq("id", id);
  if (error) return { error: "No se pudo actualizar la organización." };
  revalidatePath(`/superadmin/organizations/${id}`);
  revalidatePath("/superadmin/organizations");
  revalidatePath("/superadmin");
  return {};
}

export async function setSuperadmin(userId: string, value: boolean): Promise<{ error?: string }> {
  if (!(await guard()).ok) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const { error } = await supabase.from("profiles").update({ is_superadmin: value }).eq("id", userId);
  if (error) return { error: "No se pudo cambiar el rol de plataforma." };
  revalidatePath("/superadmin/usuarios");
  return {};
}

/* ───────────────── Afiliados (administración) ───────────────── */

export async function actualizarAfiliado(
  id: string,
  cambios: { estado?: string; comision_pct?: number },
): Promise<{ error?: string }> {
  if (!(await guard()).ok) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const patch: AffiliateUpdate = {};
  if (cambios.estado) patch.estado = cambios.estado;
  if (typeof cambios.comision_pct === "number") patch.comision_pct = cambios.comision_pct;
  if (Object.keys(patch).length === 0) return {};
  const { error } = await supabase.from("affiliates").update(patch).eq("id", id);
  if (error) return { error: "No se pudo actualizar el afiliado." };
  revalidatePath("/superadmin/afiliados");
  return {};
}

export async function cambiarEstadoReferido(id: string, estado: string): Promise<{ error?: string }> {
  if (!(await guard()).ok) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const patch: ReferralUpdate = { estado };
  if (estado === "confirmado") patch.confirmado_at = new Date().toISOString();
  const { error } = await supabase.from("referrals").update(patch).eq("id", id);
  if (error) return { error: "No se pudo actualizar el referido." };
  revalidatePath("/superadmin/afiliados");
  return {};
}

/** Genera un pago (payout) por el total de comisiones confirmadas y no liquidadas de un afiliado. */
export async function liquidarComisiones(affiliateId: string): Promise<{ error?: string; importe?: number }> {
  if (!(await guard()).ok) return { error: "No autorizado." };
  const supabase = createServiceClient();

  const { data: refs } = await supabase
    .from("referrals")
    .select("comision")
    .eq("affiliate_id", affiliateId)
    .eq("estado", "confirmado");
  const pendiente = (refs ?? []).reduce((s, r) => s + Number(r.comision), 0);
  if (pendiente <= 0) return { error: "No hay comisiones confirmadas pendientes de liquidar." };

  const periodo = new Date().toISOString().slice(0, 7);
  const { error: payErr } = await supabase.from("affiliate_payouts").insert({
    affiliate_id: affiliateId,
    importe: pendiente,
    estado: "pendiente",
    periodo,
  });
  if (payErr) return { error: "No se pudo crear el pago." };

  // Marca los referidos como pagados
  await supabase.from("referrals").update({ estado: "pagado" }).eq("affiliate_id", affiliateId).eq("estado", "confirmado");

  revalidatePath("/superadmin/afiliados");
  return { importe: pendiente };
}

export async function marcarPayoutPagado(id: string): Promise<{ error?: string }> {
  if (!(await guard()).ok) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const { error } = await supabase.from("affiliate_payouts").update({ estado: "pagado", pagado_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "No se pudo marcar como pagado." };
  revalidatePath("/superadmin/afiliados");
  return {};
}
