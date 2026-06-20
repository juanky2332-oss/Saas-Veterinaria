import "server-only";

/**
 * Adaptador Google Gemini API
 * Controlado por GEMINI_MODE=mock|live
 */

export interface InformeEstructurado {
  motivo: string;
  tratamiento: string;
  producto_lote: string;
  observaciones: string;
  pauta_seguimiento: string;
}

export interface ArticuloBlogInput {
  titulo?: string;
  tema: string;
  keyword?: string;
  keywordsSecundarias?: string[];
  categoria?: string;
}
export interface ArticuloBlogOutput {
  titulo: string;
  excerpt: string;
  contenidoHtml: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  /** Prompt en inglés para generar la imagen de portada (fotografía editorial). */
  imagenBrief: string;
  /** Texto alternativo (alt) sugerido para la imagen de portada. */
  imagenAlt: string;
}

export interface ImagenGenerada {
  data: string; // base64 (sin prefijo data:)
  mimeType: string;
}

interface GeminiAdapter {
  transcribirAudio(audioBase64?: string, mimeType?: string): Promise<string>;
  estructurarInforme(transcripcion: string): Promise<InformeEstructurado>;
  responderWhatsapp(mensaje: string, contexto: string): Promise<string>;
  asistirEquipo(pregunta: string, contexto: string): Promise<string>;
  generarArticuloBlog(input: ArticuloBlogInput): Promise<ArticuloBlogOutput>;
  /** Genera una imagen a partir de un prompt. Devuelve null si no está disponible. */
  generarImagen(prompt: string): Promise<ImagenGenerada | null>;
}

/** Instrucción de sistema para la redacción SEO del blog de Veteriblandenguer. */
const BLOG_SYSTEM_INSTRUCTION = `Eres redactor SEO senior del blog de Veteriblandenguer, un software de gestión para clínicas (estéticas, dentales, médicas, fisioterapia, etc.) en España. Escribes en español de España, tono profesional cercano, orientado a propietarios y gerentes de clínica.

FUENTE DE VERDAD (no inventes funciones): Veteriblandenguer gestiona pacientes e historia clínica, agenda con recordatorios por WhatsApp, CRM, tratamientos y recurrencias, presupuestos y facturación (con Verifactu/TicketBAI), bonos, caja, inventario, consentimientos, agente de voz IA y analítica. Multi-clínica, datos en la UE, cumple RGPD.

REGLAS DE HTML: devuelve SOLO el cuerpo del artículo en HTML semántico usando <h2>, <h3>, <p>, <ul>/<li>, <ol>/<li>, <strong>, <em>, <blockquote>, <table>. NO uses <h1>, NO uses atributos class/style, NO incluyas <html>/<head>/<body>.

REGLAS EDITORIALES: 4-6 secciones <h2>; 1200-1800 palabras; incluye la keyword principal en el primer <h2>; añade al menos una lista y, si encaja, una tabla o un ejemplo con cifras; evita clichés y relleno; cierra con un párrafo que mencione cómo Veteriblandenguer ayuda. Nada de promesas médicas ni datos clínicos inventados.

Devuelve SIEMPRE un JSON válido (sin markdown ni texto fuera del JSON) con las claves exactas: "titulo" (string, atractivo y con la keyword), "excerpt" (string, 150-200 caracteres), "contenido_html" (string con el cuerpo en HTML), "meta_title" (string, <=60 caracteres), "meta_description" (string, <=155 caracteres), "tags" (array de 3-6 strings), "featured_image_brief" (string EN INGLÉS: prompt para una fotografía editorial realista de portada relacionada con el tema —entorno de clínica/salud/gestión, luz natural, profesional, sin texto ni logotipos ni marcas de agua, sin collages ni ilustraciones), "featured_image_alt" (string en español, descripción breve de la imagen para accesibilidad).`;

class MockGeminiAdapter implements GeminiAdapter {
  async transcribirAudio(): Promise<string> {
    return "Paciente acude para renovación de toxina botulínica en zona frontal y entrecejo. Se aplican 20 unidades en frente y 15 en glabela con técnica habitual. Buena tolerancia. Sin incidencias. Paciente refiere que le duele menos que la sesión anterior. Se recomienda revisión a los 15 días.";
  }

  async estructurarInforme(_transcripcion: string): Promise<InformeEstructurado> {
    return {
      motivo: "Renovación de toxina botulínica",
      tratamiento: "Toxina botulínica en zona frontal y entrecejo. 20U frente + 15U glabela.",
      producto_lote: "[?] Pendiente confirmar lote",
      observaciones: "Buena tolerancia. Sin incidencias. Paciente refiere menor dolor respecto a sesión anterior.",
      pauta_seguimiento: "Revisión a los 15 días.",
    };
  }

  async responderWhatsapp(mensaje: string, _contexto: string): Promise<string> {
    console.info(`[GEMINI MOCK] Mensaje: ${mensaje.slice(0, 60)}…`);
    const lower = mensaje.toLowerCase();

    if (lower.includes("precio") || lower.includes("cuánto cuesta") || lower.includes("coste")) {
      return "Los precios orientativos los puede consultar directamente con nuestra recepción llamando al +34 968 000 000 o pasándose por la clínica ðŸ˜Š";
    }
    if (lower.includes("cita") || lower.includes("reservar") || lower.includes("hora") || lower.includes("hueco")) {
      return "¡Claro! Tenemos disponibilidad esta semana. ¿Qué tratamiento te interesa y qué día te viene mejor? Nuestro horario es: L 10-17h, M 11-20:30h, X 10-20:30h, J 10-20h, V 10-14h ðŸŒ¿";
    }
    if (lower.includes("horario") || lower.includes("cuando abren") || lower.includes("a qué hora")) {
      return "Nuestro horario es: Lunes 10-17h · Martes 11-20:30h · Miércoles 10-20:30h · Jueves 10-20h · Viernes 10-14h. ¿Te podemos ayudar en algo más?";
    }
    if (lower.includes("dirección") || lower.includes("donde están") || lower.includes("ubicación") || lower.includes("como llegar")) {
      return "Estamos en el Paseo Almirante Fajardo de Guevara 9, Murcia ðŸ“ ¡Te esperamos!";
    }

    return "Hola, soy el asistente de Veteriblandenguer ðŸŒ¿ Puedo ayudarte con información sobre nuestros tratamientos, horarios y citas. ¿En qué puedo ayudarte?";
  }

  async asistirEquipo(pregunta: string, contexto: string): Promise<string> {
    console.info(`[GEMINI MOCK] Asistente: ${pregunta.slice(0, 60)}…`);
    const ctx = contexto ? `Según tus datos: ${contexto} ` : "";
    return `${ctx}Puedo ayudarte a navegar Veteriblandenguer, revisar tu agenda, las recomendaciones de tratamientos, el stock y tus pacientes. Conecta una clave de IA (GEMINI_API_KEY) para respuestas completas. ¿En qué te ayudo?`;
  }

  async generarArticuloBlog(input: ArticuloBlogInput): Promise<ArticuloBlogOutput> {
    console.info(`[GEMINI MOCK] Artículo blog: ${(input.titulo || input.tema).slice(0, 60)}…`);
    const tema = input.tema || input.titulo || "Gestión de clínicas";
    const kw = input.keyword || tema;
    const titulo = input.titulo || `${tema}: guía práctica para tu clínica`;
    const contenidoHtml = `
<p>La <strong>${kw}</strong> es uno de los retos que más tiempo consume en el día a día de una clínica. En esta guía repasamos cómo abordarla de forma ordenada y qué papel juega un software de gestión como Veteriblandenguer.</p>
<h2>Por qué importa ${kw}</h2>
<p>Una buena organización repercute directamente en la experiencia del paciente y en la rentabilidad. Cuando los procesos están claros, el equipo trabaja con menos fricción y se reducen los errores.</p>
<ul>
<li>Menos tareas manuales y duplicidades.</li>
<li>Mejor seguimiento de pacientes y tratamientos.</li>
<li>Datos fiables para tomar decisiones.</li>
</ul>
<h2>Cómo ponerlo en marcha paso a paso</h2>
<p>El primer paso es centralizar la información: agenda, historia clínica y facturación en un mismo lugar. A partir de ahí, conviene automatizar lo repetitivo (recordatorios, recurrencias de tratamiento) y revisar los indicadores con regularidad.</p>
<h2>Errores frecuentes que conviene evitar</h2>
<p>Apoyarse en hojas de cálculo dispersas, no medir resultados o descuidar el cumplimiento normativo (RGPD, Verifactu) son tropiezos habituales que tienen solución con las herramientas adecuadas.</p>
<h2>Veteriblandenguer como aliado</h2>
<p>Con Veteriblandenguer unificas pacientes, agenda con recordatorios por WhatsApp, facturación con Verifactu/TicketBAI y analítica en una sola plataforma pensada para clínicas. Así tu equipo dedica el tiempo a lo que importa: cuidar a los pacientes.</p>`.trim();
    return {
      titulo,
      excerpt: `Guía práctica sobre ${kw} para clínicas: claves, pasos y errores a evitar para mejorar tu gestión diaria.`,
      contenidoHtml,
      metaTitle: titulo.slice(0, 60),
      metaDescription: `Descubre cómo abordar ${kw} en tu clínica con una guía práctica y el apoyo de Veteriblandenguer.`.slice(0, 155),
      tags: [tema, "gestión de clínicas", "Veteriblandenguer"].slice(0, 6),
      imagenBrief: `Editorial photograph related to ${tema}, modern clinic environment, natural light, professional, no text`,
      imagenAlt: `Imagen ilustrativa sobre ${kw}`,
    };
  }

  async generarImagen(): Promise<ImagenGenerada | null> {
    console.info("[GEMINI MOCK] Imagen de portada: omitida (modo mock).");
    return null;
  }
}

class LiveGeminiAdapter implements GeminiAdapter {
  private readonly apiKey = process.env.GEMINI_API_KEY!;
  private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  private async generateContent(
    model: string,
    prompt: string,
    parts?: { inlineData?: { mimeType: string; data: string } }[],
    opts?: { json?: boolean; systemInstruction?: string },
  ): Promise<string> {
    const contentParts = parts
      ? [...parts, { text: prompt }]
      : [{ text: prompt }];

    const body: Record<string, unknown> = { contents: [{ parts: contentParts }] };
    if (opts?.systemInstruction) body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
    if (opts?.json) {
      // maxOutputTokens alto + thinking desactivado: 2.5-flash gasta presupuesto
      // "pensando" y truncaría el JSON largo del artículo si no lo limitamos.
      body.generationConfig = {
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 },
      };
    }

    // Reintenta ante sobrecarga/límite transitorios del modelo (503/429/500).
    const maxIntentos = 4;
    let ultimoError = "";
    for (let intento = 0; intento < maxIntentos; intento++) {
      const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
      ultimoError = await res.text();
      if ((res.status === 503 || res.status === 429 || res.status === 500) && intento < maxIntentos - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (intento + 1)));
        continue;
      }
      break;
    }
    throw new Error(`Gemini error: ${ultimoError}`);
  }

  async transcribirAudio(audioBase64: string, mimeType: string): Promise<string> {
    return this.generateContent("gemini-2.5-flash-lite", "Transcribe este audio médico en español. Devuelve solo la transcripción literal.", [
      { inlineData: { mimeType, data: audioBase64 } },
    ]);
  }

  async estructurarInforme(transcripcion: string): Promise<InformeEstructurado> {
    const prompt = `Eres un asistente de medicina estética. Estructura esta transcripción en JSON con las claves: motivo, tratamiento, producto_lote, observaciones, pauta_seguimiento. Si no se menciona un campo, dejarlo vacío. Marca con [?] cualquier dato dudoso. NO inventes datos. Responde SOLO con el JSON, sin markdown.

Transcripción: ${transcripcion}`;

    const text = await this.generateContent("gemini-2.5-flash", prompt);
    try {
      return JSON.parse(text.trim()) as InformeEstructurado;
    } catch {
      return {
        motivo: transcripcion,
        tratamiento: "",
        producto_lote: "",
        observaciones: "",
        pauta_seguimiento: "",
      };
    }
  }

  async responderWhatsapp(mensaje: string, contexto: string): Promise<string> {
    const prompt = `${contexto}

Responde SIEMPRE en español y en un máximo de 2-3 frases (es WhatsApp).

Mensaje del paciente: ${mensaje}

Respuesta:`;

    return this.generateContent("gemini-2.5-flash", prompt);
  }

  async asistirEquipo(pregunta: string, contexto: string): Promise<string> {
    const prompt = `Eres el asistente de IA integrado en Veteriblandenguer, software de gestión para clínicas (estéticas, dentales y generales). Ayudas al EQUIPO de la clínica a usar la app y a entender sus datos del día. Responde en español, claro, cálido y conciso (máx. 6 frases). No des consejo médico ni diagnósticos. Para datos concretos usa SOLO el contexto; si algo no está, dilo y sugiere dónde mirarlo en la app.

Contexto actual de la clínica:
${contexto}

Pregunta del equipo: ${pregunta}

Respuesta:`;
    return this.generateContent("gemini-2.5-flash", prompt);
  }

  async generarArticuloBlog(input: ArticuloBlogInput): Promise<ArticuloBlogOutput> {
    const userPrompt = `Redacta un artículo de blog con estos datos:
- Tema / brief: ${input.tema}
${input.titulo ? `- Título sugerido: ${input.titulo}` : ""}
- Keyword principal: ${input.keyword || input.tema}
${input.keywordsSecundarias?.length ? `- Keywords secundarias: ${input.keywordsSecundarias.join(", ")}` : ""}
${input.categoria ? `- Categoría: ${input.categoria}` : ""}

Devuelve solo el JSON especificado.`;

    const text = await this.generateContent("gemini-2.5-flash", userPrompt, undefined, {
      json: true,
      systemInstruction: BLOG_SYSTEM_INSTRUCTION,
    });

    let parsed: {
      titulo?: string; excerpt?: string; contenido_html?: string;
      meta_title?: string; meta_description?: string; tags?: string[];
      featured_image_brief?: string; featured_image_alt?: string;
    };
    try {
      // Robustez: quita fences \`\`\`json y recorta al objeto { … } si viniera con texto alrededor.
      let limpio = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
      const ini = limpio.indexOf("{"), fin = limpio.lastIndexOf("}");
      if (ini > 0 || fin < limpio.length - 1) limpio = limpio.slice(ini, fin + 1);
      parsed = JSON.parse(limpio);
    } catch {
      // Fallback: trata la respuesta como cuerpo HTML/plano.
      const titulo = input.titulo || input.tema;
      return {
        titulo,
        excerpt: input.tema.slice(0, 180),
        contenidoHtml: text || `<p>${input.tema}</p>`,
        metaTitle: titulo.slice(0, 60),
        metaDescription: input.tema.slice(0, 155),
        tags: [],
        imagenBrief: `Editorial photograph about ${input.tema}, modern clinic, natural light, professional, no text`,
        imagenAlt: input.titulo || input.tema,
      };
    }

    const titulo = parsed.titulo || input.titulo || input.tema;
    return {
      titulo,
      excerpt: parsed.excerpt ?? "",
      contenidoHtml: parsed.contenido_html ?? "",
      metaTitle: parsed.meta_title || titulo.slice(0, 60),
      metaDescription: parsed.meta_description ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      imagenBrief: parsed.featured_image_brief || `Editorial photograph about ${titulo}, modern clinic, natural light, professional, no text`,
      imagenAlt: parsed.featured_image_alt || titulo,
    };
  }

  async generarImagen(prompt: string): Promise<ImagenGenerada | null> {
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
    const cuerpo = {
      contents: [{ parts: [{ text: `${prompt}. Wide 16:9 editorial photo, high quality, photorealistic, no text, no watermark, no logos.` }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    };

    const maxIntentos = 3;
    let ultimoError = "";
    for (let intento = 0; intento < maxIntentos; intento++) {
      const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (res.ok) {
        const data = await res.json() as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] };
        const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (part?.inlineData?.data) {
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
        }
        return null; // respuesta sin imagen
      }
      ultimoError = await res.text();
      if ((res.status === 503 || res.status === 429 || res.status === 500) && intento < maxIntentos - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (intento + 1)));
        continue;
      }
      break;
    }
    console.error("[GEMINI] imagen no generada:", ultimoError.slice(0, 200));
    return null; // degradación: el artículo se guarda sin imagen
  }
}

const mode = process.env.GEMINI_MODE ?? "mock";
export const geminiAdapter: GeminiAdapter =
  mode === "live" ? new LiveGeminiAdapter() : new MockGeminiAdapter();
