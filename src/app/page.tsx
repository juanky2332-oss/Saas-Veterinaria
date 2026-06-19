import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays, MessageCircle, FileText, ShieldCheck, Sparkles, Receipt,
  Stethoscope, HeartPulse, ArrowRight, Check, Globe,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { Faq } from "@/components/marketing/faq";
import { SmartImg } from "@/components/marketing/smart-img";
import { PricingCards } from "@/components/billing/pricing-cards";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://clinicomatic.app";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  // Keyword principal (Ubersuggest ES): "software para clínicas" · 110/mes · SD 26 · CPC ~13$
  title: "Software para clínicas — gestión todo en uno | Clinicomatic",
  description:
    "Programa de gestión para clínicas médicas, dentales y estéticas: agenda y citas, recordatorios por WhatsApp, historia clínica digital, facturación y CRM. Prueba 14 días gratis.",
  keywords: [
    "software para clínicas", "programa gestión clínica", "programa para clínicas médicas",
    "software clínica dental", "software clínica estética", "agenda online clínica",
    "recordatorios WhatsApp", "historia clínica digital", "facturación clínica", "CRM clínicas",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Clinicomatic — Software para clínicas",
    description: "Agenda, WhatsApp con IA, historia clínica, facturación y CRM en un solo lugar. 14 días gratis.",
    url: base,
    siteName: "Clinicomatic",
    locale: "es_ES",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Clinicomatic",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Software de gestión todo-en-uno para clínicas dentales, estéticas y médicas: agenda, recordatorios por WhatsApp, historia clínica, consentimientos, facturación y CRM.",
  offers: { "@type": "Offer", price: "39", priceCurrency: "EUR" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "128" },
};

const FEATURES = [
  { icon: CalendarDays, t: "Agenda y citas", d: "Vista por sala y profesional, reservas online y recordatorios automáticos por WhatsApp 48h y 24h antes." },
  { icon: MessageCircle, t: "WhatsApp con IA", d: "Bandeja vinculada a la ficha del paciente y agente de IA que responde dudas y gestiona citas." },
  { icon: FileText, t: "Historia clínica", d: "Ficha completa, informes por voz, fotos antes/después y consentimientos con firma digital." },
  { icon: Receipt, t: "Facturación", d: "Emite facturas de tu clínica. Preparado para Verifactu y TicketBAI (vía Verifacti)." },
  { icon: Sparkles, t: "Asistente IA", d: "Un copiloto integrado que conoce los datos de tu clínica y te ayuda en el día a día." },
  { icon: ShieldCheck, t: "RGPD y datos de salud", d: "Alojado en la UE, aislamiento total por clínica y cifrado. Cumplimiento Art. 9 RGPD." },
];

const STATS = [
  { n: "-30%", l: "ausencias con recordatorios" },
  { n: "1 sitio", l: "agenda, fichas, WhatsApp y facturación" },
  { n: "14 días", l: "de prueba, sin tarjeta" },
  { n: "100% UE", l: "datos de salud seguros" },
];

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-[var(--brand)]/15 blur-3xl" />
          <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--brand-strong)]">
              <Sparkles size={13} /> Con IA integrada
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-[var(--text)] md:text-5xl">
              El software que tu <span className="gradient-text">clínica</span> merece
            </h1>
            <p className="mt-4 max-w-md text-lg text-[var(--text-soft)]">
              Agenda, recordatorios por WhatsApp, historia clínica, consentimientos, facturación y CRM. Todo en un solo lugar, para clínicas dentales, estéticas y médicas.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:bg-[var(--brand-strong)] hover:shadow-[var(--shadow-pop)]">
                Empezar gratis <ArrowRight size={18} />
              </Link>
              <Link href="/precios" className="inline-flex items-center rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-6 py-3 font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]">
                Ver precios
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-[var(--text-soft)]">
              <Check size={15} className="text-[var(--exito)]" /> 14 días gratis · sin tarjeta · cancela cuando quieras
            </p>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)]">
              <SmartImg src="/landing/hero.webp" alt="Recepción de una clínica moderna gestionada con Clinicomatic" className="aspect-[16/10]" />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-pop)] sm:block">
              <p className="text-xs text-[var(--text-soft)]">Citas hoy</p>
              <p className="font-display text-2xl font-bold text-[var(--brand)]">12</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-5 text-sm font-medium text-[var(--text-soft)]">
          <span className="inline-flex items-center gap-1.5"><Stethoscope size={15} className="text-[var(--brand)]" /> Dental</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles size={15} className="text-[var(--brand)]" /> Estética</span>
          <span className="inline-flex items-center gap-1.5"><HeartPulse size={15} className="text-[var(--brand)]" /> Médica general</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[var(--brand)]" /> RGPD · datos en la UE</span>
          <span className="inline-flex items-center gap-1.5"><Globe size={15} className="text-[var(--brand)]" /> Multidispositivo</span>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funciones" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--text)]">Todo lo que tu clínica necesita</h2>
          <p className="mt-3 text-[var(--text-soft)]">Deja de saltar entre programas. Clinicomatic reúne la gestión clínica, la comunicación y la facturación en una sola plataforma.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.t} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[var(--brand-tint)] text-[var(--brand-strong)]">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text)]">{f.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-soft)]">{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* VERTICALS */}
      <section id="verticales" className="bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--text)]">Hecho para tu especialidad</h2>
            <p className="mt-3 text-[var(--text-soft)]">Elige tu tipo de clínica y Clinicomatic se adapta: terminología, tratamientos y módulos a tu medida.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { img: "/landing/dental.webp", icon: Stethoscope, t: "Clínicas dentales", pts: ["Odontograma y tratamientos por pieza", "Recordatorios de revisión y ortodoncia", "Consentimientos e historia por paciente"] },
              { img: "/landing/estetica.webp", icon: Sparkles, t: "Clínicas estéticas", pts: ["Fotos antes/después y seguimiento", "Tratamientos recurrentes y recordatorios", "Informes por voz y fichas premium"] },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.t} className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-card)]">
                  <SmartImg src={v.img} alt={v.t} className="aspect-[16/9]" />
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 font-display text-xl font-bold text-[var(--text)]">
                      <Icon size={20} className="text-[var(--brand)]" /> {v.t}
                    </h3>
                    <ul className="mt-4 space-y-2">
                      {v.pts.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-[var(--text-soft)]">
                          <Check size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" strokeWidth={2.5} /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="gradient-brand py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl font-bold text-white md:text-4xl">{s.n}</p>
              <p className="mt-1 text-sm text-white/75">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--text)]">Precios simples y transparentes</h2>
          <p className="mt-3 text-[var(--text-soft)]">Empieza gratis 14 días. Sin permanencia. Cambia o cancela cuando quieras.</p>
        </div>
        <div className="mt-12">
          <PricingCards mode="marketing" />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="mb-10 text-center font-display text-3xl font-bold text-[var(--text)]">Preguntas frecuentes</h2>
          <Faq />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl font-bold text-[var(--text)] md:text-4xl">Empieza hoy con tu clínica</h2>
        <p className="mx-auto mt-3 max-w-lg text-[var(--text-soft)]">Crea tu cuenta en menos de un minuto y prueba Clinicomatic gratis durante 14 días.</p>
        <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-[12px] bg-[var(--brand)] px-7 py-3.5 font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:bg-[var(--brand-strong)] hover:shadow-[var(--shadow-pop)]">
          Crear mi clínica gratis <ArrowRight size={18} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[var(--brand)] text-white text-sm font-display font-bold">C</span>
            <span className="font-display font-bold text-[var(--text)]">Clinicomatic</span>
          </div>
          <p className="text-xs text-[var(--text-soft)]">© {new Date().getFullYear()} Clinicomatic · Software de gestión clínica · Datos alojados en la UE</p>
          <div className="flex gap-5 text-sm text-[var(--text-soft)]">
            <Link href="/precios" className="hover:text-[var(--text)]">Precios</Link>
            <Link href="/login" className="hover:text-[var(--text)]">Entrar</Link>
            <Link href="/signup" className="hover:text-[var(--text)]">Registro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
