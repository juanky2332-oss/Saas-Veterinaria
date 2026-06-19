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
