import { createServiceClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { PageTitle } from "../_components/ui";
import { UsersTable, type UserRow } from "./users-table";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const yo = await requireSuperadmin();
  const supabase = createServiceClient();

  const [profilesRes, orgsRes, authRes] = await Promise.all([
    supabase.from("profiles").select("id, nombre, rol, activo, is_superadmin, organization_id, created_at").order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, nombre"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const orgName = new Map<string, string>();
  for (const o of orgsRes.data ?? []) orgName.set(o.id, o.nombre);
  const email = new Map<string, string>();
  for (const u of authRes.data?.users ?? []) email.set(u.id, u.email ?? "");

  const rows: UserRow[] = (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: email.get(p.id) ?? "—",
    rol: p.rol,
    activo: p.activo,
    is_superadmin: p.is_superadmin,
    organizacion: p.organization_id ? orgName.get(p.organization_id) ?? "—" : "Sin clínica",
    created_at: p.created_at,
  }));

  return (
    <div>
      <PageTitle title="Usuarios" subtitle={`${rows.length} usuarios en toda la plataforma.`} />
      <UsersTable rows={rows} yo={yo} />
    </div>
  );
}
