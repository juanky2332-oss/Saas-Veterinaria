-- =============================================================================
-- ClinicFlow — Storage privado multi-tenant
-- Buckets privados; el PRIMER segmento de la ruta del objeto es el
-- organization_id => aislamiento por clínica vía RLS en storage.objects.
-- Convención de ruta: {organization_id}/{patient_id}/{archivo}
--
-- RGPD: fotos clínicas y documentos en buckets PRIVADOS; el acceso del cliente
-- se hace siempre con signed URLs de corta duración generadas en el servidor.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ---- patient-photos: solo roles clínicos de la organización ----
CREATE POLICY "storage fotos: clínicos leen de su organización"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );
CREATE POLICY "storage fotos: clínicos suben a su organización"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );
CREATE POLICY "storage fotos: clínicos actualizan en su organización"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );
CREATE POLICY "storage fotos: clínicos borran de su organización"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-photos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND user_has_role(ARRAY['owner','admin','profesional']::rol_usuario[])
  );

-- ---- patient-documents: cualquier miembro de la organización ----
CREATE POLICY "storage docs: miembros leen de su organización"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
CREATE POLICY "storage docs: miembros suben a su organización"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
CREATE POLICY "storage docs: miembros actualizan en su organización"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
CREATE POLICY "storage docs: miembros borran de su organización"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
