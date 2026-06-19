# ClinicFlow — Software para clínicas

SaaS multi-tenant de gestión para clínicas **estéticas, dentales, de fisioterapia, psicología, veterinarias y médicas en general**, desarrollado por **Flownexion**.

Cada clínica se registra, elige su especialidad y obtiene su espacio aislado con su propia identidad visual: pacientes e historia clínica, agenda, tratamientos recurrentes, informes dictados por voz con IA, consentimientos, CRM con pipeline editable, WhatsApp con agente IA propio, facturación, inventario, analítica y widget de reservas para su web.

## Stack

- **Frontend:** Next.js 16 (App Router) · TypeScript estricto · Tailwind CSS v4 · shadcn/ui tematizado
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime) — región UE · **RLS multi-tenant por `organization_id`**
- **Pagos del SaaS:** Stripe (suscripciones, trial 14 días, portal de cliente)
- **Emails:** Resend (transaccionales de marca)
- **IA:** Google Gemini (dictado de informes, asistente integrado, agente WhatsApp)
- **Mensajería:** WhatsApp Cloud API (Meta) — credenciales por clínica
- **Deploy:** Vercel + Supabase Cloud

## Módulos

| Módulo | Qué hace |
|---|---|
| Pacientes + historia clínica | Ficha completa, informes por voz (revisables antes de guardar), fotos, consentimientos, recordatorios WhatsApp por paciente |
| Agenda | Citas por sala/profesional, estados, reservas online |
| CRM | Pipeline nativo: etapas con orden/nombre/color editables, tarjetas con drag & drop, convertir lead en paciente |
| WhatsApp | Conexión del número de cada clínica + agente IA configurable (tono, funciones, instrucciones) + bandeja en tiempo real |
| Facturación | Estilo Holded: borrador/emitir, vencimientos, descuento e IVA por línea, 3 plantillas de documento con la marca de la clínica, preparado para Verifacti (Verifactu/TicketBAI) |
| Inventario | Stock con alertas, movimientos, vista tabla/tarjetas |
| Analítica | Facturación por mes, pendiente/vencido, citas por estado, top tratamientos, pacientes nuevos |
| Apariencia | Temas por especialidad + colores personalizados + logo por clínica |
| API | API keys con scopes + API pública documentada (OpenAPI) |
| Widget de reservas | Script embebible en la web de cada clínica |

## Setup local

### Prerequisitos
- Node.js ≥ 20 · pnpm ≥ 9

### 1. Instalar
```bash
git clone https://github.com/Flownexion/saas-clinic.git
cd saas-clinic
pnpm install
```

### 2. Variables de entorno
```bash
cp .env.example .env.local
```
Rellena al menos Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). El resto de integraciones funcionan en modo `mock` sin claves.

### 3. Base de datos
Aplica las migraciones de `supabase/migrations/` en orden (Supabase CLI `supabase db push`, o el editor SQL del dashboard).

### 4. Arrancar
```bash
npm run dev          # http://localhost:3000
```

### Datos de demostración (opcional)
```bash
node scripts/seed-demo.mjs    # crea la clínica demo (demo@clinicflow.app / ClinicFlow2026!)
node scripts/seed-demo2.mjs   # facturas, CRM, citas, WhatsApp de ejemplo
node scripts/verify-flow.mjs  # test e2e del aislamiento multi-tenant
```

## Comandos
```bash
npm run dev          # desarrollo
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
npm run test         # vitest
```

## Documentación del repo
- [`DESPLIEGUE.md`](DESPLIEGUE.md) — guía de despliegue completa (Vercel, Supabase, Stripe, Resend, WhatsApp/Meta)
- [`SAAS-PLAN.md`](SAAS-PLAN.md) — plan del producto y estado de cada fase
- [`docs/seo/keyword-map.md`](docs/seo/keyword-map.md) — estudio SEO (Ubersuggest, España)

## Seguridad y RGPD
La plataforma trata **datos de salud (Art. 9 RGPD)**: RLS activa en todas las tablas con aislamiento por clínica, almacenamiento privado con URLs firmadas para fotos y documentos, el audio de los dictados se transcribe y se descarta, y los secretos nunca se versionan (ver `.gitignore`).

---

© Flownexion — Flow Automate Solutions S.L.
