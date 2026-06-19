-- ClinicFlow — Columnas de facturación de la suscripción (Stripe)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
