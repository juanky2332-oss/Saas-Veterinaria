# Decisiones de arquitectura — Veteriblandenguer

| Ref | Decisión | Razón |
|-----|----------|-------|
| D01 | RLS por `organization_id` en TODAS las tablas | Multi-tenant: aislamiento absoluto de datos entre clínicas |
| D02 | `SECURITY DEFINER` para `get_user_org_id()` | Evita recursión infinita de RLS al leer `profiles` |
| D03 | Dos entidades separadas: `clientes` y `mascotas` | La factura va al dueño (NIF, dirección), la historia clínica va a la mascota |
| D04 | `organization_id` siempre inyectado desde el Server Action | Nunca confiar en org_id que venga del cliente/formulario |
| D05 | Theming 100% en CSS custom properties | Un solo CSS; re-tematización por tenant sin código condicional de color |
| D06 | Stripe SaaS billing ≠ facturación interna de la clínica | Son dos sistemas separados |
| D07 | Vertical hardcoded a `veterinaria` en v1 | No hay multi-vertical; la arquitectura lo soporta pero el onboarding no lo expone |
| D08 | Trial de 10 días sin tarjeta | Más corto que ClinicFlow (14d) para mayor urgencia de conversión |
| D09 | `mascotas` referencia a `clientes` con ON DELETE SET NULL | Si se borra el dueño, la mascota y su historial se conservan |
| D10 | `vacunaciones_vet.fecha_proxima` indexada | Fuente de recordatorios; se consulta por rango de fechas frecuentemente |

---

## D01 · Supabase Cloud en lugar de local durante desarrollo

**Decisión:** Se usa Supabase Cloud (proyecto `qhbyfciucjkhdmhreier`, región `eu-west-2`) en lugar de `supabase start` local.

**Razón:** Docker Desktop no estaba instalado en la máquina de desarrollo. Docker es un prerequisito para `supabase start`.

**Impacto:** Las migraciones SQL en `supabase/migrations/` son idénticas a las aplicadas en cloud. Para desarrollo 100% local instalar Docker Desktop y correr `supabase start` + `supabase db push`.

**Pendiente:** Instalar Docker Desktop y verificar `supabase db reset` + seeds en local antes de demo final con el cliente.

---

## D02 · Adaptadores mock para todas las integraciones externas

**Decisión:** Cada integración externa (WhatsApp, GHL, Holded, Gemini) tiene un adaptador mock realista controlado por variable de entorno (`WHATSAPP_MODE=mock|live`, etc.).

**Razón:** En el momento del desarrollo no hay credenciales de producción disponibles. Los mocks simulan comportamiento realista para que la app sea completamente funcional en demo.

**Cómo activar en producción:** Cambiar la variable de entorno correspondiente a `live` y añadir las credenciales reales. Ver `.env.example`.

---

## D03 · `@supabase/supabase-js` directo para service client con casts `as any`

**Decisión:** El cliente de servicio (service role) usa `@supabase/supabase-js` directamente con casts `as any` en los route handlers de webhooks y API pública.

**Razón:** En el contexto de TypeScript estricto con Next.js 15, la inferencia de tipos de `@supabase/supabase-js` con genérico `Database` resuelve a `never` en ciertas rutas de inferencia con el service role client. El `@supabase/ssr` (usado en el client normal con cookies) sí funciona correctamente.

**Alternativa considerada:** Esperar a regenerar tipos con `supabase gen types typescript --project-id` con la service key — los tipos generados oficialmente deberían resolver este problema. Se documenta en PENDIENTES.

---

## D04 · Regla `react-compiler/react-compiler` desactivada en ESLint

**Decisión:** Se desactiva la regla `react-compiler/react-compiler` en `eslint.config.mjs`.

**Razón:** Next.js 16 incluye el plugin del React Compiler experimental. Al no usar el compilador en este proyecto, sus reglas generan falsos positivos en código perfectamente válido (e.g. `Date.now()` fuera de render).

**Sin riesgo:** El código es correcto. Solo se desactiva la validación del compilador experimental.

---

## D05 · Widget de reservas (M10) con Preact/vanilla pendiente de bundle separado

**Decisión:** El widget de reservas (`/widget.js`) está diseñado en la arquitectura pero el bundle independiente queda pendiente de implementación final.

**Razón:** El widget requiere un bundler independiente (Rollup/esbuild) configurado aparte. La API pública que consume ya está implementada. El trabajo estimado es ~4h adicionales.

**Próximos pasos:** Crear `widget/` con Preact + esbuild, servir el bundle desde `/public/widget.js`.

---

## D06 · Importador Excel (M10) pendiente de implementación completa

**Decisión:** El importador de Excel (Clinic Cloud) tiene la página y la arquitectura definida pero el procesamiento de filas queda pendiente.

**Razón:** Requiere librería de parsing Excel (`xlsx` o `exceljs`) y lógica de mapeo de columnas específica de los exports de Clinic Cloud. El cliente debe proveer un export de ejemplo.

**Pendiente:** Obtener export real de Clinic Cloud del cliente + implementar mapeador.

---

## D07 · RLS tipo `recepcion` no lee `clinical_reports`

**Decisión:** Las usuarias con rol `recepcion` no pueden leer informes clínicos (`clinical_reports`). Solo `admin` y `doctora`.

**Razón:** Docs 01 y 05: "Recepción no lee notas clínicas sensibles si se marca privacidad". Se implementa a nivel RLS como regla absoluta.

---

## D08 · Audio de dictados nunca persiste

**Decisión:** El audio grabado en M3 (dictado por voz) se envía directamente como base64 al endpoint y no se almacena en Supabase Storage. Se transcribe en memoria y se descarta.

**Razón:** Docs 05 regla 7: "El audio de dictados se transcribe y se borra". No existe el bucket `audio-dictados` creado permanentemente.

---

## PENDIENTES — requieren validación del cliente o credenciales

| Ref | Descripción | Requiere |
|-----|-------------|---------|
| P01 | Verificar número de WhatsApp de la clínica — ¿está libre de BSPs anteriores? | Cliente (ESSE Clinic) |
| P02 | Credenciales WhatsApp Cloud API (Token, Phone Number ID, App Secret) | Meta Business |
| P03 | API Key de GoHighLevel (subcuenta del cliente) — coordinar con agencia de marketing | Agencia |
| P04 | API Key de Holded del cliente | ESSE Clinic |
| P05 | API Key de Gemini | Google Cloud |
| P06 | Contrato de encargado del tratamiento Flownexion–ESSE Clinic | Legal |
| P07 | Confirmación plazo retención historia clínica (Región de Murcia) | Asesoría jurídica |
| P08 | Textos legales del widget de reservas (privacidad + checkbox) | Legal |
| P09 | SVG del logotipo "S" de ESSE Clinic en dorado | Cliente |
| P10 | Export de Clinic Cloud para testear importador M10 | Cliente |
| P11 | Docker Desktop en máquina de desarrollo para `supabase start` local | DevOps |
| P12 | Service role key de Supabase Cloud para generar tipos tipados y reducir casts `as any` | Supabase MCP |
