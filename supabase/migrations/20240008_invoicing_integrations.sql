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
