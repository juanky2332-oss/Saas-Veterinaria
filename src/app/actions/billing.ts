"use server";

import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PLANS, TRIAL_DAYS, type PlanKey } from "@/lib/plans";
import { getCurrentOrg } from "@/lib/auth/org";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Crea una sesión de Checkout de Stripe para suscribir la organización a un plan. */
export async function createCheckout(plan: PlanKey): Promise<{ url?: string; error?: string }> {
  if (!isStripeConfigured()) return { error: "Stripe aún no está configurado." };
  const org = await getCurrentOrg();
  if (!org) return { error: "Sin organización." };
  const priceId = PLANS[plan]?.priceId;
  if (!priceId) return { error: `Falta configurar STRIPE_PRICE_${plan.toUpperCase()} en el entorno.` };

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "sepa_debit"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { organization_id: org.id },
      },
      customer: org.stripe_customer_id ?? undefined,
      client_reference_id: org.id,
      allow_promotion_codes: true,
      success_url: `${appUrl}/configuracion/suscripcion?ok=1`,
      cancel_url: `${appUrl}/configuracion/suscripcion`,
    });
    return { url: session.url ?? undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error de Stripe" };
  }
}

/** Abre el portal de cliente de Stripe para gestionar la suscripción. */
export async function createBillingPortal(): Promise<{ url?: string; error?: string }> {
  if (!isStripeConfigured()) return { error: "Stripe aún no está configurado." };
  const org = await getCurrentOrg();
  if (!org?.stripe_customer_id) return { error: "Aún no tienes una suscripción activa." };
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/configuracion/suscripcion`,
    });
    return { url: session.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error de Stripe" };
  }
}
