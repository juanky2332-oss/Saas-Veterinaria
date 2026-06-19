/**
 * Configuración del agente IA de WhatsApp por clínica.
 * Vive en org_integrations(tipo='whatsapp').config.agente y se convierte en el
 * contexto del prompt: una base común que se adapta al tono, funciones e
 * instrucciones que cada clínica define en Configuración → WhatsApp.
 */

export interface AgenteConfig {
  activo: boolean;
  tono: "cercano" | "profesional" | "premium";
  funciones: string[]; // claves de FUNCIONES_AGENTE
  instrucciones: string; // texto libre de la clínica
  horario: string;
}

export interface WhatsappIntegrationConfig {
  token?: string;
  app_secret?: string;
  waba_id?: string;
  display_phone?: string;
  agente?: Partial<AgenteConfig>;
}

export const AGENTE_DEFAULT: AgenteConfig = {
  activo: true,
  tono: "cercano",
  funciones: ["faqs", "citas", "captura", "derivar"],
  instrucciones: "",
  horario: "",
};

export const TONOS: { id: AgenteConfig["tono"]; label: string; prompt: string }[] = [
  { id: "cercano", label: "Cercano y cálido", prompt: "Tono cálido, cercano y humano; usa un lenguaje natural y algún emoji con moderación." },
  { id: "profesional", label: "Profesional", prompt: "Tono profesional, claro y eficiente; sin emojis, frases directas." },
  { id: "premium", label: "Premium", prompt: "Tono elegante y sereno, propio de una clínica premium; cortesía exquisita, sin emojis." },
];

export const FUNCIONES_AGENTE: { id: string; label: string; prompt: string }[] = [
  { id: "faqs", label: "Responder dudas frecuentes", prompt: "Responde dudas frecuentes (servicios, horario, ubicación, preparación de visitas)." },
  { id: "citas", label: "Información de citas y reservas", prompt: "Ayuda con citas: invita a reservar, indica disponibilidad general y cómo confirmar o cambiar una cita." },
  { id: "precios", label: "Dar precios orientativos", prompt: "Puedes dar precios orientativos si la clínica los ha indicado en sus instrucciones; deja claro que son orientativos." },
  { id: "captura", label: "Recoger datos de interesados", prompt: "Si alguien muestra interés, recoge su nombre y motivo de consulta con amabilidad para que el equipo le contacte." },
  { id: "derivar", label: "Derivar a una persona del equipo", prompt: "Si el tema es delicado, clínico o la persona lo pide, indica que avisas al equipo y deja de responder." },
];

export function normalizarAgente(parcial?: Partial<AgenteConfig>): AgenteConfig {
  return {
    activo: parcial?.activo ?? AGENTE_DEFAULT.activo,
    tono: parcial?.tono ?? AGENTE_DEFAULT.tono,
    funciones: parcial?.funciones ?? AGENTE_DEFAULT.funciones,
    instrucciones: parcial?.instrucciones ?? "",
    horario: parcial?.horario ?? "",
  };
}

/**
 * Construye el contexto del prompt del agente para una clínica concreta.
 * Es el "prompt general adaptado a cada empresa": base común + su configuración.
 */
export function buildAgenteContexto(nombreClinica: string, parcial?: Partial<AgenteConfig>): string {
  const a = normalizarAgente(parcial);
  const tono = TONOS.find((t) => t.id === a.tono) ?? TONOS[0];
  const funciones = FUNCIONES_AGENTE.filter((f) => a.funciones.includes(f.id));

  const partes = [
    `Eres el asistente de WhatsApp de la clínica "${nombreClinica}".`,
    tono.prompt,
    funciones.length
      ? `Tus funciones: ${funciones.map((f) => f.prompt).join(" ")}`
      : "Tu única función es saludar y avisar de que el equipo responderá en breve.",
    a.horario ? `Horario de la clínica: ${a.horario}.` : "",
    a.instrucciones ? `Instrucciones específicas de la clínica: ${a.instrucciones}` : "",
    "Reglas innegociables: NUNCA des consejo médico ni diagnósticos; NUNCA inventes precios ni disponibilidad; si no sabes algo, dilo y ofrece que el equipo conteste.",
  ].filter(Boolean);

  return partes.join(" ");
}
