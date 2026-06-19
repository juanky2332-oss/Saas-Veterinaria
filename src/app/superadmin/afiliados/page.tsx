import { createServiceClient } from "@/lib/supabase/server";
import { planNombre } from "@/lib/plans";
import { PageTitle } from "../_components/ui";
import { AfiliadosAdmin, type AfiliadoAdmin, type ReferidoAdmin, type PayoutAdmin } from "./afiliados-admin";

export const dynamic = "force-dynamic";

export default async function AfiliadosAdminPage() {
  const supabase = createServiceClient();

  const [afRes, refRes, payRes, orgsRes] = await Promise.all([
    supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*").order("created_at", { ascending: false }),
    supabase.from("affiliate_payouts").select("*").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, nombre, plan"),
  ]);

  const orgInfo = new Map<string, { nombre: string; plan: string }>();
  for (const o of orgsRes.data ?? []) orgInfo.set(o.id, { nombre: o.nombre, plan: planNombre(o.plan) });

  const referidos: ReferidoAdmin[] = (refRes.data ?? []).map((r) => ({
    id: r.id,
    affiliate_id: r.affiliate_id,
    organizacion: r.organization_id ? orgInfo.get(r.organization_id)?.nombre ?? "—" : "—",
    plan: r.plan ?? (r.organization_id ? orgInfo.get(r.organization_id)?.plan ?? "—" : "—"),
    estado: r.estado,
    comision: Number(r.comision),
    created_at: r.created_at,
  }));

  const payouts: PayoutAdmin[] = (payRes.data ?? []).map((p) => ({
    id: p.id,
    affiliate_id: p.affiliate_id,
    importe: Number(p.importe),
    estado: p.estado,
    periodo: p.periodo ?? "",
    created_at: p.created_at,
  }));

  const afiliados: AfiliadoAdmin[] = (afRes.data ?? []).map((a) => ({
    id: a.id,
    nombre: a.nombre,
    email: a.email,
    codigo: a.codigo,
    comision_pct: Number(a.comision_pct),
    estado: a.estado,
    created_at: a.created_at,
  }));

  return (
    <div>
      <PageTitle title="Programa de afiliados" subtitle="Gestiona afiliados, valida referidos y liquida comisiones." />
      <AfiliadosAdmin afiliados={afiliados} referidos={referidos} payouts={payouts} />
    </div>
  );
}
