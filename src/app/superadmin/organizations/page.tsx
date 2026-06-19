import { createServiceClient } from "@/lib/supabase/server";
import { planNombre } from "@/lib/plans";
import { PageTitle } from "../_components/ui";
import { OrgsTable, type OrgRow } from "./orgs-table";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const supabase = createServiceClient();
  const [orgsRes, profilesRes] = await Promise.all([
    supabase.from("organizations").select("id, nombre, slug, plan, subscription_status, vertical, created_at, max_usuarios").order("created_at", { ascending: false }),
    supabase.from("profiles").select("organization_id"),
  ]);

  const counts = new Map<string, number>();
  for (const p of profilesRes.data ?? []) {
    if (p.organization_id) counts.set(p.organization_id, (counts.get(p.organization_id) ?? 0) + 1);
  }

  const rows: OrgRow[] = (orgsRes.data ?? []).map((o) => ({
    id: o.id,
    nombre: o.nombre,
    slug: o.slug,
    plan: planNombre(o.plan),
    estado: o.subscription_status,
    vertical: o.vertical || "general",
    created_at: o.created_at,
    usuarios: counts.get(o.id) ?? 0,
    max_usuarios: o.max_usuarios,
  }));

  return (
    <div>
      <PageTitle title="Organizaciones" subtitle={`${rows.length} clínicas registradas en la plataforma.`} />
      <OrgsTable rows={rows} />
    </div>
  );
}
