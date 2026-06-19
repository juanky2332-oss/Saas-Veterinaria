"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureState } from "@/lib/features";
import { visibleNavItems, navItemsBySeccion } from "./nav-items";

const PRIMARIOS = ["/dashboard", "/pacientes", "/agenda", "/whatsapp"];

export function MobileNav({ features }: { features?: Partial<FeatureState> } = {}) {
  const pathname = usePathname();
  const [masOpen, setMasOpen] = useState(false);

  const todos = visibleNavItems(features);
  const grupos = navItemsBySeccion(features, { todos: true });
  const primarios = PRIMARIOS.map((h) => todos.find((i) => i.href === h)).filter(Boolean).slice(0, 4) as typeof todos;

  const activo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Cerrar la hoja al navegar o con ESC
  useEffect(() => { setMasOpen(false); }, [pathname]);
  useEffect(() => {
    if (!masOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMasOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [masOpen]);

  return (
    <>
      {/* Hoja "Más" con todos los módulos */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          masOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMasOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 rounded-t-[22px] border-t border-[var(--lino)] bg-[var(--blanco-calido)] p-5 pb-8 shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out md:hidden",
          masOpen ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
        role="dialog"
        aria-label="Todos los módulos"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--lino)]" />
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-base font-bold text-[var(--tinta)]">Todos los módulos</p>
          <button onClick={() => setMasOpen(false)} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--tinta-suave)] hover:bg-[var(--arena)]">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {grupos.map((grupo) => (
            <div key={grupo.seccion}>
              <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--tinta-suave)]/70">{grupo.seccion}</p>
              <div className="grid grid-cols-4 gap-2">
                {grupo.items.map((item) => {
                  const Icon = item.icon;
                  const act = activo(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={act ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-[14px] p-2.5 text-center transition-colors",
                        act ? "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]" : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]",
                      )}
                    >
                      <Icon size={20} strokeWidth={1.75} className={act ? "text-[var(--oliva)]" : "text-current"} />
                      <span className="text-[10.5px] font-semibold leading-tight">{item.shortLabel ?? item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-stretch border-t border-[var(--lino)] bg-[var(--blanco-calido)]/95 px-1 py-1.5 backdrop-blur-sm">
          {primarios.map((item) => {
            const Icon = item.icon;
            const act = activo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={act ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-[10px] py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oliva)]",
                  act ? "text-[var(--oliva-oscuro)]" : "text-[var(--tinta-suave)]",
                )}
              >
                {act && <span className="absolute -mt-1 top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--oliva)]" />}
                <Icon size={19} strokeWidth={1.75} className={act ? "text-[var(--oliva)]" : "text-current"} />
                {item.shortLabel ?? item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMasOpen(true)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-[10px] py-2 text-[11px] font-semibold text-[var(--tinta-suave)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oliva)]",
              masOpen && "text-[var(--oliva-oscuro)]",
            )}
            aria-label="Ver todos los módulos"
          >
            <LayoutGrid size={19} strokeWidth={1.75} className={masOpen ? "text-[var(--oliva)]" : "text-current"} />
            Más
          </button>
        </div>
      </nav>
    </>
  );
}
