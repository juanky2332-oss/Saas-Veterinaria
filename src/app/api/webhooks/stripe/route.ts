import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getServiceClient } from "@/lib/supabase/service";
import { planFromPrice } from "@/lib/plans";

export const runtime = "nodejs";

const HANDLED = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response("Stripe webhook no configurado", { status: 400 });

  const stripe = getStripe();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("Firma inválida", { status: 400 });
  }

  if (HANDLED.includes(event.type)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = event.data.object as any;
    let orgId: string | undefined = obj.client_reference_id ?? obj.metadata?.organization_id;

    // Resolver la suscripción completa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub: any = obj;
    const subId = obj.subscription ?? (event.type.startsWith("customer.subscription") ? obj.id : null);
    if (subId && typeof subId === "string") {
      sub = await stripe.subscriptions.retrieve(subId);
    }
    orgId = orgId ?? sub?.metadata?.organization_id;

    if (orgId) {
      const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
      const plan = planFromPrice(sub.items?.data?.[0]?.price?.id);

      const update: Record<string, unknown> = {
        payment_provider: "stripe",
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? null),
        stripe_subscription_id: sub.id ?? null,
        subscription_status: sub.status ?? (event.type === "customer.subscription.deleted" ? "canceled" : "active"),
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      };
      if (plan) update.plan = plan;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = getServiceClient() as any;
      await db.from("organizations").update(update).eq("id", orgId);
    }
  }

  return new Response("ok");
}
