/** Utilidades del blog: slug y tiempo de lectura (sin dependencias). */

export function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "articulo";
}

/** Minutos de lectura estimados (~200 palabras/min) a partir de HTML o texto. */
export function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** Texto plano (para excerpt fallback) a partir de HTML. */
export function htmlToText(html: string, max = 200): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

/**
 * Saneado HTML sin dependencias (defensa en profundidad). El contenido del blog
 * proviene de fuentes de confianza (superadmin + IA), pero antes de persistir y
 * servir con dangerouslySetInnerHTML eliminamos etiquetas/atributos peligrosos
 * por si el modelo o un pegado introdujeran algo inesperado.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;
  let out = html;
  // Bloques peligrosos con su contenido.
  out = out.replace(/<(script|style|iframe|object|embed|form|noscript|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Etiquetas sueltas/void peligrosas.
  out = out.replace(/<\/?(script|style|iframe|object|embed|form|noscript|link|meta|base|svg|math)\b[^>]*>/gi, "");
  // Atributos manejadores de eventos on*.
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Neutraliza esquemas javascript:/data: en href/src.
  out = out.replace(/\s(href|src)\s*=\s*("|')\s*(javascript|data):[^"']*\2/gi, ' $1=$2#$2');
  return out;
}
