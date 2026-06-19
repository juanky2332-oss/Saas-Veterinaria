"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Datepicker visual propio (sin dependencias). Trabaja con cadenas ISO
 * `YYYY-MM-DD`, igual que un <input type="date">, para ser un reemplazo directo.
 */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

function parseISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** Lunes = 0 … Domingo = 6 */
function dowMon(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export interface DatePickerProps {
  value: string | null | undefined;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  className?: string;
  /** Formato largo "12 de junio de 2026" en vez de "12 jun 2026". */
  long?: boolean;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Seleccionar fecha",
  disabled,
  clearable,
  id,
  className,
  long,
}: DatePickerProps) {
  const selected = parseISO(value);
  const minD = parseISO(min);
  const maxD = parseISO(max);
  const today = new Date();

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"days" | "months">("days");
  const [view, setView] = React.useState(() => selected ?? today);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setView(selected ?? today);
      setMode("days");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const disabledDay = (d: Date): boolean => Boolean((minD && d < minD) || (maxD && d > maxD));

  function pick(d: Date) {
    if (disabledDay(d)) return;
    onChange(toISO(d));
    setOpen(false);
  }

  const label = selected
    ? long
      ? `${selected.getDate()} de ${MESES[selected.getMonth()]} de ${selected.getFullYear()}`
      : `${selected.getDate()} ${MESES_CORTO[selected.getMonth()]} ${selected.getFullYear()}`
    : "";

  // Rejilla del mes en curso (6 semanas × 7 días).
  const viewYear = view.getFullYear();
  const viewMonth = view.getMonth();
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = dowMon(firstOfMonth);
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  const days: Date[] = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));

  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }
  function shiftYear(delta: number) {
    setView((v) => new Date(v.getFullYear() + delta, v.getMonth(), 1));
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-[12px] border border-[var(--lino)] bg-white px-3 py-2 text-left text-sm transition-all duration-150 focus-visible:border-[var(--oliva)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(117,128,107,.25)] disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-[var(--oliva)] ring-2 ring-[rgba(117,128,107,.25)]",
        )}
      >
        <Calendar size={15} className="shrink-0 text-[var(--tinta-suave)]" />
        <span className={cn("flex-1 truncate", !selected && "text-[var(--tinta-suave)]")}>{label || placeholder}</span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Limpiar fecha"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="rounded p-0.5 text-[var(--tinta-suave)] hover:bg-[var(--surface-2)] hover:text-[var(--tinta)]"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[296px] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-pop)]">
          {/* Cabecera de navegación */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <NavBtn aria-label="Año anterior" onClick={() => shiftYear(-1)}><ChevronsLeft size={16} /></NavBtn>
              <NavBtn aria-label="Mes anterior" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></NavBtn>
            </div>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "days" ? "months" : "days"))}
              className="rounded-[8px] px-2 py-1 text-sm font-semibold capitalize text-[var(--text)] hover:bg-[var(--surface-2)]"
            >
              {MESES[viewMonth]} {viewYear}
            </button>
            <div className="flex items-center gap-0.5">
              <NavBtn aria-label="Mes siguiente" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></NavBtn>
              <NavBtn aria-label="Año siguiente" onClick={() => shiftYear(1)}><ChevronsRight size={16} /></NavBtn>
            </div>
          </div>

          {mode === "days" ? (
            <>
              <div className="grid grid-cols-7 gap-1">
                {DIAS.map((d) => (
                  <div key={d} className="flex h-7 items-center justify-center text-[11px] font-semibold text-[var(--text-soft)]">{d}</div>
                ))}
                {days.map((d) => {
                  const inMonth = d.getMonth() === viewMonth;
                  const isToday = sameDay(d, today);
                  const isSel = selected && sameDay(d, selected);
                  const isDisabled = disabledDay(d);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => pick(d)}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-[9px] text-sm tabular-nums transition-colors",
                        !inMonth && "text-[var(--text-soft)]/40",
                        inMonth && !isSel && "text-[var(--text)] hover:bg-[var(--brand-tint)]",
                        isSel && "bg-[var(--brand)] font-bold text-white hover:bg-[var(--brand)]",
                        !isSel && isToday && "ring-1 ring-inset ring-[var(--brand)] font-semibold",
                        isDisabled && "cursor-not-allowed text-[var(--text-soft)]/30 hover:bg-transparent",
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
                <button
                  type="button"
                  onClick={() => { const t = new Date(); setView(t); if (!disabledDay(t)) pick(t); }}
                  className="rounded-[8px] px-2 py-1 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint)]"
                >
                  Hoy
                </button>
                {clearable && selected && (
                  <button
                    type="button"
                    onClick={() => { onChange(""); setOpen(false); }}
                    className="rounded-[8px] px-2 py-1 text-xs font-semibold text-[var(--text-soft)] hover:bg-[var(--surface-2)]"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {MESES_CORTO.map((m, i) => {
                const isSel = selected && selected.getFullYear() === viewYear && selected.getMonth() === i;
                const isCur = today.getFullYear() === viewYear && today.getMonth() === i;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setView(new Date(viewYear, i, 1)); setMode("days"); }}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-[10px] text-sm font-medium capitalize transition-colors",
                      isSel ? "bg-[var(--brand)] font-bold text-white" : "text-[var(--text)] hover:bg-[var(--brand-tint)]",
                      !isSel && isCur && "ring-1 ring-inset ring-[var(--brand)]",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NavBtn({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      {...rest}
    >
      {children}
    </button>
  );
}
