import { getCurrentOrg } from "@/lib/auth/org";
import { PricingCards } from "@/components/billing/pricing-cards";
import { ManageSubscriptionButton } from "./manage-button";
import { PLANS, hasActiveSubscription } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Suscripción — VetClinic" };

const ESTADO: Record<string, { label: string; variant: "exito" | "aviso" | "error" | "muted" }> = {
  active: { label: "Activa", variant: "exito" },
  trialing: { label: "Periodo de prueba", variant: "aviso" },
  past_due: { label: "Pago pendiente", variant: "error" },
  canceled: { label: "Cancelada", variant: "muted" },
  incomplete: { label: "Incompleta", variant: "muted" },
  paused: { label: "Pausada", variant: "muted" },
};

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SuscripcionPage() {
  const org = await getCurrentOrg();
  const estado = ESTADO[org?.subscription_status ?? "trialing"] ?? ESTADO.trialing;
  const planNombre = org?.plan && org.plan in PLANS ? PLANS[org.plan as keyof typeof PLANS].name : "Prueba";
  const activa = org ? hasActiveSubscription(org) : false;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Suscripción</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">Gestiona el plan de tu clínica y los datos de facturación.</p>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-lg font-semibold text-[var(--text)]">Plan {planNombre}</span>
              <Badge variant={estado.variant}>{estado.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              {org?.subscription_status === "trialing"
                ? `Tu prueba termina el ${fecha(org?.trial_ends_at ?? null)}.`
                : org?.current_period_end
                  ? `Próxima renovación: ${fecha(org.current_period_end)}.`
                  : "Sin suscripción activa todavía."}
            </p>
          </div>
          <ManageSubscriptionButton hasCustomer={Boolean(org?.stripe_customer_id)} />
        </div>
        {!activa && (
          <p className="mt-4 rounded-[10px] bg-[var(--aviso-tint)] px-3 py-2 text-sm text-[var(--aviso)]">
            Tu acceso está limitado. Elige un plan para reactivar todas las funciones.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-[var(--text)]">Planes</h2>
        <PricingCards mode="app" currentPlan={org?.plan} />
      </div>
    </div>
  );
}
