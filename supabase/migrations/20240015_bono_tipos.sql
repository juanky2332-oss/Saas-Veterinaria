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
