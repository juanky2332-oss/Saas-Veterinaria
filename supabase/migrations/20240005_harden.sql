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
