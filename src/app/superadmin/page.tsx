import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { hasActiveSubscription, planPriceMonth, planNombre } from "@/lib/plans";
import { PageTitle, StatCard, Panel, DarkBars, DarkDist, EstadoBadge } from "./_components/ui";

export const dynamic = "force-dynamic";

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default async function SuperadminHomePage() {
  const supabase = createServiceClient();

  const [orgsRes, profilesRes, afiliadosRes, referralsRes, payoutsRes] = await Promise.all([
    supabase.from("organizations").select("id, nombre, plan, subscription_status, vertical, created_at, trial_ends_at, current_period_end").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("affiliates").select("id, estado", { count: "exact" }),
    supabase.from("referrals").select("estado, comision"),
    supabase.from("affiliate_payouts").select("importe, estado"),
  ]);

  const orgs = orgsRes.data ?? [];
  const totalOrgs = orgs.length;
  const activas = orgs.filter((o) => o.subscription_status === "active").length;
  const enPrueba = orgs.filter((o) => o.subscription_status === "trialing" && hasActiveSubscription(o)).length;
  const conAcceso = orgs.filter((o) => hasActiveSubscription(o)).length;
  const mrr = orgs.filter((o) => o.subscription_status === "active").reduce((s, o) => s + planPriceMonth(o.plan), 0);
  const usuarios = profilesRes.count ?? 0;

  const ahora = new Date();
  const inicio30 = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 30);
  const altas30 = orgs.filter((o) => new Date(o.created_at) >= inicio30).length;

  // Altas por mes (últimos 6 meses)
  const bucket: { label: string; value: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    bucket.push({ label: MESES[d.getMonth()], value: 0, key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  for (const o of orgs) {
    const d = new Date(o.created_at);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const b = bucket.find((x) => x.key === k);
    if (b) b.value++;
  }

  // Distribuciones
  const porVertical = agrupar(orgs.map((o) => o.vertical || "general"));
  const porPlan = agrupar(orgs.map((o) => planNombre(o.plan)));

  // Afiliados
  const afiliadosActivos = (afiliadosRes.data ?? []).filter((a) => a.estado === "activo").length;
  const referrals = referralsRes.data ?? [];
  const referidosConfirmados = referrals.filter((r) => r.estado === "confirmado" || r.estado === "pagado").length;
  const comisionesPendientes = (payoutsRes.data ?? []).filter((p) => p.estado === "pendiente").reduce((s, p) => s + Number(p.importe), 0);

  return (
    <div>
      <PageTitle title="Resumen de la plataforma" subtitle="Métricas globales de Clinicomatic en todas las organizaciones." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="MRR estimado" value={eur(mrr)} hint={`${activas} suscripciones activas`} accent="emerald" />
        <StatCard label="Clínicas" value={totalOrgs} hint={`${conAcceso} con acceso`} accent="indigo" />
        <StatCard label="En prueba" value={enPrueba} hint="trial vigente" accent="amber" />
        <StatCard label="Usuarios" value={usuarios} hint="en todas las clínicas" accent="violet" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Altas de clínicas (6 meses)" className="lg:col-span-2">
          <DarkBars data={bucket.map(({ label, value }) => ({ label, value }))} />
          <p className="mt-3 text-xs text-white/45">{altas30} altas en los últimos 30 días.</p>
        </Panel>
        <Panel title="Por plan">
          <DarkDist items={porPlan} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Por especialidad">
          <DarkDist items={porVertical} />
        </Panel>
        <Panel title="Programa de afiliados" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Afiliados activos" value={afiliadosActivos} />
            <Mini label="Referidos confirmados" value={referidosConfirmados} />
            <Mini label="Comisiones por pagar" value={eur(comisionesPendientes)} />
          </div>
          <Link href="/superadmin/afiliados" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200">
            Gestionar afiliados <ArrowRight size={15} />
          </Link>
        </Panel>
      </div>

      <Panel title="Últimas clínicas registradas" className="mt-3" right={<Link href="/superadmin/organizations" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">Ver todas</Link>}>
        {orgs.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/45">Aún no hay organizaciones.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {orgs.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link href={`/superadmin/organizations/${o.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-white/[0.03]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/[0.06] text-white/60"><Building2 size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{o.nombre}</p>
                    <p className="text-xs capitalize text-white/45">{o.vertical} · {planNombre(o.plan)}</p>
                  </div>
                  <EstadoBadge estado={o.subscription_status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] bg-white/[0.04] p-3">
      <p className="text-[11px] font-medium text-white/50">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

function agrupar(values: string[]): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
