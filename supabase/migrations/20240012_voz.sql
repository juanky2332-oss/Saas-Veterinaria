-- =============================================================================
-- ClinicFlow — Bloque C: agente de voz (Retell + Twilio)
--   · voice_calls: llamadas con transcripción/resumen vinculadas al paciente.
--   · La configuración del agente vive en org_integrations(tipo='voz').config.
-- =============================================================================

CREATE TABLE IF NOT EXISTS voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  retell_call_id text,
  direccion text NOT NULL DEFAULT 'inbound',
  from_number text,
  to_number text,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  duracion_seg integer,
  estado text NOT NULL DEFAULT 'finalizada',
  resumen text,
  transcripcion text,
  grabacion_url text,
  sentimiento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_voice_calls_org ON voice_calls(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_calls_patient ON voice_calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_retell ON voice_calls(retell_call_id);
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_voice_calls_org ON voice_calls;
CREATE TRIGGER trg_voice_calls_org BEFORE INSERT ON voice_calls FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "voice_calls_org" ON voice_calls;
CREATE POLICY "voice_calls_org" ON voice_calls FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
