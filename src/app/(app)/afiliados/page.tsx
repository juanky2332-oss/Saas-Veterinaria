import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/org";
import { planNombre } from "@/lib/plans";
import { AfiliadoRegistro } from "./afiliado-registro";
import { AfiliadoPanel, type Referido, type Payout } from "./afiliado-panel";

export const metadata = { title: "Programa de afiliados — VetClinic" };
export const dynamic = "force-dynamic";

export default async function AfiliadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getCurrentProfile();

  const { data: af } = await supabase.from("affiliates").select("*").eq("user_id", user?.id ?? "").maybeSingle();

  if (!af) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <AfiliadoRegistro nombrePorDefecto={profile?.nombre ?? ""} emailPorDefecto={user?.email ?? ""} />
      </div>
    );
  }

  const [refRes, payRes, orgsRes] = await Promise.all([
    supabase.from("referrals").select("*").eq("affiliate_id", af.id).order("created_at", { ascending: false }),
    supabase.from("affiliate_payouts").select("*").eq("affiliate_id", af.id).order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, nombre, plan"),
  ]);

  const orgInfo = new Map<string, { nombre: string; plan: string }>();
  for (const o of orgsRes.data ?? []) orgInfo.set(o.id, { nombre: o.nombre, plan: planNombre(o.plan) });

  const referidos: Referido[] = (refRes.data ?? []).map((r) => ({
    id: r.id,
    plan: r.plan ?? (r.organization_id ? orgInfo.get(r.organization_id)?.plan ?? "—" : "—"),
    estado: r.estado,
    comision: Number(r.comision),
    created_at: r.created_at,
  }));
  const payouts: Payout[] = (payRes.data ?? []).map((p) => ({
    id: p.id, importe: Number(p.importe), estado: p.estado, periodo: p.periodo ?? "", created_at: p.created_at,
  }));

  const datosPago = (af.datos_pago as { metodo?: string; cuenta?: string } | null) ?? {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <AfiliadoPanel
        nombre={af.nombre}
        codigo={af.codigo}
        comisionPct={Number(af.comision_pct)}
        estado={af.estado}
        metodoPago={datosPago.metodo ?? ""}
        cuentaPago={datosPago.cuenta ?? ""}
        referidos={referidos}
        payouts={payouts}
      />
    </div>
  );
}
