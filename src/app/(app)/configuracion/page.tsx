import Link from "next/link";
import { Users, CreditCard, Code2, Stethoscope, Upload, ChevronRight, Palette, MessageCircle, KeyRound, SlidersHorizontal, PhoneCall, ShieldCheck, FileSignature } from "lucide-react";
import { getCurrentOrg } from "@/lib/auth/org";

export const metadata = { title: "Configuración — Clinicomatic" };

const SECCIONES = [
  { href: "/configuracion/funciones", icon: SlidersHorizontal, t: "Funciones de la clínica", d: "Activa o desactiva módulos y secciones según tu especialidad." },
  { href: "/configuracion/apariencia", icon: Palette, t: "Apariencia", d: "Tema, colores y logo de tu clínica." },
  { href: "/configuracion/whatsapp", icon: MessageCircle, t: "WhatsApp", d: "Conecta tu número y configura el agente IA." },
  { href: "/configuracion/voz", icon: PhoneCall, t: "Agente de voz", d: "Recepcionista telefónica con IA (Retell + Twilio)." },
  { href: "/configuracion/verifactu", icon: ShieldCheck, t: "Verifactu / TicketBAI", d: "Conecta Verifacti para facturas verificables ante la AEAT." },
  { href: "/configuracion/equipo", icon: Users, t: "Equipo y roles", d: "Invita a tu equipo y gestiona permisos." },
  { href: "/configuracion/suscripcion", icon: CreditCard, t: "Suscripción", d: "Plan, facturación y datos de pago de Clinicomatic." },
  { href: "/configuracion/widget", icon: Code2, t: "Widget de reservas", d: "Incrusta el formulario de reservas en tu web." },
  { href: "/configuracion/api", icon: KeyRound, t: "API y desarrolladores", d: "Genera claves para integrar otras aplicaciones." },
  { href: "/configuracion/tratamientos", icon: Stethoscope, t: "Tratamientos", d: "Catálogo de tratamientos y periodicidades." },
  { href: "/configuracion/consentimientos", icon: FileSignature, t: "Consentimientos", d: "Plantillas legales por especialidad, editables y con variables." },
  { href: "/configuracion/importar", icon: Upload, t: "Importar datos", d: "Migra pacientes e historial desde otro software." },
];

export default async function ConfiguracionPage() {
  const org = await getCurrentOrg();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Configuración</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          {org?.nombre ? `Ajustes de ${org.nombre}.` : "Ajustes de tu clínica."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECCIONES.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-tint)] text-[var(--brand-strong)]">
                <Icon size={19} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center justify-between font-display font-semibold text-[var(--text)]">
                  {s.t}
                  <ChevronRight size={16} className="text-[var(--text-soft)] transition-transform group-hover:translate-x-0.5" />
                </h2>
                <p className="mt-0.5 text-sm text-[var(--text-soft)]">{s.d}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
