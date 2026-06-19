-- =============================================================================
-- ClinicFlow — Núcleo multi-tenant + RLS por organización
-- Convierte el esquema single-tenant de Esse en multi-tenant:
--   · tabla organizations (raíz del tenant: plan, suscripción, marca, vertical)
--   · organization_id + índice en TODAS las tablas de negocio
--   · get_user_org_id() y user_has_role() (SECURITY DEFINER, sin recursión RLS)
--   · unicidad por-organización (teléfonos, ids de GHL…)
--   · RLS reescrita: aislamiento por organización + reglas por rol
--
-- DATOS DE SALUD (Art. 9 RGPD): el aislamiento por organización es la barrera
-- crítica. Toda tabla con datos de paciente filtra por organization_id.
-- =============================================================================

-- ============================================================
-- 1. ORGANIZATIONS (raíz del tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                  text NOT NULL,
  slug                    text NOT NULL UNIQUE,
  vertical                text NOT NULL DEFAULT 'general'
                            CHECK (vertical IN ('general', 'dental', 'estetica')),
  -- Marca (re-tematización por tenant; null => usa el preset del vertical)
  brand_color             text,
  accent_color            text,
  logo_path               text,
  -- Propiedad y facturación de la SUSCRIPCIÓN al SaaS (Stripe)
  owner_id                uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan                    text NOT NULL DEFAULT 'trial'
                            CHECK (plan IN ('trial', 'starter', 'pro', 'clinica')),
  subscription_status     text NOT NULL DEFAULT 'trialing'
                            CHECK (subscription_status IN ('trialing','active','past_due','canceled','incomplete','paused')),
  trial_ends_at           timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  max_usuarios            integer NOT NULL DEFAULT 3,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. PROFILES: pertenencia a organización
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);

-- ============================================================
-- 3. HELPERS (SECURITY DEFINER => leen profiles sin pasar por RLS => sin recursión)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION user_has_role(roles rol_usuario[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.rol = ANY(roles)
  );
$$;

-- Evita escalada de privilegios: un usuario no-gestor no puede cambiar su rol ni su organización
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS trigger AS $$
BEGIN
  IF (NEW.rol IS DISTINCT FROM OLD.rol OR NEW.organization_id IS DISTINCT FROM OLD.organization_id)
     AND NOT user_has_role(ARRAY['owner','admin']::rol_usuario[]) THEN
    NEW.rol := OLD.rol;
    NEW.organization_id := OLD.organization_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_profiles_no_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_privilege_escalation();

-- ============================================================
-- 4. organization_id + índice en TODAS las tablas de negocio
--    (BBDD nueva y vacía => se añade NOT NULL directamente)
-- ============================================================
ALTER TABLE patients            ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE treatments          ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE patient_treatments  ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE appointments        ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE clinical_reports    ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE consent_templates   ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE consents            ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE patient_photos      ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE wa_conversations    ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE wa_messages         ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE crm_pipelines       ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE crm_stages          ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE crm_opportunities   ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE inventory_products  ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE stock_movements     ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE audit_log           ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE api_keys            ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_patients_org           ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_treatments_org         ON treatments(organization_id);
CREATE INDEX IF NOT EXISTS idx_pt_org                 ON patient_treatments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org       ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_org            ON clinical_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_consent_templates_org  ON consent_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_consents_org           ON consents(organization_id);
CREATE INDEX IF NOT EXISTS idx_photos_org             ON patient_photos(organization_id);
CREATE INDEX IF NOT EXISTS idx_wa_conv_org            ON wa_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_org             ON wa_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_org      ON crm_pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_stages_org         ON crm_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_opp_org            ON crm_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_org          ON inventory_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_org              ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_org              ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org           ON api_keys(organization_id);

-- settings pasa a ser por-organización: PK (organization_id, clave)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (organization_id, clave);

-- ============================================================
-- 5. Unicidad por-organización
-- ============================================================
-- patients.telefono: único dentro de cada clínica (dos clínicas pueden tener el mismo nº)
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_telefono_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_org_telefono ON patients(organization_id, telefono);

-- wa_conversations.telefono: único por organización
DROP INDEX IF EXISTS idx_wa_conv_telefono;
CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_conv_org_telefono ON wa_conversations(organization_id, telefono);

-- CRM ahora es nativo para todas las clínicas; los ids de GoHighLevel son opcionales (sync)
ALTER TABLE crm_pipelines     ALTER COLUMN ghl_pipeline_id DROP NOT NULL;
ALTER TABLE crm_pipelines     DROP CONSTRAINT IF EXISTS crm_pipelines_ghl_pipeline_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_pipelines_org_ghl ON crm_pipelines(organization_id, ghl_pipeline_id) WHERE ghl_pipeline_id IS NOT NULL;

ALTER TABLE crm_stages        DROP CONSTRAINT IF EXISTS crm_stages_ghl_stage_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_stages_org_ghl ON crm_stages(organization_id, ghl_stage_id) WHERE ghl_stage_id IS NOT NULL;

ALTER TABLE crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_ghl_opportunity_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_opp_org_ghl ON crm_opportunities(organization_id, ghl_opportunity_id) WHERE ghl_opportunity_id IS NOT NULL;

-- ============================================================
-- 6. Funciones existentes adaptadas a multi-tenant
-- ============================================================
-- Crear paciente desde oportunidad: hereda la organización de la oportunidad
CREATE OR REPLACE FUNCTION crear_paciente_desde_oportunidad(oportunidad_id uuid)
RETURNS uuid AS $$
DECLARE
  v_opp crm_opportunities%ROWTYPE;
  v_patient_id uuid;
BEGIN
  SELECT * INTO v_opp FROM crm_opportunities WHERE id = oportunidad_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Oportunidad no encontrada: %', oportunidad_id;
  END IF;

  IF v_opp.telefono IS NOT NULL THEN
    SELECT id INTO v_patient_id
    FROM patients
    WHERE telefono = v_opp.telefono
      AND organization_id = v_opp.organization_id
      AND deleted_at IS NULL;
  END IF;

  IF v_patient_id IS NULL THEN
    INSERT INTO patients (organization_id, nombre, apellidos, telefono, email, origen)
    VALUES (
      v_opp.organization_id,
      split_part(v_opp.nombre_contacto, ' ', 1),
      NULLIF(substring(v_opp.nombre_contacto FROM position(' ' IN v_opp.nombre_contacto) + 1), ''),
      COALESCE(v_opp.telefono, 'sin-tel-' || oportunidad_id),
      v_opp.email,
      'crm'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  UPDATE crm_opportunities SET patient_id = v_patient_id WHERE id = oportunidad_id;
  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auditoría: registra también la organización del usuario
CREATE OR REPLACE FUNCTION registrar_auditoria(
  p_accion text,
  p_entidad text,
  p_entidad_id uuid DEFAULT NULL,
  p_detalle jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (organization_id, usuario_id, accion, entidad, entidad_id, detalle)
  VALUES (get_user_org_id(), auth.uid(), p_accion, p_entidad, p_entidad_id, p_detalle);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Alta de organización + perfil owner (la usa el signup en Fase 4)
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_org_name text,
  p_slug text,
  p_vertical text,
  p_user_name text
)
RETURNS uuid AS $$
DECLARE
  v_org_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  INSERT INTO organizations (nombre, slug, vertical, owner_id)
  VALUES (p_org_name, p_slug, COALESCE(NULLIF(p_vertical, ''), 'general'), v_uid)
  RETURNING id INTO v_org_id;

  INSERT INTO profiles (id, nombre, rol, organization_id, activo)
  VALUES (v_uid, COALESCE(NULLIF(p_user_name, ''), 'Propietario'), 'owner', v_org_id, true)
  ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        rol = 'owner',
        nombre = EXCLUDED.nombre;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 7. Vistas: que respeten la RLS del que consulta (no la del owner de la vista)
-- ============================================================
ALTER VIEW v_recomendaciones_pendientes SET (security_invoker = true);
ALTER VIEW v_stock_bajo SET (security_invoker = true);

-- =============================================================================
-- 8. RLS — reescritura por organización (se eliminan las políticas single-tenant)
-- =============================================================================

-- ---- organizations ----
CREATE POLICY "org: miembros ven su organización"
  ON organizations FOR SELECT TO authenticated
  USING (id = get_user_org_id());
CREATE POLICY "org: owner/admin actualizan su organización"
  ON organizations FOR UPDATE TO authenticated
  USING (id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]))
  WITH CHECK (id = get_user_org_id());

-- ---- profiles ----
DROP POLICY IF EXISTS "Usuarios autenticados leen todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios solo modifican su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Admin puede gestionar perfiles" ON profiles;

CREATE POLICY "profiles: miembros ven su organización"
  ON profiles FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());
CREATE POLICY "profiles: cada uno edita su perfil"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles: owner/admin gestionan miembros"
  ON profiles FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]));

-- ---- patients ----
DROP POLICY IF EXISTS "Usuarios autenticados leen pacientes activos" ON patients;
DROP POLICY IF EXISTS "Usuarios autenticados crean pacientes" ON patients;
DROP POLICY IF EXISTS "Usuarios autenticados actualizan pacientes" ON patients;
DROP POLICY IF EXISTS "Solo admin puede borrar pacientes (soft delete)" ON patients;

CREATE POLICY "patients: leen los de su organización"
  ON patients FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "patients: crean en su organización"
  ON patients FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "patients: actualizan los de su organización"
  ON patients FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id() AND deleted_at IS NULL)
  WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "patients: owner/admin borran en su organización"
  ON patients FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]));

-- ---- treatments ----
DROP POLICY IF EXISTS "Autenticados leen tratamientos activos" ON treatments;
DROP POLICY IF EXISTS "Admin gestiona tratamientos" ON treatments;

CREATE POLICY "treatments: leen los de su organización"
  ON treatments FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());
CREATE POLICY "treatments: clínicos gestionan catálogo"
  ON treatments FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));

-- ---- patient_treatments ----
DROP POLICY IF EXISTS "Autenticados gestionan tratamientos asignados" ON patient_treatments;
CREATE POLICY "patient_treatments: por organización"
  ON patient_treatments FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ---- appointments ----
DROP POLICY IF EXISTS "Autenticados gestionan citas" ON appointments;
CREATE POLICY "appointments: por organización"
  ON appointments FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ---- clinical_reports (sensible: recepción y contable NO leen) ----
DROP POLICY IF EXISTS "Doctoras y admin leen informes" ON clinical_reports;
DROP POLICY IF EXISTS "Doctoras y admin escriben informes" ON clinical_reports;
DROP POLICY IF EXISTS "Doctoras y admin actualizan informes" ON clinical_reports;

CREATE POLICY "clinical_reports: clínicos leen"
  ON clinical_reports FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));
CREATE POLICY "clinical_reports: clínicos crean"
  ON clinical_reports FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));
CREATE POLICY "clinical_reports: clínicos actualizan"
  ON clinical_reports FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id());

-- ---- consent_templates ----
DROP POLICY IF EXISTS "Autenticados leen plantillas activas" ON consent_templates;
DROP POLICY IF EXISTS "Admin gestiona plantillas" ON consent_templates;

CREATE POLICY "consent_templates: leen las de su organización"
  ON consent_templates FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());
CREATE POLICY "consent_templates: clínicos gestionan"
  ON consent_templates FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));

-- ---- consents ----
DROP POLICY IF EXISTS "Autenticados gestionan consentimientos" ON consents;
CREATE POLICY "consents: por organización"
  ON consents FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ---- patient_photos (sensible: clínicos) ----
DROP POLICY IF EXISTS "Doctoras y admin gestionan fotos" ON patient_photos;
CREATE POLICY "patient_photos: clínicos gestionan"
  ON patient_photos FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));

-- ---- wa_conversations / wa_messages ----
DROP POLICY IF EXISTS "Autenticados gestionan conversaciones" ON wa_conversations;
CREATE POLICY "wa_conversations: por organización"
  ON wa_conversations FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Autenticados gestionan mensajes" ON wa_messages;
CREATE POLICY "wa_messages: por organización"
  ON wa_messages FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ---- CRM ----
DROP POLICY IF EXISTS "Autenticados leen pipelines" ON crm_pipelines;
DROP POLICY IF EXISTS "Admin gestiona pipelines" ON crm_pipelines;
CREATE POLICY "crm_pipelines: leen los de su organización"
  ON crm_pipelines FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());
CREATE POLICY "crm_pipelines: gestores gestionan"
  ON crm_pipelines FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','recepcion']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','recepcion']::rol_usuario[]));

DROP POLICY IF EXISTS "Autenticados leen stages" ON crm_stages;
DROP POLICY IF EXISTS "Admin gestiona stages" ON crm_stages;
CREATE POLICY "crm_stages: leen los de su organización"
  ON crm_stages FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());
CREATE POLICY "crm_stages: gestores gestionan"
  ON crm_stages FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','recepcion']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','recepcion']::rol_usuario[]));

DROP POLICY IF EXISTS "Autenticados gestionan oportunidades" ON crm_opportunities;
CREATE POLICY "crm_opportunities: por organización"
  ON crm_opportunities FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ---- inventario ----
DROP POLICY IF EXISTS "Autenticados gestionan inventario" ON inventory_products;
CREATE POLICY "inventory_products: por organización"
  ON inventory_products FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "Autenticados gestionan movimientos de stock" ON stock_movements;
CREATE POLICY "stock_movements: por organización"
  ON stock_movements FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ---- audit_log ----
DROP POLICY IF EXISTS "Admin lee audit log" ON audit_log;
DROP POLICY IF EXISTS "Sistema inserta en audit log" ON audit_log;
CREATE POLICY "audit_log: owner/admin leen el de su organización"
  ON audit_log FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]));
CREATE POLICY "audit_log: inserción en su organización"
  ON audit_log FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- ---- api_keys ----
DROP POLICY IF EXISTS "Solo admin gestiona API keys" ON api_keys;
CREATE POLICY "api_keys: owner/admin gestionan en su organización"
  ON api_keys FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]));

-- ---- settings ----
DROP POLICY IF EXISTS "Autenticados leen settings" ON settings;
DROP POLICY IF EXISTS "Admin modifica settings" ON settings;
CREATE POLICY "settings: leen los de su organización"
  ON settings FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());
CREATE POLICY "settings: owner/admin modifican"
  ON settings FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]));
