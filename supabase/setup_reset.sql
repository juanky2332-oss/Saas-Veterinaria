-- ================================================================
-- RESET COMPLETO — VetClinic
-- Ejecuta este script ANTES de setup_unico.sql para partir de cero.
-- BORRA TODOS LOS DATOS. Solo usar en desarrollo/demo.
-- ================================================================

-- 1. Eliminar políticas de Storage (están en storage schema, no en public)
DROP POLICY IF EXISTS "storage fotos: clínicos leen de su organización"      ON storage.objects;
DROP POLICY IF EXISTS "storage fotos: clínicos suben a su organización"      ON storage.objects;
DROP POLICY IF EXISTS "storage fotos: clínicos actualizan en su organización" ON storage.objects;
DROP POLICY IF EXISTS "storage fotos: clínicos borran de su organización"    ON storage.objects;
DROP POLICY IF EXISTS "storage docs: miembros leen de su organización"        ON storage.objects;
DROP POLICY IF EXISTS "storage docs: miembros suben a su organización"        ON storage.objects;
DROP POLICY IF EXISTS "storage docs: miembros actualizan en su organización"  ON storage.objects;
DROP POLICY IF EXISTS "storage docs: miembros borran de su organización"      ON storage.objects;
DROP POLICY IF EXISTS "org-assets: miembros suben a su organización"          ON storage.objects;
DROP POLICY IF EXISTS "org-assets: miembros actualizan su organización"       ON storage.objects;
DROP POLICY IF EXISTS "org-assets: miembros borran de su organización"        ON storage.objects;
DROP POLICY IF EXISTS "org-assets: lectura"                                    ON storage.objects;

-- 2. Eliminar schema público completo (tablas, triggers, funciones, policies)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 3. Restaurar permisos estándar de Supabase
GRANT USAGE  ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO postgres, service_role;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES   TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL    ON TABLES   TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL    ON SEQUENCES TO postgres, service_role;

-- ================================================================
-- Ahora ejecuta setup_unico.sql
-- ================================================================
