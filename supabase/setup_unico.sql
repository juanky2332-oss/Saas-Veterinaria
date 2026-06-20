-- Veteriblandenguer — Schema completo (ejecutar en Supabase SQL Editor)
-- Este script usa COMMIT/BEGIN explícito para evitar el error 55P04 del ENUM

-- ============================================================
-- Veteriblandenguer — Setup completo de base de datos
-- Ejecutar de una vez en Supabase SQL Editor
-- Proyecto: wpizveklcchglpyaqhjt
-- ============================================================


-- ── Migración: 20240001_initial_schema.sql ──

-- =============================================================================
-- ESSE CLINIC — Migración inicial
-- Crea el esquema completo con RLS en todas las tablas con datos de paciente
-- =============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'doctora', 'recepcion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_cita AS ENUM ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE origen_cita AS ENUM ('manual', 'widget', 'whatsapp', 'crm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE categoria_tratamiento AS ENUM ('facial', 'corporal', 'capilar', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_treatment AS ENUM ('activo', 'pausado', 'finalizado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE origen_consentimiento AS ENUM ('digital', 'papel_subido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transcripcion_origen AS ENUM ('voz', 'escrito');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE direccion_mensaje AS ENUM ('in', 'out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_mensaje AS ENUM ('texto', 'plantilla', 'media');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enviado_por_tipo AS ENUM ('agente_ia', 'humano', 'sistema');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_agente_wa AS ENUM ('activo', 'pausado', 'humano');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sexo_paciente AS ENUM ('femenino', 'masculino', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PERFILES DE USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     text NOT NULL,
  rol        rol_usuario NOT NULL DEFAULT 'recepcion',
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados leen todos los perfiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios solo modifican su propio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin puede gestionar perfiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- Trigger: actualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PACIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           text NOT NULL,
  apellidos        text NOT NULL,
  fecha_nacimiento date,
  sexo             sexo_paciente,
  telefono         text NOT NULL UNIQUE,
  email            text,
  dni              text,
  direccion        text,
  alergias         text,
  observaciones    text,
  origen           text,
  ghl_contact_id   text,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_telefono ON patients(telefono);
CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_nombre ON patients(nombre, apellidos);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados leen pacientes activos"
  ON patients FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Usuarios autenticados crean pacientes"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados actualizan pacientes"
  ON patients FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Solo admin puede borrar pacientes (soft delete)"
  ON patients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRATAMIENTOS (catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                text NOT NULL,
  categoria             categoria_tratamiento NOT NULL DEFAULT 'otro',
  duracion_min          integer NOT NULL DEFAULT 60,
  precio_orientativo    numeric(10,2),
  periodicidad_meses    integer,
  activo                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen tratamientos activos"
  ON treatments FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admin gestiona tratamientos"
  ON treatments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'doctora')
    )
  );

-- ============================================================
-- TRATAMIENTOS ASIGNADOS A PACIENTE
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_treatments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id            uuid NOT NULL REFERENCES treatments(id),
  periodicidad_meses      integer NOT NULL,
  ultima_sesion_at        timestamptz,
  proxima_recomendada_at  timestamptz,
  estado                  estado_treatment NOT NULL DEFAULT 'activo',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_patient ON patient_treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_pt_proxima ON patient_treatments(proxima_recomendada_at) WHERE estado = 'activo';

ALTER TABLE patient_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan tratamientos asignados"
  ON patient_treatments FOR ALL
  TO authenticated
  USING (true);

CREATE TRIGGER trg_patient_treatments_updated_at
  BEFORE UPDATE ON patient_treatments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Función: recalcular proxima_recomendada_at
CREATE OR REPLACE FUNCTION recalcular_proxima_recomendacion()
RETURNS trigger AS $$
BEGIN
  IF NEW.ultima_sesion_at IS NOT NULL AND NEW.periodicidad_meses > 0 THEN
    NEW.proxima_recomendada_at := NEW.ultima_sesion_at + (NEW.periodicidad_meses || ' months')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pt_recalcular
  BEFORE INSERT OR UPDATE OF ultima_sesion_at, periodicidad_meses ON patient_treatments
  FOR EACH ROW EXECUTE FUNCTION recalcular_proxima_recomendacion();

-- ============================================================
-- CITAS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL REFERENCES patients(id),
  treatment_id uuid REFERENCES treatments(id),
  doctora_id   uuid NOT NULL REFERENCES profiles(id),
  sala         smallint NOT NULL DEFAULT 1,
  inicio       timestamptz NOT NULL,
  fin          timestamptz NOT NULL,
  estado       estado_cita NOT NULL DEFAULT 'pendiente',
  origen       origen_cita NOT NULL DEFAULT 'manual',
  notas        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_inicio ON appointments(inicio);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctora ON appointments(doctora_id);
CREATE INDEX IF NOT EXISTS idx_appointments_sala_inicio ON appointments(sala, inicio);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan citas"
  ON appointments FOR ALL
  TO authenticated
  USING (true);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- INFORMES CLÍNICOS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinical_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id        uuid REFERENCES appointments(id),
  patient_id            uuid NOT NULL REFERENCES patients(id),
  doctora_id            uuid NOT NULL REFERENCES profiles(id),
  contenido             jsonb NOT NULL DEFAULT '{}',
  transcripcion_origen  transcripcion_origen NOT NULL DEFAULT 'escrito',
  version               integer NOT NULL DEFAULT 1,
  firmado_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_patient ON clinical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_appointment ON clinical_reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reports_contenido ON clinical_reports USING gin(contenido);

ALTER TABLE clinical_reports ENABLE ROW LEVEL SECURITY;

-- Recepción NO puede leer informes clínicos
CREATE POLICY "Doctoras y admin leen informes"
  ON clinical_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'doctora')
    )
  );

CREATE POLICY "Doctoras y admin escriben informes"
  ON clinical_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'doctora')
    )
  );

CREATE POLICY "Doctoras y admin actualizan informes"
  ON clinical_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'doctora')
    )
  );

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON clinical_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PLANTILLAS DE CONSENTIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           text NOT NULL,
  cuerpo_richtext  text NOT NULL DEFAULT '',
  variables        jsonb NOT NULL DEFAULT '[]',
  activo           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen plantillas activas"
  ON consent_templates FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admin gestiona plantillas"
  ON consent_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'doctora')
    )
  );

CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON consent_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- CONSENTIMIENTOS FIRMADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS consents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL REFERENCES patients(id),
  template_id  uuid REFERENCES consent_templates(id),
  titulo       text NOT NULL,
  pdf_path     text,
  firmado_at   timestamptz,
  hash_sha256  text,
  origen       origen_consentimiento NOT NULL DEFAULT 'digital',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan consentimientos"
  ON consents FOR ALL
  TO authenticated
  USING (true);

-- ============================================================
-- FOTOS CLÍNICAS
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES patients(id),
  treatment_id  uuid REFERENCES treatments(id),
  storage_path  text NOT NULL,
  tomada_at     timestamptz NOT NULL DEFAULT now(),
  etiqueta      text CHECK (etiqueta IN ('antes', 'despues', 'seguimiento')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photos_patient ON patient_photos(patient_id);

ALTER TABLE patient_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctoras y admin gestionan fotos"
  ON patient_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.rol IN ('admin', 'doctora')
    )
  );

-- ============================================================
-- WHATSAPP: CONVERSACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS wa_conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid REFERENCES patients(id),
  crm_opportunity_id  uuid,
  telefono            text NOT NULL,
  estado_agente       estado_agente_wa NOT NULL DEFAULT 'activo',
  ultima_entrada_at   timestamptz,
  no_leidos           integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_conv_telefono ON wa_conversations(telefono);
CREATE INDEX IF NOT EXISTS idx_wa_conv_patient ON wa_conversations(patient_id);

ALTER TABLE wa_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan conversaciones"
  ON wa_conversations FOR ALL
  TO authenticated
  USING (true);

CREATE TRIGGER trg_wa_conversations_updated_at
  BEFORE UPDATE ON wa_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- WHATSAPP: MENSAJES
-- ============================================================
CREATE TABLE IF NOT EXISTS wa_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  direccion        direccion_mensaje NOT NULL,
  tipo             tipo_mensaje NOT NULL DEFAULT 'texto',
  cuerpo           text,
  media_path       text,
  wa_message_id    text,
  plantilla_nombre text,
  estado_envio     text,
  enviado_por      enviado_por_tipo NOT NULL DEFAULT 'humano',
  creado_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON wa_messages(conversation_id, creado_at);

ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan mensajes"
  ON wa_messages FOR ALL
  TO authenticated
  USING (true);

-- ============================================================
-- CRM: PIPELINES, STAGES, OPORTUNIDADES
-- ============================================================
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_pipeline_id  text NOT NULL UNIQUE,
  nombre           text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen pipelines"
  ON crm_pipelines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona pipelines"
  ON crm_pipelines FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol IN ('admin', 'recepcion')));

CREATE TABLE IF NOT EXISTS crm_stages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id    uuid NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  ghl_stage_id   text NOT NULL UNIQUE,
  nombre         text NOT NULL,
  orden          integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen stages"
  ON crm_stages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona stages"
  ON crm_stages FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol IN ('admin', 'recepcion')));

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_opportunity_id  text UNIQUE,
  stage_id            uuid NOT NULL REFERENCES crm_stages(id),
  nombre_contacto     text NOT NULL,
  telefono            text,
  email               text,
  valor               numeric(10,2),
  origen              text,
  patient_id          uuid REFERENCES patients(id),
  sync_estado         text,
  ultima_sync_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_opp_stage ON crm_opportunities(stage_id);

ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan oportunidades"
  ON crm_opportunities FOR ALL
  TO authenticated
  USING (true);

CREATE TRIGGER trg_crm_opp_updated_at
  BEFORE UPDATE ON crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- INVENTARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL,
  categoria      text NOT NULL DEFAULT 'general',
  proveedor      text,
  unidades       integer NOT NULL DEFAULT 0,
  umbral_alerta  integer NOT NULL DEFAULT 5,
  coste          numeric(10,2),
  lote           text,
  caducidad      date,
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan inventario"
  ON inventory_products FOR ALL
  TO authenticated
  USING (true);

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON inventory_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS stock_movements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES inventory_products(id),
  tipo             tipo_movimiento NOT NULL,
  cantidad         integer NOT NULL,
  motivo           text,
  appointment_id   uuid REFERENCES appointments(id),
  usuario_id       uuid NOT NULL REFERENCES profiles(id),
  creado_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados gestionan movimientos de stock"
  ON stock_movements FOR ALL
  TO authenticated
  USING (true);

-- Trigger: actualizar unidades en inventory_products al registrar movimiento
CREATE OR REPLACE FUNCTION aplicar_movimiento_stock()
RETURNS trigger AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE inventory_products SET unidades = unidades + NEW.cantidad WHERE id = NEW.product_id;
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE inventory_products SET unidades = GREATEST(0, unidades - NEW.cantidad) WHERE id = NEW.product_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE inventory_products SET unidades = GREATEST(0, unidades + NEW.cantidad) WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION aplicar_movimiento_stock();

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid REFERENCES profiles(id),
  accion      text NOT NULL,
  entidad     text NOT NULL,
  entidad_id  uuid,
  detalle     jsonb,
  creado_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entidad ON audit_log(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admin lee el audit log
CREATE POLICY "Admin lee audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));

-- Todos insertan (el sistema lo escribe)
CREATE POLICY "Sistema inserta en audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- API KEYS
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  hash_key      text NOT NULL UNIQUE,
  scopes        text[] NOT NULL DEFAULT '{}',
  activo        boolean NOT NULL DEFAULT true,
  ultima_uso_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin gestiona API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  clave  text PRIMARY KEY,
  valor  jsonb NOT NULL
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen settings"
  ON settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin modifica settings"
  ON settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.rol = 'admin'));

-- ============================================================
-- VISTAS
-- ============================================================

-- Vista: recomendaciones de tratamientos vencidas sin cita futura
CREATE OR REPLACE VIEW v_recomendaciones_pendientes AS
SELECT
  pt.patient_id,
  p.nombre AS patient_nombre,
  p.apellidos AS patient_apellidos,
  p.telefono AS patient_telefono,
  pt.treatment_id,
  t.nombre AS treatment_nombre,
  pt.proxima_recomendada_at,
  EXTRACT(DAY FROM (now() - pt.proxima_recomendada_at))::integer AS dias_vencido
FROM patient_treatments pt
JOIN patients p ON p.id = pt.patient_id AND p.deleted_at IS NULL
JOIN treatments t ON t.id = pt.treatment_id
WHERE
  pt.estado = 'activo'
  AND pt.proxima_recomendada_at < now()
  AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = pt.patient_id
      AND a.treatment_id = pt.treatment_id
      AND a.inicio > now()
      AND a.estado NOT IN ('cancelada', 'no_show')
  );

-- Vista: productos con stock por debajo del umbral de alerta
CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT
  id, nombre, categoria, unidades, umbral_alerta, proveedor
FROM inventory_products
WHERE activo = true AND unidades <= umbral_alerta;

-- ============================================================
-- FUNCIÓN: Crear paciente desde oportunidad CRM
-- ============================================================
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

  -- Buscar por teléfono
  IF v_opp.telefono IS NOT NULL THEN
    SELECT id INTO v_patient_id FROM patients WHERE telefono = v_opp.telefono AND deleted_at IS NULL;
  END IF;

  -- Si no existe, crear
  IF v_patient_id IS NULL THEN
    INSERT INTO patients (nombre, apellidos, telefono, email, origen)
    VALUES (
      split_part(v_opp.nombre_contacto, ' ', 1),
      NULLIF(substring(v_opp.nombre_contacto FROM position(' ' IN v_opp.nombre_contacto) + 1), ''),
      COALESCE(v_opp.telefono, 'sin-tel-' || oportunidad_id),
      v_opp.email,
      'crm'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  -- Vincular oportunidad al paciente
  UPDATE crm_opportunities SET patient_id = v_patient_id WHERE id = oportunidad_id;

  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar en audit_log desde el servidor
CREATE OR REPLACE FUNCTION registrar_auditoria(
  p_accion text,
  p_entidad text,
  p_entidad_id uuid DEFAULT NULL,
  p_detalle jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(), p_accion, p_entidad, p_entidad_id, p_detalle);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── Migración: 20240002_roles.sql ──

-- =============================================================================
-- ClinicFlow — Roles del SaaS (genéricos, multi-vertical)
-- Renombra 'doctora' (específico de estética/femenino) a 'profesional' y añade
-- 'owner' (dueño de la clínica, gestiona la suscripción) y 'contable'.
--
-- En migración aparte: Postgres no permite USAR un valor de enum recién añadido
-- en la misma transacción en que se añade. Aquí solo se modifica el enum; el uso
-- (políticas RLS, función de alta) va en 20240003_multitenant.sql.
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE rol_usuario RENAME VALUE 'doctora' TO 'profesional';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'contable';

-- ══════════════════════════════════════════════════════════════════
-- COMMIT aquí para que PostgreSQL registre los nuevos valores de ENUM
-- antes de usarlos en la Parte 2.
-- ══════════════════════════════════════════════════════════════════
COMMIT;
BEGIN;



-- ── Migración: 20240003_multitenant.sql ──

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


-- ── Migración: 20240004_storage.sql ──

-- =============================================================================
-- ClinicFlow — Storage privado multi-tenant
-- Buckets privados; el PRIMER segmento de la ruta del objeto es el
-- organization_id => aislamiento por clínica vía RLS en storage.objects.
-- Convención de ruta: {organization_id}/{patient_id}/{archivo}
--
-- RGPD: fotos clínicas y documentos en buckets PRIVADOS; el acceso del cliente
-- se hace siempre con signed URLs de corta duración generadas en el servidor.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ---- patient-photos: solo roles clínicos de la organización ----
CREATE POLICY "storage fotos: clínicos leen de su organización"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );
CREATE POLICY "storage fotos: clínicos suben a su organización"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );
CREATE POLICY "storage fotos: clínicos actualizan en su organización"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );
CREATE POLICY "storage fotos: clínicos borran de su organización"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );

-- ---- patient-documents: cualquier miembro de la organización ----
CREATE POLICY "storage docs: miembros leen de su organización"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
CREATE POLICY "storage docs: miembros suben a su organización"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
CREATE POLICY "storage docs: miembros actualizan en su organización"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
CREATE POLICY "storage docs: miembros borran de su organización"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );


-- ── Migración: 20240005_harden.sql ──

-- =============================================================================
-- ClinicFlow — Endurecimiento de funciones (resuelve advisors de seguridad)
--   · search_path fijo en funciones heredadas de Esse
--   · funciones de trigger NO expuestas como RPC (revoke a anon/authenticated)
--   · funciones de negocio SECURITY DEFINER no accesibles por anon
-- (get_user_org_id/user_has_role siguen accesibles por authenticated: la RLS los necesita)
-- =============================================================================

ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.recalcular_proxima_recomendacion() SET search_path = public;
ALTER FUNCTION public.aplicar_movimiento_stock() SET search_path = public;

-- Funciones de trigger: no deben ser llamables vía RPC
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalcular_proxima_recomendacion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.aplicar_movimiento_stock() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM anon, authenticated;

-- Funciones de negocio SECURITY DEFINER: anon nunca debe ejecutarlas
REVOKE EXECUTE ON FUNCTION public.create_organization_with_owner(text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.registrar_auditoria(text, text, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.crear_paciente_desde_oportunidad(uuid) FROM anon;

-- Helpers de RLS: anon no los necesita (las políticas son TO authenticated)
REVOKE EXECUTE ON FUNCTION public.get_user_org_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_role(rol_usuario[]) FROM anon;


-- ── Migración: 20240006_auto_org_id.sql ──

-- =============================================================================
-- ClinicFlow — Autocompletado de organization_id en INSERT (sesión del usuario)
-- Un BEFORE INSERT rellena organization_id := get_user_org_id() si viene NULL.
-- Así los inserts de usuarios autenticados (UI/server actions) quedan auto-scoped
-- sin tocar el código existente. Los caminos con service_role (webhooks/API) NO
-- tienen sesión (auth.uid() = NULL) => deben fijar organization_id explícitamente.
-- La RLS WITH CHECK (organization_id = get_user_org_id()) sigue validando.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_org_id_from_session()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_user_org_id();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_org_id_from_session() FROM anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients','treatments','patient_treatments','appointments','clinical_reports',
    'consent_templates','consents','patient_photos','wa_conversations','wa_messages',
    'crm_pipelines','crm_stages','crm_opportunities','inventory_products',
    'stock_movements','audit_log','api_keys','settings'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_org_id ON public.%I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_org_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();', t
    );
  END LOOP;
END $$;


-- ── Migración: 20240007_billing_columns.sql ──

-- ClinicFlow — Columnas de facturación de la suscripción (Stripe)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS current_period_end timestamptz;


-- ── Migración: 20240008_invoicing_integrations.sql ──

-- =============================================================================
-- ClinicFlow — Módulo de facturación (nativo) + integraciones por organización
--   · billing_settings: datos fiscales + serie + contador por clínica
--   · invoices + invoice_items: facturas que la clínica emite a sus pacientes
--     (preparado para Verifacti → Verifactu + TicketBAI)
--   · org_integrations: config por clínica de WhatsApp/GHL/Holded/Verifacti
--     (external_id enruta los webhooks entrantes a la organización correcta)
-- Todo con organization_id + RLS + autocompletado de org en INSERT.
-- =============================================================================

-- ─────────── billing_settings ───────────
CREATE TABLE IF NOT EXISTS billing_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  razon_social text,
  nif text,
  direccion text,
  iva_default numeric(5,2) NOT NULL DEFAULT 21,
  serie text NOT NULL DEFAULT 'A',
  proximo_numero integer NOT NULL DEFAULT 1,
  verifacti_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_billing_settings_updated_at BEFORE UPDATE ON billing_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_billing_settings_org BEFORE INSERT ON billing_settings FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
CREATE POLICY "billing_settings: leen su org" ON billing_settings FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "billing_settings: owner/admin/contable gestionan" ON billing_settings FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','contable']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','contable']::rol_usuario[]));

-- ─────────── invoices ───────────
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  numero text NOT NULL,
  fecha date NOT NULL DEFAULT current_date,
  cliente_nombre text NOT NULL,
  cliente_nif text,
  cliente_direccion text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  iva_total numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'emitida' CHECK (estado IN ('borrador','emitida','pagada','anulada')),
  notas text,
  verifacti_id text,
  verifacti_estado text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_org_numero ON invoices(organization_id, numero);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoices_org BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
CREATE POLICY "invoices: leen su org" ON invoices FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "invoices: facturación gestiona" ON invoices FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','contable','recepcion']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','contable','recepcion']::rol_usuario[]));

-- ─────────── invoice_items ───────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad numeric(10,2) NOT NULL DEFAULT 1,
  precio_unitario numeric(10,2) NOT NULL DEFAULT 0,
  iva_pct numeric(5,2) NOT NULL DEFAULT 21,
  importe numeric(10,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_invoice_items_org BEFORE INSERT ON invoice_items FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
CREATE POLICY "invoice_items: leen su org" ON invoice_items FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "invoice_items: facturación gestiona" ON invoice_items FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','contable','recepcion']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','contable','recepcion']::rol_usuario[]));

-- ─────────── numeración atómica de facturas ───────────
CREATE OR REPLACE FUNCTION siguiente_numero_factura()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid := get_user_org_id(); v_num integer; v_serie text;
BEGIN
  IF v_org IS NULL THEN RAISE EXCEPTION 'Sin organización'; END IF;
  INSERT INTO billing_settings (organization_id) VALUES (v_org) ON CONFLICT (organization_id) DO NOTHING;
  UPDATE billing_settings SET proximo_numero = proximo_numero + 1
  WHERE organization_id = v_org
  RETURNING proximo_numero - 1, serie INTO v_num, v_serie;
  RETURN v_serie || '-' || lpad(v_num::text, 4, '0');
END; $$;
REVOKE EXECUTE ON FUNCTION public.siguiente_numero_factura() FROM anon;

-- ─────────── org_integrations ───────────
CREATE TABLE IF NOT EXISTS org_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('whatsapp','ghl','holded','gemini','verifacti')),
  external_id text,        -- phone_number_id / location_id → enruta webhooks
  config jsonb NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tipo)
);
CREATE INDEX IF NOT EXISTS idx_org_integrations_routing ON org_integrations(tipo, external_id) WHERE external_id IS NOT NULL;
ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_org_integrations_updated_at BEFORE UPDATE ON org_integrations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_org_integrations_org BEFORE INSERT ON org_integrations FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
CREATE POLICY "org_integrations: leen su org" ON org_integrations FOR SELECT TO authenticated USING (organization_id = get_user_org_id());
CREATE POLICY "org_integrations: owner/admin gestionan" ON org_integrations FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin']::rol_usuario[]));


-- ── Migración: 20240009_v2_modules.sql ──

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


-- ── Migración: 20240010_clinical_core.sql ──

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


-- ── Migración: 20240011_gestion.sql ──

-- =============================================================================
-- ClinicFlow — Bloque B: gestión y dinero
--   · Verifacti: QR + URL AEAT en invoices
--   · mutuas, proveedores
--   · presupuestos (quotes + quote_items)
--   · bonos de sesiones (bonos + bono_consumos)
--   · caja (cash_sessions + cash_movements)
--   · cuotas recurrentes
-- RLS: aislamiento por organización (cualquier miembro de la org).
-- Idempotente: re-ejecutable (DROP IF EXISTS en triggers y políticas).
-- =============================================================================

-- Verifacti: datos del registro devueltos por la API
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifacti_qr text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifacti_url text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifacti_enviado_at timestamptz;

-- ── Mutuas / aseguradoras ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mutuas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cif text,
  telefono text,
  email text,
  condiciones text,
  descuento_pct numeric(5,2),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mutuas_org ON mutuas(organization_id);
ALTER TABLE mutuas ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_mutuas_org ON mutuas;
CREATE TRIGGER trg_mutuas_org BEFORE INSERT ON mutuas FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "mutuas_org" ON mutuas;
CREATE POLICY "mutuas_org" ON mutuas FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- ── Proveedores ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cif text,
  contacto text,
  telefono text,
  email text,
  direccion text,
  categoria text,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proveedores_org ON proveedores(organization_id);
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_proveedores_org ON proveedores;
CREATE TRIGGER trg_proveedores_org BEFORE INSERT ON proveedores FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "proveedores_org" ON proveedores;
CREATE POLICY "proveedores_org" ON proveedores FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- ── Presupuestos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  numero text NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  cliente_nombre text NOT NULL,
  cliente_nif text,
  cliente_direccion text,
  fecha date NOT NULL DEFAULT current_date,
  validez date,
  estado text NOT NULL DEFAULT 'borrador',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  iva_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  notas text,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_patient ON quotes(patient_id);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_quotes_org ON quotes;
CREATE TRIGGER trg_quotes_org BEFORE INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "quotes_org" ON quotes;
CREATE POLICY "quotes_org" ON quotes FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad numeric(10,2) NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL DEFAULT 0,
  descuento_pct numeric(5,2) NOT NULL DEFAULT 0,
  iva_pct numeric(5,2) NOT NULL DEFAULT 21,
  importe numeric(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_quote_items_org ON quote_items;
CREATE TRIGGER trg_quote_items_org BEFORE INSERT ON quote_items FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "quote_items_org" ON quote_items;
CREATE POLICY "quote_items_org" ON quote_items FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- ── Bonos de sesiones ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bonos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  treatment_id uuid REFERENCES treatments(id) ON DELETE SET NULL,
  sesiones_total integer NOT NULL DEFAULT 1,
  sesiones_usadas integer NOT NULL DEFAULT 0,
  precio numeric(12,2) NOT NULL DEFAULT 0,
  fecha_compra date NOT NULL DEFAULT current_date,
  caducidad date,
  estado text NOT NULL DEFAULT 'activo',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bonos_org ON bonos(organization_id);
CREATE INDEX IF NOT EXISTS idx_bonos_patient ON bonos(patient_id);
ALTER TABLE bonos ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_bonos_org ON bonos;
CREATE TRIGGER trg_bonos_org BEFORE INSERT ON bonos FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "bonos_org" ON bonos;
CREATE POLICY "bonos_org" ON bonos FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS bono_consumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bono_id uuid NOT NULL REFERENCES bonos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bono_consumos_bono ON bono_consumos(bono_id);
ALTER TABLE bono_consumos ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_bono_consumos_org ON bono_consumos;
CREATE TRIGGER trg_bono_consumos_org BEFORE INSERT ON bono_consumos FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "bono_consumos_org" ON bono_consumos;
CREATE POLICY "bono_consumos_org" ON bono_consumos FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- ── Caja ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  apertura numeric(12,2) NOT NULL DEFAULT 0,
  cierre numeric(12,2),
  estado text NOT NULL DEFAULT 'abierta',
  abierta_por uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_org ON cash_sessions(organization_id, fecha);
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_cash_sessions_org ON cash_sessions;
CREATE TRIGGER trg_cash_sessions_org BEFORE INSERT ON cash_sessions FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "cash_sessions_org" ON cash_sessions;
CREATE POLICY "cash_sessions_org" ON cash_sessions FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id uuid REFERENCES cash_sessions(id) ON DELETE SET NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL DEFAULT 'ingreso',
  concepto text NOT NULL,
  metodo text NOT NULL DEFAULT 'efectivo',
  importe numeric(12,2) NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cash_movements_org ON cash_movements(organization_id, fecha);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(session_id);
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_cash_movements_org ON cash_movements;
CREATE TRIGGER trg_cash_movements_org BEFORE INSERT ON cash_movements FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "cash_movements_org" ON cash_movements;
CREATE POLICY "cash_movements_org" ON cash_movements FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- ── Cuotas recurrentes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cuotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  concepto text NOT NULL,
  importe numeric(12,2) NOT NULL,
  periodicidad text NOT NULL DEFAULT 'mensual',
  proximo_cobro date,
  metodo text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cuotas_org ON cuotas(organization_id);
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_cuotas_org ON cuotas;
CREATE TRIGGER trg_cuotas_org BEFORE INSERT ON cuotas FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "cuotas_org" ON cuotas;
CREATE POLICY "cuotas_org" ON cuotas FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());


-- ── Migración: 20240012_voz.sql ──

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


-- ── Migración: 20240013_recetas.sql ──

-- =============================================================================
-- ClinicFlow — Recetas / prescripciones
--   · recipes: cabecera de receta (paciente, prescriptor, diagnóstico)
--   · recipe_items: líneas (medicamento, posología, duración…)
-- RLS por organización.
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctora_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT current_date,
  diagnostico text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recipes_org ON recipes(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipes_patient ON recipes(patient_id);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_recipes_org ON recipes;
CREATE TRIGGER trg_recipes_org BEFORE INSERT ON recipes FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "recipes_org" ON recipes;
CREATE POLICY "recipes_org" ON recipes FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));

CREATE TABLE IF NOT EXISTS recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  medicamento text NOT NULL,
  posologia text,
  duracion text,
  cantidad text,
  observaciones text
);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_recipe_items_org ON recipe_items;
CREATE TRIGGER trg_recipe_items_org BEFORE INSERT ON recipe_items FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "recipe_items_org" ON recipe_items;
CREATE POLICY "recipe_items_org" ON recipe_items FOR ALL TO authenticated
  USING (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]))
  WITH CHECK (organization_id = get_user_org_id() AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[]));


-- ── Migración: 20240014_timezone.sql ──

-- =============================================================================
-- ClinicFlow — Zona horaria por clínica (agenda multi-región)
-- =============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Madrid';


-- ── Migración: 20240015_bono_tipos.sql ──

-- =============================================================================
-- ClinicFlow — Plantillas/tipos de bono por organización
--   Permiten definir bonos predeterminados (p. ej. "10 sesiones — 400€") y
--   crearlos rápido desde un desplegable (además del bono personalizado manual).
-- =============================================================================
CREATE TABLE IF NOT EXISTS bono_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  sesiones integer NOT NULL DEFAULT 1,
  precio numeric(12,2) NOT NULL DEFAULT 0,
  treatment_id uuid REFERENCES treatments(id) ON DELETE SET NULL,
  caducidad_meses integer,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bono_tipos_org ON bono_tipos(organization_id);
ALTER TABLE bono_tipos ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_bono_tipos_org ON bono_tipos;
CREATE TRIGGER trg_bono_tipos_org BEFORE INSERT ON bono_tipos FOR EACH ROW EXECUTE FUNCTION set_org_id_from_session();
DROP POLICY IF EXISTS "bono_tipos_org" ON bono_tipos;
CREATE POLICY "bono_tipos_org" ON bono_tipos FOR ALL TO authenticated
  USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());


-- ── Migración: 20260001_vet_entities.sql ──

-- ============================================================
-- Veteriblandenguer — Entidades veterinarias
-- Requiere: migraciones 20240001-20240007 (del fork base)
-- ============================================================

-- ── Actualizar trial a 10 días ──
ALTER TABLE organizations ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '10 days');

-- ── Tabla clientes (dueños de mascotas) ──
CREATE TABLE clientes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  apellidos         text,
  telefono          text,
  email             text,
  nif               text,
  direccion         text,
  ciudad            text,
  cp                text,
  notas             text,
  recordatorios_wa  boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes: leen los de su organización"
  ON clientes FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "clientes: insertan en su organización"
  ON clientes FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "clientes: actualizan en su organización"
  ON clientes FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "clientes: eliminan en su organización"
  ON clientes FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_clientes_org ON clientes(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clientes_email ON clientes(organization_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_clientes_telefono ON clientes(organization_id, telefono) WHERE telefono IS NOT NULL;

-- ── Tabla mascotas (los pacientes reales) ──
CREATE TYPE especie_animal AS ENUM (
  'perro', 'gato', 'conejo', 'ave', 'reptil', 'roedor', 'pez', 'otro'
);

CREATE TABLE mascotas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cliente_id        uuid REFERENCES clientes(id) ON DELETE SET NULL,
  nombre            text NOT NULL,
  especie           especie_animal NOT NULL DEFAULT 'otro',
  raza              text,
  fecha_nacimiento  date,
  sexo              text CHECK (sexo IN ('macho', 'hembra', 'desconocido')),
  color             text,
  peso_kg           numeric(5,2),
  num_chip          text,
  esterilizado      boolean NOT NULL DEFAULT false,
  alergias          text,
  observaciones     text,
  foto_url          text,
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mascotas: leen los de su organización"
  ON mascotas FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "mascotas: insertan en su organización"
  ON mascotas FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "mascotas: actualizan en su organización"
  ON mascotas FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "mascotas: eliminan en su organización"
  ON mascotas FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_mascotas_org        ON mascotas(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mascotas_cliente    ON mascotas(cliente_id);
CREATE INDEX idx_mascotas_chip       ON mascotas(organization_id, num_chip) WHERE num_chip IS NOT NULL;

-- ── Tabla historia_clinica_vet (registros por visita) ──
CREATE TABLE historia_clinica_vet (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mascota_id        uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  fecha             date NOT NULL DEFAULT CURRENT_DATE,
  motivo            text,
  anamnesis         text,
  exploracion       text,
  diagnostico       text,
  tratamiento       text,
  observaciones     text,
  veterinario_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE historia_clinica_vet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historia_vet: leen los de su organización"
  ON historia_clinica_vet FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "historia_vet: insertan en su organización"
  ON historia_clinica_vet FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "historia_vet: actualizan en su organización"
  ON historia_clinica_vet FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "historia_vet: eliminan en su organización"
  ON historia_clinica_vet FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_historia_vet_org     ON historia_clinica_vet(organization_id);
CREATE INDEX idx_historia_vet_mascota ON historia_clinica_vet(mascota_id, fecha DESC);

-- ── Tabla vacunaciones_vet ──
CREATE TABLE vacunaciones_vet (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mascota_id        uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  vacuna            text NOT NULL,
  fabricante        text,
  lote              text,
  fecha_aplicacion  date NOT NULL,
  fecha_proxima     date,
  veterinario_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notas             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vacunaciones_vet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vacunaciones: leen los de su organización"
  ON vacunaciones_vet FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "vacunaciones: insertan en su organización"
  ON vacunaciones_vet FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "vacunaciones: actualizan en su organización"
  ON vacunaciones_vet FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "vacunaciones: eliminan en su organización"
  ON vacunaciones_vet FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_vacunaciones_org     ON vacunaciones_vet(organization_id);
CREATE INDEX idx_vacunaciones_mascota ON vacunaciones_vet(mascota_id, fecha_aplicacion DESC);
CREATE INDEX idx_vacunaciones_proxima ON vacunaciones_vet(organization_id, fecha_proxima) WHERE fecha_proxima IS NOT NULL;

-- ── Tabla desparasitaciones_vet ──
CREATE TABLE desparasitaciones_vet (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mascota_id        uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  tipo              text NOT NULL CHECK (tipo IN ('interna', 'externa', 'ambas')),
  producto          text,
  fecha_aplicacion  date NOT NULL,
  fecha_proxima     date,
  veterinario_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notas             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE desparasitaciones_vet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desparasitaciones: leen los de su organización"
  ON desparasitaciones_vet FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "desparasitaciones: insertan en su organización"
  ON desparasitaciones_vet FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "desparasitaciones: actualizan en su organización"
  ON desparasitaciones_vet FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "desparasitaciones: eliminan en su organización"
  ON desparasitaciones_vet FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_desparasitaciones_org     ON desparasitaciones_vet(organization_id);
CREATE INDEX idx_desparasitaciones_mascota ON desparasitaciones_vet(mascota_id);
CREATE INDEX idx_desparasitaciones_proxima ON desparasitaciones_vet(organization_id, fecha_proxima) WHERE fecha_proxima IS NOT NULL;

-- ── Tabla servicios_vet (catálogo de servicios/precios de la clínica) ──
CREATE TABLE servicios_vet (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  descripcion       text,
  precio            numeric(8,2) NOT NULL DEFAULT 0,
  iva_pct           numeric(4,2) NOT NULL DEFAULT 21,
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE servicios_vet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicios_vet: leen los de su organización"
  ON servicios_vet FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "servicios_vet: insertan en su organización"
  ON servicios_vet FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "servicios_vet: actualizan en su organización"
  ON servicios_vet FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "servicios_vet: eliminan en su organización"
  ON servicios_vet FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE INDEX idx_servicios_vet_org ON servicios_vet(organization_id) WHERE activo = true;

-- ── Trigger: organization_id automático para tablas veterinarias ──
-- (el trigger auto_org_id de la migración 20240006 ya lo hace si se configura
--  para estas tablas; de lo contrario se inyecta siempre desde el server action)

-- ── Actualizar onboarding: vertical por defecto = 'veterinaria' ──
-- La función create_organization_with_owner ya acepta p_vertical;
-- el formulario de onboarding enviará 'veterinaria' hardcoded en v1.

COMMENT ON TABLE clientes IS 'Dueños/propietarios de las mascotas. La factura va a su nombre.';
COMMENT ON TABLE mascotas IS 'Los pacientes animales. La historia clínica va a su nombre.';
COMMENT ON TABLE historia_clinica_vet IS 'Registros por visita: exploración, diagnóstico, tratamiento.';
COMMENT ON TABLE vacunaciones_vet IS 'Vacunas administradas con fecha próxima para recordatorios.';
COMMENT ON TABLE desparasitaciones_vet IS 'Tratamientos antiparasitarios con fecha próxima para recordatorios.';
COMMENT ON TABLE servicios_vet IS 'Catálogo de servicios de la clínica con precio e IVA.';

-- Confirmar transacción abierta en línea 801
COMMIT;


