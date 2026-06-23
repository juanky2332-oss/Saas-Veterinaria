-- ================================================================
-- DATOS DE DEMOSTRACIÓN — VetClinic
-- Ejecutar en Supabase → SQL Editor DESPUÉS de haber completado
-- el registro y creado tu clínica en la app.
-- ================================================================

DO $$
DECLARE
  v_org_id  uuid;
  v_vet_id  uuid;

  -- clientes (dueños)
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
  c4 uuid := gen_random_uuid();
  c5 uuid := gen_random_uuid();
  c6 uuid := gen_random_uuid();

  -- mascotas
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  m3 uuid := gen_random_uuid();
  m4 uuid := gen_random_uuid();
  m5 uuid := gen_random_uuid();
  m6 uuid := gen_random_uuid();
  m7 uuid := gen_random_uuid();
  m8 uuid := gen_random_uuid();

  -- patients (sistema citas)
  p1 uuid;
  p2 uuid;
  p3 uuid;
  p4 uuid;

  -- treatments
  t_consulta      uuid;
  t_vacuna_rab    uuid;
  t_vacuna_poliv  uuid;
  t_revision      uuid;
  t_dental        uuid;

BEGIN
  -- Obtener la org creada al registrarse
  SELECT id       INTO v_org_id FROM organizations LIMIT 1;
  SELECT owner_id INTO v_vet_id FROM organizations WHERE id = v_org_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No hay ninguna organización. Completa el registro en la app primero.';
  END IF;

  -- ================================================================
  -- CATÁLOGO DE TRATAMIENTOS
  -- ================================================================
  INSERT INTO treatments (organization_id, nombre, categoria, duracion_min, precio_orientativo, periodicidad_meses, activo)
  VALUES
    (v_org_id, 'Consulta general',         'otro', 30,  35.00, null, true),
    (v_org_id, 'Vacunación antirrábica',   'otro', 15,  25.00,   12, true),
    (v_org_id, 'Vacunación polivalente',   'otro', 15,  30.00,   12, true),
    (v_org_id, 'Desparasitación completa', 'otro', 15,  20.00,    3, true),
    (v_org_id, 'Revisión anual completa',  'otro', 45,  60.00,   12, true),
    (v_org_id, 'Limpieza dental',           'otro', 60, 120.00, null, true),
    (v_org_id, 'Microchip',                 'otro', 15,  45.00, null, true),
    (v_org_id, 'Cirugía menor',             'otro', 90, 200.00, null, true),
    (v_org_id, 'Radiografía',               'otro', 30,  80.00, null, true),
    (v_org_id, 'Análisis de sangre',        'otro', 20,  55.00, null, true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO t_consulta    FROM treatments WHERE nombre = 'Consulta general'        AND organization_id = v_org_id LIMIT 1;
  SELECT id INTO t_vacuna_rab  FROM treatments WHERE nombre = 'Vacunación antirrábica'  AND organization_id = v_org_id LIMIT 1;
  SELECT id INTO t_vacuna_poliv FROM treatments WHERE nombre = 'Vacunación polivalente' AND organization_id = v_org_id LIMIT 1;
  SELECT id INTO t_revision    FROM treatments WHERE nombre = 'Revisión anual completa' AND organization_id = v_org_id LIMIT 1;
  SELECT id INTO t_dental      FROM treatments WHERE nombre = 'Limpieza dental'         AND organization_id = v_org_id LIMIT 1;

  -- ================================================================
  -- CLIENTES (dueños de mascotas)
  -- ================================================================
  INSERT INTO clientes (id, organization_id, nombre, apellidos, telefono, email, ciudad, recordatorios_wa)
  VALUES
    (c1, v_org_id, 'María',   'González Pérez',    '612345671', 'maria.gonzalez@demo.com',  'Madrid', true),
    (c2, v_org_id, 'Carlos',  'Martínez López',    '623456782', 'carlos.martinez@demo.com', 'Madrid', true),
    (c3, v_org_id, 'Ana',     'Rodríguez García', '634567893', 'ana.rodriguez@demo.com',   'Madrid', false),
    (c4, v_org_id, 'Luis',    'Sánchez Fernández','645678904', 'luis.sanchez@demo.com',    'Madrid', true),
    (c5, v_org_id, 'Laura',   'López Martínez',   '656789015', 'laura.lopez@demo.com',     'Madrid', true),
    (c6, v_org_id, 'Javier',  'García Ruiz',       '667890126', 'javier.garcia@demo.com',   'Madrid', false)
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- MASCOTAS
  -- ================================================================
  INSERT INTO mascotas (id, organization_id, cliente_id, nombre, especie, raza, fecha_nacimiento, sexo, peso_kg)
  VALUES
    (m1, v_org_id, c1, 'Toby',  'perro',  'Golden Retriever',   '2020-03-15', 'macho',        28.5),
    (m2, v_org_id, c1, 'Luna',  'gato',   'Europeo común',      '2021-06-20', 'hembra',        3.8),
    (m3, v_org_id, c2, 'Rex',   'perro',  'Pastor Alemán',      '2019-11-05', 'macho',        35.0),
    (m4, v_org_id, c3, 'Mia',   'gato',   'Siamés',             '2022-01-10', 'hembra',        3.2),
    (m5, v_org_id, c4, 'Buddy', 'perro',  'Labrador',            '2021-08-22', 'macho',        30.0),
    (m6, v_org_id, c5, 'Nala',  'perro',  'Bulldog Francés',     '2022-04-18', 'hembra',       11.5),
    (m7, v_org_id, c6, 'Pico',  'ave',    'Periquito',           '2023-01-01', 'macho',         0.04),
    (m8, v_org_id, c5, 'Max',   'conejo', 'Enano holandés',     '2022-09-30', 'macho',         1.2)
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- PATIENTS (sistema de citas)
  -- ================================================================
  INSERT INTO patients (organization_id, nombre, apellidos, telefono, email)
  VALUES
    (v_org_id, 'María',   'González Pérez',    '699000001', 'p1@demo.com'),
    (v_org_id, 'Carlos',  'Martínez López',    '699000002', 'p2@demo.com'),
    (v_org_id, 'Ana',     'Rodríguez García', '699000003', 'p3@demo.com'),
    (v_org_id, 'Laura',   'López Martínez',   '699000004', 'p4@demo.com')
  ON CONFLICT (telefono) DO NOTHING;

  SELECT id INTO p1 FROM patients WHERE telefono = '699000001';
  SELECT id INTO p2 FROM patients WHERE telefono = '699000002';
  SELECT id INTO p3 FROM patients WHERE telefono = '699000003';
  SELECT id INTO p4 FROM patients WHERE telefono = '699000004';

  -- ================================================================
  -- CITAS (2 hoy + 2 mañana + 6 historial)
  -- ================================================================
  INSERT INTO appointments (organization_id, patient_id, treatment_id, doctora_id, inicio, fin, estado, notas)
  VALUES
    -- HOY
    (v_org_id, p1, t_consulta,   v_vet_id, now()::date + time '10:00', now()::date + time '10:30', 'confirmada', 'Toby — revisión digestiva'),
    (v_org_id, p2, t_vacuna_rab, v_vet_id, now()::date + time '11:00', now()::date + time '11:15', 'pendiente',  'Rex — vacuna antirrábica anual'),
    -- MAÑANA
    (v_org_id, p3, t_revision,   v_vet_id, (now()::date + 1) + time '09:30', (now()::date + 1) + time '10:15', 'pendiente', 'Mia — revisión anual'),
    (v_org_id, p4, t_dental,     v_vet_id, (now()::date + 1) + time '12:00', (now()::date + 1) + time '13:00', 'pendiente', 'Nala — limpieza dental'),
    -- HISTORIAL
    (v_org_id, p1, t_revision,    v_vet_id, now() - interval '7 days',  now() - interval '7 days'  + interval '45 min', 'completada', 'Luna — revisión anual completa'),
    (v_org_id, p2, t_consulta,    v_vet_id, now() - interval '14 days', now() - interval '14 days' + interval '30 min', 'completada', 'Buddy — cojera pata trasera'),
    (v_org_id, p3, t_dental,      v_vet_id, now() - interval '21 days', now() - interval '21 days' + interval '60 min', 'completada', 'Rex — limpieza dental'),
    (v_org_id, p1, t_consulta,    v_vet_id, now() - interval '30 days', now() - interval '30 days' + interval '30 min', 'cancelada',  'Toby — canceló cliente'),
    (v_org_id, p4, t_vacuna_poliv,v_vet_id, now() - interval '35 days', now() - interval '35 days' + interval '15 min', 'completada', 'Max — vacuna polivalente'),
    (v_org_id, p2, t_consulta,    v_vet_id, now() - interval '3 days',  now() - interval '3 days'  + interval '30 min', 'no_show',    'Pico — no se presentó')
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- VACUNACIONES
  -- ================================================================
  INSERT INTO vacunaciones_vet (organization_id, mascota_id, vacuna, fabricante, lote, fecha_aplicacion, fecha_proxima, veterinario_id)
  VALUES
    (v_org_id, m1, 'Antirrábica',            'Nobivac', 'NB2024-01', current_date - 300, current_date + 65,  v_vet_id),
    (v_org_id, m1, 'Polivalente (DHPPi+L)', 'Eurican', 'EU2024-05', current_date - 365, current_date,       v_vet_id),
    (v_org_id, m2, 'Trivalente felina',      'Purevax', 'PX2023-11', current_date - 180, current_date + 185, v_vet_id),
    (v_org_id, m3, 'Antirrábica',            'Nobivac', 'NB2024-03', current_date - 10,  current_date + 355, v_vet_id),
    (v_org_id, m3, 'Polivalente (DHPPi+L)', 'Eurican', 'EU2024-08', current_date - 10,  current_date + 355, v_vet_id),
    (v_org_id, m4, 'Trivalente felina',      'Purevax', 'PX2024-02', current_date - 90,  current_date + 275, v_vet_id),
    (v_org_id, m5, 'Polivalente (DHPPi+L)', 'Eurican', 'EU2023-12', current_date - 400, current_date - 35,  v_vet_id),
    (v_org_id, m6, 'Antirrábica',            'Nobivac', 'NB2023-09', current_date - 420, current_date - 55,  v_vet_id)
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- DESPARASITACIONES
  -- ================================================================
  INSERT INTO desparasitaciones_vet (organization_id, mascota_id, tipo, producto, fecha_aplicacion, fecha_proxima, veterinario_id)
  VALUES
    (v_org_id, m1, 'ambas',   'Advocate',  current_date - 90,  current_date + 2,  v_vet_id),
    (v_org_id, m2, 'interna', 'Milbemax',  current_date - 85,  current_date + 7,  v_vet_id),
    (v_org_id, m3, 'ambas',   'Advocate',  current_date - 28,  current_date + 62, v_vet_id),
    (v_org_id, m4, 'interna', 'Milbemax',  current_date - 100, current_date - 10, v_vet_id),
    (v_org_id, m5, 'externa', 'Frontline', current_date - 60,  current_date + 30, v_vet_id),
    (v_org_id, m6, 'ambas',   'Bravecto',  current_date - 15,  current_date + 75, v_vet_id)
  ON CONFLICT DO NOTHING;

  -- ================================================================
  -- FACTURAS
  -- ================================================================
  INSERT INTO invoices (organization_id, numero, fecha, cliente_nombre, subtotal, iva_total, total, estado, forma_pago)
  VALUES
    (v_org_id, 'A-2025-001', current_date - 45, 'María González Pérez',    28.93,  6.07,  35.00, 'pagada',   'tarjeta'),
    (v_org_id, 'A-2025-002', current_date - 35, 'Carlos Martínez López',   49.59, 10.41,  60.00, 'pagada',   'efectivo'),
    (v_org_id, 'A-2025-003', current_date - 20, 'Ana Rodríguez García',    99.17, 20.83, 120.00, 'pagada',   'tarjeta'),
    (v_org_id, 'A-2025-004', current_date - 10, 'Laura López Martínez',    28.93,  6.07,  35.00, 'emitida',  null),
    (v_org_id, 'A-2025-005', current_date - 5,  'Javier García Ruiz',       49.59, 10.41,  60.00, 'emitida',  null),
    (v_org_id, 'A-2025-006', current_date - 2,  'María González Pérez',    82.64, 17.36, 100.00, 'emitida',  null),
    (v_org_id, 'A-2025-007', current_date,      'Carlos Martínez López',   28.93,  6.07,  35.00, 'borrador', null)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Datos demo insertados para org: %', v_org_id;
  RAISE NOTICE '   — 10 tratamientos en catálogo';
  RAISE NOTICE '   — 6 clientes, 8 mascotas (perros, gatos, ave, conejo)';
  RAISE NOTICE '   — 10 citas (2 hoy, 2 mañana, 6 historial)';
  RAISE NOTICE '   — 8 vacunaciones (algunas vencidas, alertas activas)';
  RAISE NOTICE '   — 6 desparasitaciones (algunas vencidas)';
  RAISE NOTICE '   — 7 facturas (3 pagadas, 3 emitidas, 1 borrador)';
END $$;
