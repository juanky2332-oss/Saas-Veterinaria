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
