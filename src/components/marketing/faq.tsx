"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "¿Sirve para todo tipo de veterinaria?",
    a: "Sí. Veteriblandenguer está diseñado para clínicas de pequeños animales (perros y gatos), animales exóticos y medicina equina. Al crear tu veterinaria eliges tu especialidad y la app ajusta la terminología y los módulos.",
  },
  {
    q: "¿Mis datos están seguros y cumplen el RGPD?",
    a: "Sí. Los datos se alojan en la UE y cada clínica está completamente aislada (Row Level Security). Tratamos datos con cifrado, control de acceso por rol y almacenamiento privado de fotos e historiales.",
  },
  {
    q: "¿Necesito tarjeta para probarlo?",
    a: "No. Tienes 10 días de prueba gratis sin tarjeta. Después eliges el plan que mejor encaje con tu veterinaria.",
  },
  {
    q: "¿Puedo enviar recordatorios de vacunas y citas por WhatsApp?",
    a: "Sí. Veteriblandenguer envía recordatorios de citas y alertas de vacunas próximas por WhatsApp, e incluye una bandeja con agente de IA para responder a tus clientes.",
  },
  {
    q: "¿Puedo emitir facturas a los propietarios?",
    a: "Sí. Incluye un módulo de facturación a nombre del propietario (dueño de la mascota) con NIF, dirección y desglose de servicios. Compatible con Verifactu y TicketBAI.",
  },
  {
    q: "¿Puedo migrar mis datos actuales?",
    a: "Sí. Dispones de importador y de una API propia documentada para conectar Veteriblandenguer con tus herramientas y no quedar encerrado en ningún software.",
  },
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
