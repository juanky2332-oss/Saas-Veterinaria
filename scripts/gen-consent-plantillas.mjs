// Genera src/lib/consentimientos/plantillas.ts a partir del resultado de la
// investigación legal (workflow investigar-consentimientos). Uso único.
import { readFileSync, writeFileSync } from "node:fs";

const OUT = process.argv[2]; // ruta al .output del workflow
const raw = JSON.parse(readFileSync(OUT, "utf8"));
const items = raw.result;

// El workflow se ejecutó en este orden:
const KEYS = ["estetica", "dental", "fisioterapia", "psicologia", "veterinaria", "general", "rgpd"];
const LABELS = {
  estetica: "Estética",
  dental: "Dental / Odontología",
  fisioterapia: "Fisioterapia",
  psicologia: "Psicología",
  veterinaria: "Veterinaria",
  general: "Medicina general / Nutrición",
  rgpd: "Protección de datos e imágenes (RGPD)",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toHtml = (text) =>
  text.split(/\n\n+/).map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>").join("\n");

const plantillas = items.map((it, i) => ({
  id: KEYS[i] ?? `plantilla-${i}`,
  especialidad: KEYS[i] ?? "general",
  especialidadLabel: LABELS[KEYS[i]] ?? KEYS[i],
  titulo: it.plantilla_titulo,
  cuerpoHtml: toHtml(it.plantilla_texto),
  variables: it.variables ?? [],
  marcoLegal: it.marco_legal ?? [],
  aviso: it.aviso ?? "",
}));

const ts = `// ⚠️ Archivo generado por scripts/gen-consent-plantillas.mjs a partir de la
// investigación legal. Plantillas ORIENTATIVAS de consentimiento informado
// (España): Ley 41/2002, RGPD/LOPDGDD y normativa sectorial. Deben ser
// revisadas por un asesor jurídico antes de su uso real.

export interface ConsentVariable { clave: string; label: string }
export interface PlantillaConsentimiento {
  id: string;
  /** Clave de especialidad (coincide con el vertical para recomendar). 'rgpd' = transversal. */
  especialidad: string;
  especialidadLabel: string;
  titulo: string;
  cuerpoHtml: string;
  variables: ConsentVariable[];
  marcoLegal: string[];
  aviso: string;
}

export const PLANTILLAS_CONSENTIMIENTO: PlantillaConsentimiento[] = ${JSON.stringify(plantillas, null, 2)};

/** Plantillas recomendadas para una especialidad/vertical (incluye las transversales RGPD). */
export function plantillasRecomendadas(vertical?: string | null): PlantillaConsentimiento[] {
  return PLANTILLAS_CONSENTIMIENTO.filter((p) => p.especialidad === vertical || p.especialidad === "rgpd");
}
`;

writeFileSync(process.argv[3], ts, "utf8");
console.log(`OK → ${plantillas.length} plantillas escritas`);
