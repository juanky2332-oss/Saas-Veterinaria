-- =============================================================================
-- ClinicFlow v2 — CRM nativo · recordatorios por paciente · facturación Holded-like
--                · apariencia/logo por clínica · verticales abiertos
-- =============================================================================

-- ─────────── CRM nativo (sin dependencia de GoHighLevel) ───────────
ALTER TABLE crm_stages ALTER COLUMN ghl_stage_id DROP NOT NULL;
ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#0e9f8e';
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS notas text;

-- Pipeline por defecto (se llama al crear la organización y como backfill)
CREATE OR REPLACE FUNCTION seed_default_pipeline(p_org uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pipeline uuid;
BEGIN
  -- Solo la propia organización (o el flujo de alta) puede sembrarse
  IF p_org IS DISTINCT FROM get_user_org_id() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF EXISTS (SELECT 1 FROM crm_pipelines WHERE organization_id = p_org) THEN
    RETURN;
  END IF;
  INSERT INTO crm_pipelines (organization_id, nombre) VALUES (p_org, 'Pipeline de ventas')
  RETURNING id INTO v_pipeline;
  INSERT INTO crm_stages (organization_id, pipeline_id, nombre, orden, color) VALUES
    (p_org, v_pipeline, 'Nuevo contacto',      0, '#1f9fc4'),
    (p_org, v_pipeline, 'En conversación',     1, '#d98a0b'),
    (p_org, v_pipeline, 'Cita agendada',       2, '#0e9f8e'),
    (p_org, v_pipeline, 'Presupuesto enviado', 3, '#e8845c'),
    (p_org, v_pipeline, 'Ganado',              4, '#15a37a'),
    (p_org, v_pipeline, 'Perdido',             5, '#94a3b8');
END; $$;
REVOKE EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) FROM anon;

-- El alta de organización crea también su pipeline
CREATE OR REPLACE FUNCTION create_organization_with_owner(p_org_name text, p_slug text, p_vertical text, p_user_name text)
RETURNS uuid AS $$
DECLARE v_org_id uuid; v_uid uuid := auth.uid(); v_pipeline uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  INSERT INTO organizations (nombre, slug, vertical, owner_id)
  VALUES (p_org_name, p_slug, COALESCE(NULLIF(p_vertical, ''), 'general'), v_uid)
  RETURNING id INTO v_org_id;
  INSERT INTO profiles (id, nombre, rol, organization_id, activo)
  VALUES (v_uid, COALESCE(NULLIF(p_user_name, ''), 'Propietario'), 'owner', v_org_id, true)
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, rol = 'owner', nombre = EXCLUDED.nombre;

  INSERT INTO crm_pipelines (organization_id, nombre) VALUES (v_org_id, 'Pipeline de ventas')
  RETURNING id INTO v_pipeline;
  INSERT INTO crm_stages (organization_id, pipeline_id, nombre, orden, color) VALUES
    (v_org_id, v_pipeline, 'Nuevo contacto',      0, '#1f9fc4'),
    (v_org_id, v_pipeline, 'En conversación',     1, '#d98a0b'),
    (v_org_id, v_pipeline, 'Cita agendada',       2, '#0e9f8e'),
    (v_org_id, v_pipeline, 'Presupuesto enviado', 3, '#e8845c'),
    (v_org_id, v_pipeline, 'Ganado',              4, '#15a37a'),
    (v_org_id, v_pipeline, 'Perdido',             5, '#94a3b8');

  RETURN v_org_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─────────── Pacientes: recordatorios WhatsApp por paciente ───────────
ALTER TABLE patients ADD COLUMN IF NOT EXISTS recordatorios_wa boolean NOT NULL DEFAULT true;

-- ─────────── Facturación Holded-like ───────────
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vencimiento date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS forma_pago text;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS descuento_pct numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE billing_settings ADD COLUMN IF NOT EXISTS plantilla text NOT NULL DEFAULT 'moderna';

-- ─────────── Verticales abiertos (todo tipo de clínicas) ───────────
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_vertical_check;

-- ─────────── Categorías de tratamiento multi-vertical ───────────
ALTER TYPE categoria_tratamiento ADD VALUE IF NOT EXISTS 'dental';
ALTER TYPE categoria_tratamiento ADD VALUE IF NOT EXISTS 'medicina';
ALTER TYPE categoria_tratamiento ADD VALUE IF NOT EXISTS 'fisioterapia';
ALTER TYPE categoria_tratamiento ADD VALUE IF NOT EXISTS 'bienestar';

-- ─────────── Storage: logos de clínica (bucket público) ───────────
INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "org-assets: miembros suben a su organización"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-assets' AND (storage.foldername(name))[1] = get_user_org_id()::text);
CREATE POLICY "org-assets: miembros actualizan su organización"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'org-assets' AND (storage.foldername(name))[1] = get_user_org_id()::text);
CREATE POLICY "org-assets: miembros borran de su organización"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'org-assets' AND (storage.foldername(name))[1] = get_user_org_id()::text);
CREATE POLICY "org-assets: lectura"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'org-assets');
