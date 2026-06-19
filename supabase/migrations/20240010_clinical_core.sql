-- =============================================================================
-- ClinicFlow — Núcleo clínico configurable por vertical
--   · organizations.features (overrides de módulos/secciones) + especialidad
--   · campos médicos en patients
--   · patient_metrics: biometría/evolución (peso, altura, IMC, tensión…)
-- =============================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS especialidad text;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS antecedentes text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medicacion text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS grupo_sanguineo text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profesion text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mutua text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS num_poliza text;

CREATE TABLE IF NOT EXISTS patient_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  peso numeric(6,2),
  altura numeric(6,2),
  imc numeric(6,2),
  tension_sis integer,
  tension_dia integer,
  grasa_pct numeric(5,2),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_metrics ON patient_metrics(patient_id, fecha);
CREATE INDEX IF NOT EXISTS idx_patient_metrics_org ON patient_metrics(organization_id);
ALTER TABLE patient_metrics ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_patient_metrics_org ON patient_metrics;
CREATE TRIGGER trg_patient_metrics_org BEFORE INSERT ON patient_metrics FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "patient_metrics: clínicos de la organización" ON patient_metrics;
CREATE POLICY "patient_metrics: clínicos de la organización" ON patient_metrics FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));
