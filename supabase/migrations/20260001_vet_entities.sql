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
