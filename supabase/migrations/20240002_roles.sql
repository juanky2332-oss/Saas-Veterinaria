-- =============================================================================
-- ClinicFlow — Roles del SaaS (genéricos, multi-vertical)
-- Renombra 'doctora' (específico de estética/femenino) a 'profesional' y añade
-- 'owner' (dueño de la clínica, gestiona la suscripción) y 'contable'.
--
-- En migración aparte: Postgres no permite USAR un valor de enum recién añadido
-- en la misma transacción en que se añade. Aquí solo se modifica el enum; el uso
-- (políticas RLS, función de alta) va en 20240003_multitenant.sql.
-- =============================================================================

ALTER TYPE rol_usuario RENAME VALUE 'doctora' TO 'profesional';
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'contable';
