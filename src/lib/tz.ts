/**
 * Utilidades de zona horaria sin dependencias (usa Intl).
 *
 * La agenda guarda los instantes en UTC (timestamptz). Para que una cita "a las
 * 10:00" signifique 10:00 en la zona horaria de la CLÍNICA (y se vea igual desde
 * cualquier navegador/país), convertimos el reloj de pared ↔ UTC con la tz de la
 * organización en vez de la del navegador.
 */

export const DEFAULT_TZ = "Europe/Madrid";

/** Lista curada de zonas horarias frecuentes (ES + LATAM). */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: "Europe/Madrid", label: "España peninsular (Madrid)" },
  { value: "Atlantic/Canary", label: "Canarias" },
  { value: "Europe/Lisbon", label: "Portugal (Lisboa)" },
  { value: "Europe/London", label: "Reino Unido (Londres)" },
  { value: "Europe/Paris", label: "Centroeuropa (París)" },
  { value: "America/Mexico_City", label: "México (CDMX)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "America/New_York", label: "EE. UU. Este (Nueva York)" },
  { value: "America/Los_Angeles", label: "EE. UU. Pacífico (Los Ángeles)" },
];

/** Offset (ms) = (reloj-de-pared-como-si-fuese-UTC) − instante real, para una tz. */
function tzOffsetMs(timeZone: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const m: Record<string, number> = {};
  for (const p of dtf.formatToParts(instant)) if (p.type !== "literal") m[p.type] = Number(p.value);
  let hour = m.hour;
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, hour, m.minute, m.second);
  return asUTC - instant.getTime();
}

/** Reloj de pared (YYYY-MM-DD, HH:mm) interpretado en `timeZone` → ISO UTC. */
export function zonedWallClockToUtcISO(dateStr: string, timeStr: string, timeZone: string): string {
  const naiveUTC = Date.UTC(
    Number(dateStr.slice(0, 4)),
    Number(dateStr.slice(5, 7)) - 1,
    Number(dateStr.slice(8, 10)),
    Number(timeStr.slice(0, 2)),
    Number(timeStr.slice(3, 5)),
    0,
  );
  const off = tzOffsetMs(timeZone, new Date(naiveUTC));
  let utc = naiveUTC - off;
  // Refinar una vez por si cae en un cambio de hora (DST).
  const off2 = tzOffsetMs(timeZone, new Date(utc));
  if (off2 !== off) utc = naiveUTC - off2;
  return new Date(utc).toISOString();
}

/** Hora, minuto y fecha (YYYY-MM-DD) de un instante en `timeZone`. */
export function partsInTz(iso: string | Date, timeZone: string): { hour: number; minute: number; ymd: string } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(d)) if (p.type !== "literal") m[p.type] = p.value;
  let hour = Number(m.hour);
  if (hour === 24) hour = 0;
  return { hour, minute: Number(m.minute), ymd: `${m.year}-${m.month}-${m.day}` };
}

/** Hora "HH:mm" de un instante en la zona horaria de la clínica. */
export function formatHoraTz(iso: string, timeZone: string): string {
  const { hour, minute } = partsInTz(iso, timeZone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
