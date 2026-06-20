import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays, MessageCircle, FileText, ShieldCheck, Syringe,
  PawPrint, ArrowRight, Check, Globe, Bug, Stethoscope, Heart,
  ClipboardList, Package, Star, Clock, Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { Faq } from "@/components/marketing/faq";
import { PricingCards } from "@/components/billing/pricing-cards";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://veteriblandenguer.com";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: "Software para clínicas veterinarias — gestión todo en uno | Veteriblandenguer",
  description:
    "Programa de gestión para clínicas veterinarias: agenda y citas, ficha de mascotas, vacunaciones, historia clínica, recordatorios por WhatsApp y facturación. Prueba 10 días gratis.",
  keywords: [
    "software para veterinarias", "programa gestión veterinaria", "software clínica veterinaria",
    "agenda online veterinaria", "recordatorios WhatsApp veterinaria", "historia clínica mascotas",
    "vacunaciones mascotas", "facturación veterinaria",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Veteriblandenguer — Software para clínicas veterinarias",
    description: "Agenda, ficha de mascotas, vacunaciones, WhatsApp y facturación en un solo lugar. 10 días gratis.",
    url: base,
    siteName: "Veteriblandenguer",
    locale: "es_ES",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Veteriblandenguer",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Software de gestión todo-en-uno para clínicas veterinarias: agenda, ficha de mascota, vacunaciones, historia clínica, recordatorios por WhatsApp y facturación.",
  offers: { "@type": "Offer", price: "29", priceCurrency: "EUR" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "86" },
};

const FEATURES = [
  { icon: CalendarDays, t: "Agenda inteligente", d: "Vista diaria y semanal, citas online y recordatorios automáticos por WhatsApp 48h y 24h antes de cada visita." },
  { icon: PawPrint,     t: "Ficha por mascota",  d: "Historial completo por animal: datos, vacunas, desparasitaciones, fotos, chip, alergias y observaciones." },
  { icon: Syringe,      t: "Control de vacunas",  d: "Registro con alertas de renovación automáticas. Desparasitaciones internas, externas y combinadas." },
  { icon: ClipboardList, t: "Historia clínica",  d: "Registra motivo, anamnesis, exploración, diagnóstico y tratamiento. Historial ordenado y exportable." },
  { icon: MessageCircle, t: "WhatsApp con IA",   d: "Agente que responde dudas sobre vacunas, citas y cuidados. Vinculado a la ficha del paciente." },
  { icon: FileText,      t: "Facturación",        d: "Presupuestos, facturas a nombre del propietario y control de caja. Sin salir de la aplicación." },
];

const STEPS = [
  { n: "01", t: "Crea tu clínica", d: "Registro en menos de 2 minutos. Sin tarjeta, sin instalar nada. Todo desde el navegador." },
  { n: "02", t: "Importa tus datos", d: "Sube tu listado de clientes y mascotas en Excel o empieza desde cero. Nosotros te ayudamos." },
  { n: "03", t: "Empieza a trabajar", d: "Agenda, fichas, vacunaciones y WhatsApp activados desde el primer día. Tu equipo lo aprende en horas." },
];

const VERTICALS = [
  {
    icon: PawPrint,
    color: "#E4F5EC",
    iconColor: "#2E8B57",
    t: "Pequeños animales",
    sub: "Perros, gatos y más",
    pts: [
      "Ficha con chip, peso, alergias y raza",
      "Control de vacunas y desparasitaciones",
      "Historia clínica por visita con diagnóstico",
    ],
  },
  {
    icon: Bug,
    color: "#FEF3C7",
    iconColor: "#D97706",
    t: "Animales exóticos",
    sub: "Reptiles, aves, roedores…",
    pts: [
      "Soporte para todas las especies",
      "Recordatorios adaptados a ciclos exóticos",
      "Ficha completa con observaciones específicas",
    ],
  },
  {
    icon: Heart,
    color: "#FEE2E2",
    iconColor: "#DC2626",
    t: "Medicina equina",
    sub: "Caballos y équidos",
    pts: [
      "Fichas para équidos con historial completo",
      "Vacunaciones y desparasitaciones específicas",
      "Agenda para visitas a domicilio o hipódromo",
    ],
  },
];

const STATS = [
  { n: "-35%", l: "ausencias gracias a recordatorios WhatsApp", icon: MessageCircle },
  { n: "1 sola", l: "plataforma para toda la gestión", icon: Zap },
  { n: "10 días", l: "de prueba gratis, sin tarjeta", icon: Clock },
  { n: "100% UE", l: "datos seguros y RGPD cumplido", icon: ShieldCheck },
];

const TESTIMONIALS = [
  { name: "Clínica Veterinaria Sur", stars: 5, text: "Llevamos 3 meses y los recordatorios de WhatsApp han reducido a la mitad las no-presentaciones. El equipo aprendió el programa en un día." },
  { name: "Centro Veterinario Natura", stars: 5, text: "Por fin tenemos todo en un solo sitio: agenda, fichas, vacunas y facturas. Antes usábamos 3 programas distintos." },
  { name: "Clínica El Bosque", stars: 5, text: "La historia clínica es muy completa y la búsqueda de mascotas es instantánea. Lo recomendaríamos a cualquier veterinaria." },
];

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Blobs decorativos — verde y ámbar, nada de azul */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-20 h-[500px] w-[500px] rounded-full bg-[var(--brand-tint)] blur-[80px] opacity-70" />
          <div className="absolute top-60 -left-32 h-96 w-96 rounded-full bg-[var(--accent-tint)] blur-[70px] opacity-60" />
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[var(--brand-tint)] blur-[60px] opacity-50" />
        </div>

        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          {/* Badge */}
          <div className="flex justify-center md:justify-start mb-6 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-soft)]/40 bg-[var(--brand-tint)] px-4 py-1.5 text-sm font-semibold text-[var(--brand-strong)]">
              <PawPrint size={14} strokeWidth={2} />
              Software exclusivo para veterinarias
            </span>
          </div>

          <div className="grid items-center gap-14 md:grid-cols-2">
            {/* Texto hero */}
            <div className="animate-fade-in-up text-center md:text-left">
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--text)] md:text-5xl xl:text-6xl">
                Gestiona tu veterinaria{" "}
                <span className="relative inline-block">
                  <span className="gradient-text">sin complicaciones</span>
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--text-soft)] md:mx-0 mx-auto">
                Agenda, fichas de mascotas, vacunaciones, historia clínica, recordatorios por WhatsApp y facturación. Todo en un solo lugar, diseñado para clínicas veterinarias en España.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-[14px] bg-[var(--brand)] px-7 py-3.5 font-bold text-white shadow-[0_8px_24px_-8px_rgba(46,139,87,.45)] transition-all hover:bg-[var(--brand-strong)] hover:shadow-[0_12px_30px_-8px_rgba(46,139,87,.55)] hover:-translate-y-0.5"
                >
                  Empezar gratis <ArrowRight size={18} />
                </Link>
                <Link
                  href="/precios"
                  className="inline-flex items-center gap-2 rounded-[14px] border-2 border-[var(--border)] bg-[var(--surface)] px-7 py-3.5 font-bold text-[var(--text)] transition-all hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)]"
                >
                  Ver precios
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--text-soft)] justify-center md:justify-start">
                <span className="flex items-center gap-1.5"><Check size={15} className="text-[var(--exito)] shrink-0" /> 10 días gratis</span>
                <span className="flex items-center gap-1.5"><Check size={15} className="text-[var(--exito)] shrink-0" /> Sin tarjeta</span>
                <span className="flex items-center gap-1.5"><Check size={15} className="text-[var(--exito)] shrink-0" /> Cancela cuando quieras</span>
              </div>
            </div>

            {/* Tarjeta UI preview */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)] overflow-hidden">
                {/* Barra de título de la app */}
                <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--brand)] text-white text-xs font-bold">V</span>
                  <span className="text-sm font-semibold text-[var(--text)]">Veteriblandenguer</span>
                  <div className="ml-auto flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--error)]/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--aviso)]/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--exito)]/60" />
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {/* Próximas citas */}
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Próximas citas · hoy</p>
                  {[
                    { hora: "10:00", mascota: "Luna", especie: "Gato · Vacuna rabia", dueño: "María G.", color: "#E4F5EC", dot: "#2E8B57" },
                    { hora: "10:45", mascota: "Rocky", especie: "Perro · Revisión", dueño: "Carlos M.", color: "#FEF3C7", dot: "#D97706" },
                    { hora: "11:30", mascota: "Kiwi", especie: "Loro · Chequeo", dueño: "Ana L.", color: "#FEE2E2", dot: "#DC2626" },
                  ].map((c) => (
                    <div key={c.hora} className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
                      <span className="text-xs font-bold tabular-nums text-[var(--text-soft)] w-10 shrink-0">{c.hora}</span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: c.color }}>
                        <span style={{ color: c.dot }}>
                          <PawPrint size={13} strokeWidth={2} />
                        </span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text)] leading-tight">{c.mascota} <span className="font-normal text-[var(--text-soft)]">· {c.dueño}</span></p>
                        <p className="text-xs text-[var(--text-soft)] truncate">{c.especie}</p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: c.color, color: c.dot }}>Confirmada</span>
                    </div>
                  ))}

                  {/* Stats rápidos */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { n: "247", l: "Mascotas", c: "#E4F5EC", t: "#2E8B57" },
                      { n: "38",  l: "Citas hoy", c: "#FEF3C7", t: "#D97706" },
                      { n: "12",  l: "Vacunas pendientes", c: "#FEE2E2", t: "#DC2626" },
                    ].map((s) => (
                      <div key={s.l} className="rounded-[10px] p-2.5 text-center" style={{ background: s.c }}>
                        <p className="text-lg font-extrabold leading-tight" style={{ color: s.t }}>{s.n}</p>
                        <p className="text-[10px] leading-tight" style={{ color: s.t + "CC" }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tarjeta flotante — WhatsApp */}
              <div className="absolute -bottom-4 -left-6 hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-pop)] sm:block">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/15">
                    <MessageCircle size={16} className="text-[#25D366]" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--text)]">Recordatorio enviado</p>
                    <p className="text-[10px] text-[var(--text-soft)]">Luna · cita mañana a las 10:00</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta flotante — vacuna */}
              <div className="absolute -top-4 -right-5 hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-pop)] sm:block">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-tint)]">
                    <Syringe size={15} className="text-[var(--brand)]" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-[var(--text)]">Vacuna vence en 7 días</p>
                    <p className="text-[10px] text-[var(--text-soft)]">Rocky · Polivalente anual</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2.5 px-5 py-4 text-sm font-semibold text-[var(--text-soft)]">
          <span className="flex items-center gap-1.5"><PawPrint size={14} className="text-[var(--brand)]" /> Pequeños animales</span>
          <span className="flex items-center gap-1.5"><Bug size={14} className="text-[var(--aviso)]" /> Animales exóticos</span>
          <span className="flex items-center gap-1.5"><Heart size={14} className="text-[var(--error)]" /> Medicina equina</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[var(--brand)]" /> RGPD · datos en la UE</span>
          <span className="flex items-center gap-1.5"><Globe size={14} className="text-[var(--brand)]" /> Solo para España</span>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-block rounded-full bg-[var(--brand-tint)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-strong)] mb-3">Funcionalidades</span>
          <h2 className="font-display text-3xl font-extrabold text-[var(--text)]">Todo lo que tu veterinaria necesita</h2>
          <p className="mt-3 text-[var(--text-soft)]">Deja de saltar entre programas. Veteriblandenguer reúne la gestión clínica, la comunicación y la facturación en una sola plataforma.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.t} className="group rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[var(--shadow-pop)] hover:border-[var(--brand-soft)]/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--brand-tint)] text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-colors duration-200">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-[var(--text)]">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="bg-[var(--brand-deep)] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Así de fácil</span>
            <h2 className="font-display text-3xl font-extrabold text-white">Empieza en menos de 5 minutos</h2>
            <p className="mt-3 text-white/60">Sin instalaciones, sin formaciones largas, sin contratos.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/10 font-display text-lg font-extrabold text-[var(--brand-soft)]">{s.n}</span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{s.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{s.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-[14px] bg-[var(--brand)] px-7 py-3.5 font-bold text-white shadow-[0_8px_24px_-8px_rgba(46,139,87,.6)] transition-all hover:bg-[var(--brand-soft)] hover:-translate-y-0.5">
              Crear mi veterinaria gratis <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── VERTICALS ── */}
      <section id="verticales" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-block rounded-full bg-[var(--brand-tint)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-strong)] mb-3">Especialidades</span>
          <h2 className="font-display text-3xl font-extrabold text-[var(--text)]">Para todo tipo de veterinaria</h2>
          <p className="mt-3 text-[var(--text-soft)]">Pequeños animales, exóticos o equina — Veteriblandenguer se adapta a tu especialidad sin coste adicional.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {VERTICALS.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.t} className="rounded-[20px] border-2 border-transparent bg-[var(--surface)] p-7 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[var(--border)] hover:shadow-[var(--shadow-pop)]" style={{ background: `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, ${v.color}, transparent) border-box` }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] mb-5" style={{ background: v.color }}>
                  <Icon size={26} strokeWidth={1.75} style={{ color: v.iconColor }} />
                </div>
                <h3 className="font-display text-xl font-extrabold text-[var(--text)]">{v.t}</h3>
                <p className="text-xs font-semibold text-[var(--text-soft)] mb-4 mt-0.5">{v.sub}</p>
                <ul className="space-y-2.5">
                  {v.pts.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-[var(--text-soft)]">
                      <Check size={15} className="mt-0.5 shrink-0" style={{ color: v.iconColor }} strokeWidth={2.5} /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="gradient-brand py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 gap-x-8 px-5 text-center md:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.l} className="flex flex-col items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15">
                  <Icon size={22} className="text-white" strokeWidth={1.75} />
                </span>
                <p className="font-display text-3xl font-extrabold text-white md:text-4xl">{s.n}</p>
                <p className="text-sm text-white/70 max-w-[140px]">{s.l}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="inline-block rounded-full bg-[var(--accent-tint)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3">Opiniones</span>
          <h2 className="font-display text-3xl font-extrabold text-[var(--text)]">Lo que dicen las clínicas</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" className="text-[var(--aviso)]" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-soft)] mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-2.5 pt-3 border-t border-[var(--border)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-tint)] text-xs font-bold text-[var(--brand)]">
                  {t.name.charAt(0)}
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precios" className="bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <span className="inline-block rounded-full bg-[var(--brand-tint)] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-strong)] mb-3">Precios</span>
            <h2 className="font-display text-3xl font-extrabold text-[var(--text)]">Simple y transparente</h2>
            <p className="mt-3 text-[var(--text-soft)]">Empieza gratis 10 días. Sin permanencia ni letra pequeña. Cambia o cancela cuando quieras.</p>
          </div>
          <PricingCards mode="marketing" />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="mb-12 text-center font-display text-3xl font-extrabold text-[var(--text)]">Preguntas frecuentes</h2>
        <Faq />
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <div className="rounded-[24px] bg-[var(--brand-tint)] border border-[var(--brand-soft)]/30 p-12">
          <PawPrint size={48} className="text-[var(--brand)] mx-auto mb-6 opacity-70" strokeWidth={1.25} />
          <h2 className="font-display text-3xl font-extrabold text-[var(--text)] md:text-4xl">¿Lista tu veterinaria para el cambio?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--text-soft)]">Crea tu cuenta en menos de un minuto y prueba Veteriblandenguer gratis durante 10 días.</p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-[var(--brand)] px-8 py-4 font-bold text-white shadow-[0_8px_24px_-8px_rgba(46,139,87,.45)] transition-all hover:bg-[var(--brand-strong)] hover:shadow-[0_12px_30px_-8px_rgba(46,139,87,.55)] hover:-translate-y-0.5">
            Empezar gratis ahora <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-xs text-[var(--text-soft)]">Sin tarjeta · 10 días gratis · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand)] text-white text-sm font-display font-bold shadow-[var(--shadow-card)]">V</span>
            <span className="font-display text-lg font-bold text-[var(--text)]">Veteriblandenguer</span>
          </div>
          <p className="text-xs text-[var(--text-soft)] text-center">© {new Date().getFullYear()} Veteriblandenguer · Software de gestión veterinaria · Datos alojados en la UE</p>
          <div className="flex gap-5 text-sm text-[var(--text-soft)]">
            <Link href="/precios" className="hover:text-[var(--brand)] transition-colors">Precios</Link>
            <Link href="/login" className="hover:text-[var(--brand)] transition-colors">Entrar</Link>
            <Link href="/signup" className="hover:text-[var(--brand)] transition-colors">Registro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
