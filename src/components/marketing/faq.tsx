"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "¿Sirve para mi tipo de clínica?", a: "Sí. Clinicomatic se adapta a clínicas dentales, estéticas y médicas en general. Al crear tu clínica eliges tu especialidad y la app ajusta terminología, tratamientos y módulos." },
  { q: "¿Mis datos están seguros y cumplen el RGPD?", a: "Sí. Los datos se alojan en la UE y cada clínica está completamente aislada (Row Level Security). Tratamos datos de salud (Art. 9 RGPD) con cifrado, control de acceso por rol y almacenamiento privado de fotos y documentos." },
  { q: "¿Necesito tarjeta para probarlo?", a: "No. Tienes 14 días de prueba gratis sin tarjeta. Después eliges el plan que mejor encaje con tu clínica." },
  { q: "¿Puedo enviar recordatorios por WhatsApp?", a: "Sí. Clinicomatic envía recordatorios de cita y de tratamientos recurrentes por WhatsApp, e incluye una bandeja con agente de IA para responder a tus pacientes." },
  { q: "¿Puedo emitir facturas?", a: "Sí. Incluye un módulo de facturación y está preparado para integrarse con Verifacti (Verifactu y TicketBAI homologados)." },
  { q: "¿Puedo migrar mis datos actuales?", a: "Sí. Dispones de importador y de una API propia documentada para conectar Clinicomatic con tus herramientas y no quedar encerrado en ningún software." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-[var(--border)] rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display font-semibold text-[var(--text)]">{f.q}</span>
              <ChevronDown size={18} className={cn("shrink-0 text-[var(--text-soft)] transition-transform", isOpen && "rotate-180")} />
            </button>
            <div className={cn("overflow-hidden transition-all", isOpen ? "max-h-60" : "max-h-0")}>
              <p className="px-5 pb-4 text-sm leading-relaxed text-[var(--text-soft)]">{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
