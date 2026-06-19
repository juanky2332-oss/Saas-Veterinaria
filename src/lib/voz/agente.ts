/**
 * Configuración del agente de VOZ por clínica (Retell + Twilio).
 *
 * Filosofía (igual que el agente de WhatsApp): hay un PROMPT BASE ya escrito y
 * probado; cada clínica solo aporta su "base de conocimiento" — tono, servicios,
 * horario y contexto — y nosotros componemos el prompt final que se envía a Retell.
 *
 * Vive en org_integrations(tipo='voz').config.
 */

export type VozTono = "cercano" | "profesional" | "premium";

export interface VozAgenteConfig {
  activo: boolean;
  tono: VozTono;
  voz_id: string; // id de voz de Retell (ElevenLabs/OpenAI)
  servicios: string; // base de conocimiento: servicios y precios orientativos
  horario: string;
  contexto: string; // info de la clínica (ubicación, parking, preparación…)
  puede_agendar: boolean; // si el agente ofrece reservar citas
}

export interface VozIntegrationConfig {
  retell_api_key?: string;
  retell_agent_id?: string;
  twilio_number?: string;
  agente?: Partial<VozAgenteConfig>;
}

export const VOZ_DEFAULT: VozAgenteConfig = {
  activo: true,
  tono: "cercano",
  voz_id: "11labs-Sofia",
  servicios: "",
  horario: "",
  contexto: "",
  puede_agendar: true,
};

export const VOZ_TONOS: { id: VozTono; label: string; prompt: string }[] = [
  { id: "cercano", label: "Cercano y cálido", prompt: "Habla con calidez y cercanía, con un ritmo natural y pausado, como una recepcionista amable." },
  { id: "profesional", label: "Profesional", prompt: "Habla de forma profesional, clara y eficiente, transmitiendo confianza." },
  { id: "premium", label: "Premium", prompt: "Habla con elegancia y serenidad, con cortesía exquisita, propio de una clínica premium." },
];

export const VOCES: { id: string; label: string }[] = [
  { id: "11labs-Sofia", label: "Sofía (femenina, cálida)" },
  { id: "11labs-Lucia", label: "Lucía (femenina, neutra)" },
  { id: "11labs-Mateo", label: "Mateo (masculina, cercana)" },
  { id: "openai-alloy", label: "Alloy (neutra)" },
];

export function normalizarVoz(parcial?: Partial<VozAgenteConfig>): VozAgenteConfig {
  return {
    activo: parcial?.activo ?? VOZ_DEFAULT.activo,
    tono: parcial?.tono ?? VOZ_DEFAULT.tono,
    voz_id: parcial?.voz_id ?? VOZ_DEFAULT.voz_id,
    servicios: parcial?.servicios ?? "",
    horario: parcial?.horario ?? "",
    contexto: parcial?.contexto ?? "",
    puede_agendar: parcial?.puede_agendar ?? VOZ_DEFAULT.puede_agendar,
  };
}

/**
 * PROMPT BASE del agente de voz, adaptado a cada clínica con su configuración.
 * Este es el "estándar de base"; la clínica solo rellena su conocimiento.
 */
export function buildVozPrompt(nombreClinica: string, parcial?: Partial<VozAgenteConfig>): string {
  const a = normalizarVoz(parcial);
  const tono = VOZ_TONOS.find((t) => t.id === a.tono) ?? VOZ_TONOS[0];

  return [
    `Eres la recepcionista virtual por teléfono de la clínica "${nombreClinica}". Atiendes llamadas en español de España.`,
    tono.prompt,
    "Sé breve y conversacional: frases cortas, una idea por turno, y pregunta antes de asumir. Confirma siempre nombre y teléfono cuando recojas datos.",
    a.puede_agendar
      ? "Puedes ayudar a reservar, confirmar o cambiar citas: toma los datos (nombre, motivo, día/hora preferida) y confirma que el equipo lo registrará."
      : "No gestionas la agenda directamente; toma los datos del paciente y dile que el equipo le llamará para cerrar la cita.",
    a.servicios ? `SERVICIOS Y PRECIOS (base de conocimiento de la clínica): ${a.servicios}` : "",
    a.horario ? `HORARIO: ${a.horario}.` : "",
    a.contexto ? `CONTEXTO DE LA CLÍNICA: ${a.contexto}` : "",
    "REGLAS: nunca des consejo médico ni diagnósticos; nunca inventes precios, disponibilidad ni datos que no estén en tu base de conocimiento; si no sabes algo, dilo con naturalidad y ofrece que un compañero del equipo le llame. Despídete con amabilidad.",
  ].filter(Boolean).join(" ");
}
