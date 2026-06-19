# Roadmap — Veteriblandenguer

> Registro vivo de lo pendiente. Marca cada bloque al completarlo.
> Estado del producto: build verde, multi-tenant, módulos clínicos + gestión + IA + voz + Verifactu/TicketBAI (a falta de clave maestra `vfn_`).

---

## ✅ Hecho en esta iteración (2026-06-15)
- **NIF doble confirmación** al activar Verifactu/TicketBAI (se introduce 2 veces y debe coincidir con el NIF fiscal).
- **Texto "Cómo funciona"** reescrito: ya no menciona a Verifacti ni a ningún proveedor externo (lo enviamos "nosotros").
- **Bloque 2 — Reorganización del menú en SECCIONES** (Clínica/Comunicación/Finanzas/Gestión/Análisis) en sidebar y hoja "Más" móvil. `nav-items.ts` con campo `seccion` + `navItemsBySeccion()`.
- **Bloque 3 — Bonos con plantillas predeterminadas** por organización (tabla `bono_tipos`, gestión en /bonos, desplegable que autorrellena al crear un bono, manteniendo el bono personalizado). Probado E2E.
- **Fix subida de fotos**: el `onChange` del input estaba vacío → ahora sube a Storage `patient-photos` ({orgId}/{patientId}/...), inserta en patient_photos y muestra las imágenes con URLs firmadas + lightbox + borrado.
- **Fix tratamientos**: `registrarVisita` ahora CREA el patient_treatment si no existe (antes solo actualizaba) → el tratamiento aparece en la pestaña del paciente; cada tratamiento distinto es una entrada activa propia.
- **Menú**: Recetas/Tratamientos/Mutuas/Proveedores marcados `secundario` → no en el menú principal; van en un desplegable "Más opciones" (sidebar) y en la hoja "Más" (móvil).
- **Pestañas de ficha en móvil**: desplegable (`<select>`) en vez de barra con scroll.
- **Bonos en la ficha del paciente**: pestaña "Bonos" (alta con plantilla + estado de sus bonos), gated por feature `bonos`.

## ⚖️ Investigación legal de consentimientos (HECHA — usar en el módulo)
Workflow `investigar-consentimientos` completado: 7 especialidades (estética, dental, fisio, psicología, veterinaria, general, RGPD+imágenes) con marco_legal (Ley 41/2002, RGPD/LOPDGDD, sectorial), elementos_obligatorios, PLANTILLA con variables {{org_nombre}}, {{paciente_nombre}}, {{tratamiento}}, etc., lista de variables y disclaimer. Salida en `%TEMP%\claude\...\tasks\wydjk49w6.output` (~91KB). Al construir el módulo: bakear estas plantillas en `src/lib/consentimientos/plantillas.ts`.

## 🆕 Requisitos nuevos (este mensaje)
- ✅ **Módulo de Consentimientos (HECHO)**: `/configuracion/consentimientos`. Biblioteca de 7 plantillas legales (investigación bakeada en `src/lib/consentimientos/plantillas.ts`), categorizadas y **recomendadas según la especialidad/vertical** de la clínica; "Añadir" copia a las plantillas de la org. Editor rich-text propio (`components/ui/rich-text-editor.tsx`) con inserción de variables {{...}}. Subida de Word/PDF a Storage (org-assets) como plantilla. Acciones en `actions/consentimientos.ts`. Tile en hub de Configuración. Migración `consent_templates`: +especialidad/+archivo_path/+tipo. PROBADO E2E (añadida plantilla dental con 26 variables).
- ✅ **Documentos factura/presupuesto EDITABLES (HECHO)**: A4 real (min-h 1123px / max-w 794px), 3 diseños (moderna/clásica/minimal), **color corporativo + pie de página configurables** en Datos fiscales (`billing_settings.color_documento`/`pie_documento`). Presupuestos ahora tienen documento imprimible propio (`/presupuestos/[id]`). 
- ✅ **Calendarios modernos (HECHO)**: datepicker propio `components/ui/date-picker.tsx` (rejilla mensual, nav mes/año, "Hoy", selección de mes, min/max, clearable) aplicado en agenda, tratamientos (última sesión), biometría, visitas, facturas, presupuestos, inventario, bonos y alta de paciente. Verificado E2E.
- ⏳ **Consentimiento del paciente desde plantilla**: en la ficha (tab Consentimientos), generar un consent rellenando variables a partir de una plantilla + firma/PDF. (Mejora futura del flujo paciente.)
- (Hecho previo) Asignar tratamiento desde registrar-visita ya crea el patient_treatment.

---

## 0. Blog CMS + IA + Calendario editorial  ✅ HECHO (2026-06-16)
CMS de blog en el panel superadmin (estilo BuildNexion), con generación automática vía Gemini y calendario editorial. Verificado E2E (artículo generado con `gemini-2.5-flash` live y publicado).
- **BBDD** (`gfhavjcadkjuyyywnxsf`): `blog_categories` + `blog_posts` (status draft/scheduled/published/archived/generation_failed, SEO meta/keywords, `ai_brief` jsonb, `scheduled_at`/`published_at`, tags[]). Bucket público `blog-images`. RLS: público lee `published`; superadmin todo (función `is_platform_superadmin()`); writes con service role. Seed de 6 categorías.
- **IA (Gemini)**: `geminiAdapter.generarArticuloBlog()` (mock/live). Modelo **gemini-2.5-flash** con `responseMimeType:json`, `thinkingConfig.thinkingBudget:0` (clave: el modelo *thinking* truncaba el JSON), `maxOutputTokens:16384`, reintentos con backoff ante 503/429/500. Parse robusto (quita fences). Lógica compartida en `lib/blog/generar.ts` (sin guard) usada por la acción y el cron.
- **Acciones** `actions/blog.ts`: crear/actualizar/cambiarEstado/eliminar, `generarConIA`, `importarCalendario` (CSV), `subirImagenBlog`. Guard superadmin + service role.
- **UI superadmin** `/superadmin/blog`: listado con filtros + acciones (generar IA, publicar, ver, eliminar); `/nuevo` y `/[id]` editor (RichTextEditor reutilizado + SEO + brief IA + imagen + estado/programación; key=updated_at para remontar tras generar); `/calendario` (cola editorial + importar CSV con plantilla descargable + alta rápida). Nav superadmin con "Blog".
- **Blog público**: `/blog` (índice con filtro por categoría, ISR 300s) + `/blog/[slug]` (artículo con `generateMetadata` OpenGraph/Twitter + JSON-LD BlogPosting + CTA). "Blog" en nav marketing. Posts en `sitemap.ts`.
- **Automatización**: cron `/api/cron/blog-publish` (guard `CRON_SECRET`, lock optimista, genera+publica programados vencidos) + `vercel.json` (cada 5 min). `CRON_SECRET` en `.env.local`.
- **Clave Gemini**: la del `.env.local` (`AQ.…`) SÍ funciona como `?key=` con `gemini-2.5-flash` (NO con `gemini-2.5-pro`: 429 free tier). GEMINI_MODE=live.
- **Novedades**: NO se hizo (el usuario lo pidió expresamente).

## 1. Superadmin + Afiliados  ✅ HECHO
Rol de plataforma separado del de clínica (referencia BuildNexion). Verificado E2E.
- **Gating:** `profiles.is_superadmin boolean` + helpers `lib/auth/superadmin.ts` (`requireSuperadmin`/`isCurrentUserSuperadmin`). `app/superadmin/layout.tsx` redirige si no lo es. Usa `createServiceClient()` (service role) para consultar TODAS las orgs saltando RLS.
- **Rutas creadas:**
  - `/superadmin` — métricas (MRR estimado vía `lib/plans.planPriceMonth`, nº orgs/usuarios, en prueba, altas 6 meses, distribución por plan/especialidad, resumen de afiliados, últimas altas). Tema oscuro propio (`_components/superadmin-shell.tsx` + `_components/ui.tsx`).
  - `/superadmin/organizations` + `/[id]` — tabla con búsqueda/filtros + detalle (suscripción, usuarios, contadores, acciones: cambiar plan/estado/máx. usuarios).
  - `/superadmin/usuarios` — todos los usuarios (email vía `auth.admin.listUsers`), promover/retirar superadmin.
  - `/superadmin/afiliados` — admin de afiliados: estado, % comisión, validar/cancelar referidos, liquidar comisiones, marcar payouts pagados.
- **Afiliados (autoservicio):** `/afiliados` (bajo `(app)`): alta (`afiliado-registro`) o panel (`afiliado-panel`: enlace `?ref=CODIGO`, KPIs, referidos, liquidaciones, datos de cobro). Acciones en `actions/afiliados.ts`.
- **Migración aplicada** (proyecto `gfhavjcadkjuyyywnxsf`): `is_superadmin`; tablas `affiliates`, `referrals`, `affiliate_payouts`; `organizations.referral_code`; RLS (afiliado ve lo suyo, superadmin via service role). Acciones server en `actions/superadmin.ts`. Demo (`demo@clinicflow.app`) marcado superadmin para pruebas.
- **Pendiente futuro:** atribución automática del referido al alta vía `?ref=` (signup → crear `referrals`); `/superadmin/soporte`, blog/novedades (CMS); panel de NIFs.

## 2. Reorganización de módulos en SECCIONES  ✅ HECHO
Hoy el menú tiene ~16 entradas planas y dispersas. Agrupar en secciones lógicas con encabezados (y mover a Configuración lo que sea ajuste):
- **Clínica:** Dashboard, Pacientes, Agenda, CRM, Recetas.
- **Comunicación:** WhatsApp, Agente de voz.
- **Finanzas:** Presupuestos, Facturación, Bonos, Caja, Cuotas.
- **Catálogos/Gestión:** Tratamientos, Inventario, Mutuas, Proveedores.
- **Análisis:** Analítica.
- **Configuración** (hub): Funciones, Apariencia, Verifactu/TicketBAI, WhatsApp, Voz, Equipo, API, Suscripción, Widget, Importar.
- Sidebar con grupos colapsables + encabezados de sección. Revisar qué entradas tienen más sentido dentro del hub de Configuración vs. en el menú principal. Mantener `nav-items.ts` como fuente única (añadir campo `seccion`).

## 3. Bonos: tipos/plantillas predeterminados por organización  ✅ HECHO
- Nueva tabla `bono_tipos` (organization_id, nombre, sesiones, precio, treatment_id?, caducidad_meses?, activo). RLS org.
- Página/Sección para crear y gestionar **plantillas de bono** (p. ej. "10 sesiones láser — 400€").
- Al crear un bono (desde `/bonos` o desde la ficha del paciente): **desplegable** para elegir una plantilla → autorrellena sesiones/precio/tratamiento. Mantener también la opción de **bono personalizado** (manual) como ahora.
- Acción `crearBonoTipo`, `eliminarBonoTipo`; `crearBono` acepta `bono_tipo_id` opcional.

## 4. Facturación tipo Holded: aprobación + modificación + TicketBAI  ✅ HECHO
> Modal de aprobación con previsualización antes de registrar (no auto-QR), botón "Rectificar" que crea rectificativa borrador (`rectificarFactura`), `enviarVerifactu` maneja R1 + `facturas_rectificadas` + `importe_rectificativa`. Migración `invoices.tipo`/`rectifica_id`. Resto del detalle histórico abajo.
- **Flujo de aprobación:** al generar factura queda en `borrador`/`pendiente`. **NO** se envía a Verifactu/TicketBAI ni se genera QR automáticamente. Al pulsar **"Aprobar"** → **modal de confirmación** (estilo Holded) que muestra una **previsualización** de lo que se registrará ("a continuación…") y un botón **"Confirmar y registrar"**. Solo entonces se llama a `enviarVerifactu` y se genera el QR.
- **Modificación de facturas:** permitir editar facturas y manejar correctamente la **rectificación** en Verifactu/TicketBAI (facturas rectificativas R1–R5, `rectificativa`/`rectificadas_sustituidas`), vinculando la original como hacen los grandes (Holded). Una factura ya registrada no se edita: se emite **rectificativa**.
- Estados claros: borrador → emitida (pendiente de registro) → registrada (con QR) → pagada / anulada / rectificada.

## 5. Documentos profesionales A4 (facturas + presupuestos)  ✅ HECHO
> A4 real (min-h 1123px), 3 plantillas, color + pie configurables (Datos fiscales), presupuesto imprimible propio (`/presupuestos/[id]`), QR Verifactu en el documento cuando existe. Detalle de referencia abajo.
- Referencia de diseño: `Downloads/F260145 ARTIHOME SL -Artikane.pdf` (Flownexion): borde superior de color, título grande, logo arriba-dcha, bloques Emisor/Cliente, tabla de conceptos, caja de totales (Base/IVA/Total), Observaciones (con hueco del QR TicketBAI), ref. de presupuesto, condiciones de pago, pie con nº/total/vencimiento + "Pág. X de Y".
- **Formato DIN-A4 real** (proporción 210×297, `@page` A4) tanto en pantalla (previsualización) como al imprimir/PDF.
- **Varios diseños a elegir** (ya hay moderna/clásica/minimal; mejorarlos y que se vean A4). Aplicar el mismo motor a **presupuestos** (ahora no tienen documento imprimible propio).
- Mostrar el QR de Verifactu/TicketBAI en el bloque de Observaciones cuando exista.

## 6. Pendientes técnicos / a confirmar
- **Clave maestra `vfn_`** de Verifacti (`VERIFACTI_NIFS_API_KEY`) — la da el usuario al activar suscripción. Sin ella, alta de NIF en modo real falla (mensaje correcto).
- **`VERIFACTI_ENTORNO`** — confirmar valor real (`sandbox`/`produccion` vs `test`/`prod`) al tener la `vfn_`.
- **Payload exacto TicketBAI** — validar `lineas`/`desglose_iva`/`tipo_operacion` contra un NIF vasco real (no se pudo probar con la test key, que es de Verifactu).
- **Zona horaria multi-región** — hecho; revisar DST en producción.
- **Dark mode** — sugerido por auditoría; requiere revisar colores claros fijados en documentos imprimibles (riesgo). Pendiente como tarea dedicada.
- **Panel de NIFs (superadmin):** UI para listar/activar/desactivar/eliminar NIFs (el adaptador ya tiene todas las acciones; falta la pantalla).

## 7. MARCA (bloqueado hasta tener nombre)
- El usuario aún no tiene nombre del SaaS. Cuando lo dé → **rebrand COMPLETO**: sustituir TODAS las referencias a "ESSE Clinic" **y** "ClinicFlow" por el nombre nuevo (títulos, metadatos, saludo del asistente, API pública, emails, logo). **NO tocar marca hasta entonces.**
