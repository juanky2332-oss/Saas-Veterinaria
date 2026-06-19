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
