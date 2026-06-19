# Veteriblandenguer — Plan SaaS

**Sector:** Clínicas veterinarias  
**Propuesta:** Software de gestión all-in-one para clínicas veterinarias — agenda, ficha de mascota, historia clínica, facturación y recordatorios automáticos.  
**Partida:** Fork del proyecto SAAS CLINICA (ClinicFlow) — mismo stack, adaptado a veterinaria  
**Mercado:** España  
**Generado:** 2026-06-19 | Skill: `saas-factory`

---

## Marca

- **Nombre:** Veteriblandenguer
- **Color primario:** `#2E8B57` (verde veterinario — profesional, salud, naturaleza)
- **Color acento:** `#4CAF82`
- **Dominio:** `app.veteriblandenguer.com` · `veteriblandenguer.com`

---

## Diferencias clave vs. ClinicFlow (clínica humana)

| Concepto ClinicFlow | Concepto Veteriblandenguer |
|---------------------|---------------------------|
| Paciente (persona)  | Mascota (animal)          |
| —                   | Cliente = dueño de mascota (entidad propia) |
| Historia clínica    | Historia clínica veterinaria (vacunas, desparasitaciones, cirugías, alergias) |
| Cita                | Cita (igual, pero referenciada a mascota + dueño) |
| Factura             | Factura (a nombre del dueño, no de la mascota) |
| Recordatorio visita | Recordatorio vacuna / desparasitación / revisión anual |

---

## Entidades núcleo (BBDD)

| Tabla            | Descripción |
|------------------|-------------|
| `organizations`  | La clínica veterinaria (tenant raíz) |
| `profiles`       | Usuarios del sistema (propietario, recepcionista) |
| `clientes`       | Dueños de mascotas — contacto, dirección, NIF para facturas |
| `mascotas`       | El paciente real — nombre, especie, raza, fecha_nac, peso, color, nº chip, esterilizado |
| `citas`          | Agenda — fecha, hora, mascota, veterinario, motivo, estado |
| `historia_clinica` | Registros clínicos por mascota — notas, diagnóstico, tratamiento, archivos adjuntos |
| `vacunaciones`   | Vacunas administradas + próxima fecha (fuente de recordatorios) |
| `desparasitaciones` | Tratamientos antiparasitarios + próxima fecha |
| `servicios`      | Catálogo de servicios con precio (consulta, vacuna, cirugía, peluquería...) |
| `facturas`       | Cabecera de factura — a nombre del cliente/dueño |
| `lineas_factura` | Líneas de detalle de cada factura |
| `recordatorios`  | Cola de recordatorios pendientes de envío (email/WhatsApp) |

---

## Roles

| Rol            | Permisos |
|----------------|----------|
| `propietario`  | Acceso total — dashboard de negocio, configuración, facturación SaaS, usuarios |
| `recepcionista`| Agenda, clientes, mascotas, citas, recordatorios, facturas — NO configuración ni billing |

> Nota: En veterinaria hay un tercer rol natural (veterinario/clínico) para la historia clínica. Se deja como `propietario` en v1 si el dueño es también el veterinario. Se puede añadir en v2.

---

## Planes

| Plan      | Precio/mes | Usuarios | Funciones incluidas |
|-----------|-----------|----------|---------------------|
| **Básico**   | €29       | 2        | Agenda + Clientes/Mascotas + Citas + Recordatorios email |
| **Pro**      | €69       | 5        | Todo Básico + Historia clínica + Vacunaciones + Desparasitaciones + Facturación + Recordatorios WhatsApp |
| **Clínica**  | €129      | ilimitado | Todo Pro + Multi-veterinario + Informes avanzados + API pública + Soporte prioritario |

- **Trial:** 10 días gratuitos, sin tarjeta
- **Anual:** -20% (si se implementa en v2)

---

## Multi-tenant

- **Modelo:** org-por-login (mismo que ClinicFlow) — 1 clínica = 1 `organization`
- **Aislamiento:** RLS por `organization_id` en todas las tablas
- **Sin subdominios** en v1 — todo en `app.veteriblandenguer.com`

---

## Vertical

De momento **una sola vertical:** `veterinaria`

Presets para futuras verticales posibles: `exoticos` (reptiles, aves) · `equina` (caballos) · `zoo` — se deja la arquitectura de presets igual que ClinicFlow para poder escalar sin cambiar el core.

---

## Módulos

### Core (todos los planes)
- Agenda / calendario de citas
- Clientes (dueños de mascotas)
- Mascotas (fichas de pacientes)
- Recordatorios por email
- Dashboard básico (próximas citas del día)
- Configuración de la clínica (nombre, logo, horario)

### Pro
- Historia clínica completa por mascota
- Registro de vacunaciones + alertas de renovación
- Registro de desparasitaciones + alertas de renovación
- Facturación (facturas, líneas, PDF descargable)
- Recordatorios por WhatsApp (vía API)
- Buscador avanzado de mascotas / clientes

### Clínica (Business)
- Informes de negocio (ingresos, citas por mes, servicios más solicitados)
- API pública (para integraciones externas)
- Gestión de usuarios ilimitados
- Soporte prioritario

### Transversales SaaS (en todas las instancias)
- Super-admin panel (`/superadmin`) — gestión de tenants, MRR, impersonar
- Chatbot asistente IA — contexto de la clínica en tiempo real
- Módulo de afiliados (para escalar venta)
- Widget de reserva pública embebible (`/reservar/[slug]`)

---

## Módulos fuera de scope v1 (backlog)
- App móvil para dueños de mascotas (ver citas, historial, descargar facturas)
- TPV integrado (cobro en mostrador)
- Telemedicina / videoconsulta
- Tienda online de productos

---

## Stack (heredado de ClinicFlow — no cambiar)

```
Frontend:   Next.js 16 App Router · TypeScript strict · Tailwind v4 · shadcn/Radix UI
Backend:    Supabase (PostgreSQL + Auth + RLS + Storage)
Billing:    Stripe
Email:      Resend
IA:         OpenAI
Deploy:     Vercel + Supabase cloud
Paquetes:   pnpm · Vitest
```

---

## Estado de fases

- [x] F0 Intake — completado 2026-06-19
- [ ] F1 Auditoría/Scaffold — fork de SAAS CLINICA + adaptación de marca + typecheck limpio
- [ ] F2 Diseño + Theming — verde veterinario, preset `veterinaria`, features.ts adaptado
- [ ] F3 Multi-tenant + BBDD — tabla organizations + entidades vet + RLS completo
- [ ] F4 Auth + Onboarding — signup → onboarding clínica → dashboard
- [ ] F5 Stripe + Billing — 3 planes (Básico/Pro/Clínica) + 10d trial + webhook
- [ ] F6 Módulos producto — agenda, mascotas, historia clínica, vacunas, facturas, recordatorios
- [ ] F7 Landing + SEO — landing pública + pricing + blog
- [ ] F8 Cierre + Deploy — build verde + seed demo + checklist Vercel/Supabase/Stripe

---

## Pendiente del usuario (claves manuales — necesarias para arrancar)

```
# Supabase (crear proyecto nuevo en supabase.com)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (crear cuenta/productos en dashboard.stripe.com)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASICO=
STRIPE_PRICE_PRO=
STRIPE_PRICE_CLINICA=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (resend.com — verificar dominio)
RESEND_API_KEY=
EMAIL_FROM=noreply@veteriblandenguer.com

# OpenAI
OPENAI_API_KEY=
```

> Las claves de Stripe y Supabase las necesitas ANTES de F3/F4.  
> Puedes arrancar F1 y F2 sin ninguna clave.
