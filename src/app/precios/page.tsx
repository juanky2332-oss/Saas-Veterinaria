import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { Faq } from "@/components/marketing/faq";
import { PricingCards } from "@/components/billing/pricing-cards";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://clinicomatic.app";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: "Precios — Clinicomatic | Software de gestión para clínicas",
  description:
    "Planes de Clinicomatic para clínicas dentales, estéticas y médicas. Desde 39€/mes. 14 días de prueba gratis, sin tarjeta y sin permanencia.",
  alternates: { canonical: "/precios" },
  openGraph: { title: "Precios de Clinicomatic", description: "Desde 39€/mes. 14 días gratis, sin tarjeta.", url: `${base}/precios`, locale: "es_ES", type: "website" },
};

export default function PreciosPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text)]">Precios para tu clínica</h1>
          <p className="mt-3 text-lg text-[var(--text-soft)]">Todo incluido. Empieza gratis 14 días, sin tarjeta. Cambia o cancela cuando quieras.</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]">
            <Check size={15} className="text-[var(--exito)]" /> Pago seguro con tarjeta o SEPA · datos en la UE
          </p>
        </div>
        <div className="mt-12">
          <PricingCards mode="marketing" />
        </div>
      </section>

      <section className="bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="mb-10 text-center font-display text-3xl font-bold text-[var(--text)]">Preguntas frecuentes</h2>
          <Faq />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--text)]">¿Listo para empezar?</h2>
        <Link href="/signup" className="mt-5 inline-flex rounded-[12px] bg-[var(--brand)] px-7 py-3.5 font-semibold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--brand-strong)]">
          Crear mi clínica gratis
        </Link>
      </section>
    </div>
  );
}
