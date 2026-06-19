# Guía de despliegue — Veteriblandenguer

SaaS multi-tenant para clínicas veterinarias. Stack: Next.js 16
(App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + Storage +
RLS) · Stripe · Resend · Vercel · Gemini/OpenAI.

> **Estado:** build de producción verde (35 rutas). Multi-tenant + RLS verificado
> contra BBDD live. La app funciona en local con los servicios en modo `mock`; las
> claves reales (Stripe, Resend, LLM, WhatsApp/GHL) las conectas tú.

---

## 1. Desarrollo local

```bash
cd clinicflow
pnpm install            # (o npm install)
npm run dev             # http://localhost:3000
```

Variables en `.env.local` (ver `.env.example`). Supabase URL + anon + **service_role**
ya están puestas (proyecto ClinicFlow). El resto puede quedar vacío para desarrollo
(los adaptadores van en `mock`).

**Clínica DEMO sembrada:** `demo@clinicflow.app` / `ClinicFlow2026!`
(`node scripts/seed-demo.mjs` para regenerar; `node scripts/verify-flow.mjs` valida
el aislamiento multi-tenant end-to-end).

---

## 2. Supabase (proyecto ClinicFlow `gfhavjcadkjuyyywnxsf`, eu-west-1)

Migraciones ya aplicadas (`supabase/migrations/20240001..20240008`). Si recreas el
proyecto: `supabase db push` o aplica los `.sql` en orden.

**Configura en el panel de Supabase → Authentication:**
- **URL Configuration → Site URL:** tu dominio de la app (p. ej. `https://app.clinicflow.app`; en local `http://localhost:3000`).
- **Redirect URLs:** añade `http://localhost:3000/auth/callback` y `https://app.clinicflow.app/auth/callback`.
- **(Opcional, recomendado) Email templates / SMTP:** conecta Resend como SMTP y
  pega plantillas de marca para confirmación/invitación (ver `docs/seo` y `src/lib/email.ts` para el estilo).
- Para pruebas rápidas puedes desactivar “Confirm email” (Authentication → Providers → Email).

---

## 3. Stripe (suscripción al SaaS)

1. Crea 3 **productos/precios** recurrentes mensuales (modo **test** primero): Starter, Pro, Clínica.
2. Copia los `price_id` a `.env.local`: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_CLINICA`.
3. `STRIPE_SECRET_KEY` = tu clave secreta de test.
4. **Webhook:** crea un endpoint `https://<tu-dominio>/api/webhooks/stripe` escuchando
   `checkout.session.completed`, `customer.subscription.*`. Copia el signing secret a `STRIPE_WEBHOOK_SECRET`.
5. Prueba con la tarjeta `4242 4242 4242 4242`.

> El alta de cada clínica empieza en **trial de 14 días** automáticamente (sin Stripe).
> Stripe solo se necesita cuando una clínica elige plan en `/configuracion/suscripcion`.

---

## 4. Resend (emails de marca)

- Verifica tu **dominio remitente** en Resend.
- `RESEND_API_KEY` y `EMAIL_FROM="ClinicFlow <no-reply@tudominio.com>"` en `.env.local`.
- Sin clave, los emails se omiten de forma no-fatal (no rompen el flujo).

---

## 5. IA (asistente, agente WhatsApp, dictado)

- `GEMINI_MODE=live` + `GEMINI_API_KEY` (o usa `OPENAI_API_KEY`).
- Sin clave, el asistente y el agente responden en modo `mock` (respuestas de ejemplo).

---

## 6. Integraciones por clínica (opcionales)

Se configuran **por clínica** en la tabla `org_integrations` (UI de integraciones,
pendiente de pantalla dedicada; los webhooks ya enrutan por `external_id`):
- **WhatsApp Cloud API (Meta):** guarda el `phone_number_id` de cada clínica como
  `external_id` (tipo `whatsapp`). Webhook entrante: `/api/webhooks/whatsapp`.
- **GoHighLevel:** `location_id` como `external_id` (tipo `ghl`). Webhook: `/api/webhooks/ghl`.
- **Verifacti** (Verifactu + TicketBAI) para homologar la facturación: tipo `verifacti`
  (integración pendiente de implementar contra su API: https://www.verifacti.com/docs).

---

## 7. Despliegue en Vercel

1. Importa el repo `clinicflow/` en Vercel.
2. Variables de entorno = las de `.env.example` con valores de producción.
   **Importante:** `NEXT_PUBLIC_APP_URL=https://<tu-dominio>` (afecta a SEO, emails, widget y callbacks).
3. Deploy. Apunta tu dominio (`app.clinicflow.app` para la app; la landing vive en `/`).
4. Reconfigura el **Site URL / Redirect URLs** de Supabase y el **webhook de Stripe** con el dominio real.

---

## 8. Widget de reservas (para la web de cada clínica)

Cada clínica obtiene su snippet en **Configuración → Widget de reservas**:
```html
<script src="https://<tu-dominio>/widget.js" data-clinic="<slug-de-la-clinica>"></script>
```
Incrusta un iframe a `/reservar/<slug>`; las solicitudes entran como citas “pendiente”.

---

## 9. Checklist de configuración manual (solo el humano)

- [ ] Supabase: Site URL + Redirect URLs + (opcional) SMTP Resend + plantillas Auth.
- [ ] Stripe: 3 productos/precios (test) → `STRIPE_PRICE_*` + webhook + signing secret.
- [ ] Resend: dominio verificado + `RESEND_API_KEY` + `EMAIL_FROM`.
- [ ] LLM: `GEMINI_API_KEY` (o `OPENAI_API_KEY`) + `GEMINI_MODE=live`.
- [ ] Vercel: variables de entorno + `NEXT_PUBLIC_APP_URL` de producción.
- [ ] Por clínica (cuando proceda): WhatsApp `phone_number_id`, GHL `location_id`, Verifacti.
- [ ] Dominios/DNS: `app.<dominio>` (app) y `<dominio>` (landing).

---

## Comandos útiles
```bash
npm run dev            # desarrollo
npm run build          # build de producción
node_modules\.bin\tsc --noEmit   # typecheck
node scripts/seed-demo.mjs       # clínica demo con datos
node scripts/verify-flow.mjs     # test e2e de aislamiento multi-tenant
```
