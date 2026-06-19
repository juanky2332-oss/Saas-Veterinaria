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
