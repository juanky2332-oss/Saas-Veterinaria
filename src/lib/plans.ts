import type { Database } from "@/lib/database.types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export type PlanKey = "basico" | "pro" | "clinica";

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceMonth: number;
  priceId: string | undefined;
  maxUsuarios: number;
  destacado?: boolean;
  features: string[];
}

export const TRIAL_DAYS = 10;

export const PLANS: Record<PlanKey, PlanDef> = {
  basico: {
    key: "basico",
    name: "Básico",
    priceMonth: 29,
    priceId: process.env.STRIPE_PRICE_BASICO,
    maxUsuarios: 2,
    features: [
      "Mascotas y clientes ilimitados",
      "Agenda de citas",
      "Recordatorios por email",
      "Hasta 2 usuarios",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonth: 69,
    priceId: process.env.STRIPE_PRICE_PRO,
    maxUsuarios: 5,
    destacado: true,
    features: [
      "Todo lo de Básico",
      "Historia clínica completa",
      "Vacunaciones y desparasitaciones",
      "Facturación + recordatorios WhatsApp",
      "Hasta 5 usuarios",
    ],
  },
  clinica: {
    key: "clinica",
    name: "Clínica",
    priceMonth: 129,
    priceId: process.env.STRIPE_PRICE_CLINICA,
    maxUsuarios: 999,
    features: [
      "Todo lo de Pro",
      "Usuarios ilimitados",
      "Analítica e informes avanzados",
      "API pública + soporte prioritario",
    ],
  },
};

export const PLAN_LIST: PlanDef[] = [PLANS.basico, PLANS.pro, PLANS.clinica];

export function planPriceMonth(plan: string | null | undefined): number {
  if (!plan) return 0;
  const def = PLANS[plan as PlanKey];
  return def ? def.priceMonth : 0;
}

export function planNombre(plan: string | null | undefined): string {
  if (!plan) return "—";
  const def = PLANS[plan as PlanKey];
  return def ? def.name : plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function planFromPrice(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  const found = PLAN_LIST.find((p) => p.priceId && p.priceId === priceId);
  return found?.key ?? null;
}

export function hasActiveSubscription(
  org: Pick<Organization, "subscription_status" | "trial_ends_at" | "current_period_end">,
): boolean {
  const status = org.subscription_status;
  if (status === "active") return true;
  if (status === "trialing") {
    const end = org.current_period_end ?? org.trial_ends_at;
    return end ? new Date(end).getTime() > Date.now() : true;
  }
  return false;
}
