import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CalendarDays, FileText, Receipt } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { planNombre } from "@/lib/plans";
import { PageTitle, Panel, StatCard, EstadoBadge } from "../../_components/ui";
import { OrgActions } from "./org-actions";

export const dynamic = "force-dynamic";

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—");

const ROL_LABEL: Record<string, string> = { owner: "Propietario", admin: "Administrador", profesional: "Profesional", recepcion: "Recepción", contable: "Contable" };

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: org } = await supabase.from("organizations").select("*").eq("id", id).maybeSingle();
  if (!org) notFound();

  const [usersRes, pacientesRes, citasRes, facturasRes] = await Promise.all([
    supabase.from("profiles").select("id, nombre, rol, activo, is_superadmin, created_at").eq("organization_id", id).order("created_at"),
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("organization_id", id),
  ]);

  const usuarios = usersRes.data ?? [];

  return (
    <div>
      <Link href="/superadmin/organizations" className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white">
        <ArrowLeft size={15} /> Organizaciones
      </Link>
      <PageTitle
        title={org.nombre}
        subtitle={`/${org.slug} · ${org.vertical}`}
        action={<EstadoBadge estado={org.subscription_status} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Usuarios" value={usuarios.length} accent="violet" />
        <StatCard label="Pacientes" value={pacientesRes.count ?? 0} accent="indigo" />
        <StatCard label="Citas" value={citasRes.count ?? 0} accent="emerald" />
        <StatCard label="Facturas" value={facturasRes.count ?? 0} accent="amber" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Suscripción y límites" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
            <Dato label="Plan" value={planNombre(org.plan)} />
            <Dato label="Estado" value={org.subscription_status} />
            <Dato label="Máx. usuarios" value={`${usuarios.length}/${org.max_usuarios}`} />
            <Dato label="Alta" value={fecha(org.created_at)} />
            <Dato label="Fin de prueba" value={fecha(org.trial_ends_at)} />
            <Dato label="Fin de periodo" value={fecha(org.current_period_end)} />
            <Dato label="Zona horaria" value={org.timezone} />
            <Dato label="Proveedor de pago" value={org.payment_provider ?? "—"} />
            <Dato label="Código de afiliado" value={org.referral_code ?? "—"} />
          </dl>
        </Panel>
        <Panel title="Acciones de plataforma">
          <OrgActions id={org.id} plan={org.plan} estado={org.subscription_status} maxUsuarios={org.max_usuarios} />
        </Panel>
      </div>

      <Panel title={`Usuarios (${usuarios.length})`} className="mt-3">
        {usuarios.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/45">Esta organización no tiene usuarios.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {usuarios.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-white/70">
                  {u.nombre?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {u.nombre} {u.is_superadmin && <span className="ml-1 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">SUPERADMIN</span>}
                  </p>
                  <p className="text-xs text-white/45">{ROL_LABEL[u.rol] ?? u.rol} · alta {fecha(u.created_at)}</p>
                </div>
                {!u.activo && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/50">Inactivo</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-white/40 text-xs">
        <Acceso icon={<Users size={14} />} label="Pacientes" />
        <Acceso icon={<CalendarDays size={14} />} label="Agenda" />
        <Acceso icon={<FileText size={14} />} label="Historia clínica" />
        <Acceso icon={<Receipt size={14} />} label="Facturación" />
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{label}</dt>
      <dd className="mt-0.5 capitalize text-white/85">{value}</dd>
    </div>
  );
}

function Acceso({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      {icon} <span>{label}</span>
    </div>
  );
}
