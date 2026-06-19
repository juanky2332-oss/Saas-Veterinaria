-- =============================================================================
-- ClinicFlow — Zona horaria por clínica (agenda multi-región)
-- =============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Madrid';
