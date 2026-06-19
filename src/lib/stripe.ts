import Stripe from "stripe";

/**
 * Cliente Stripe (servidor) con instanciación perezosa: el SDK lanza si la API
 * key está vacía, así que NO se instancia en module-load (rompería el build
 * cuando Stripe aún no está configurado). La suscripción al SaaS se cobra aquí —
 * distinto de la facturación que cada clínica hace a sus pacientes.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY no configurada");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
