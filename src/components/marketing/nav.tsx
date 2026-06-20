"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#funciones",   label: "Funciones" },
  { href: "/#verticales",  label: "Para tu veterinaria" },
  { href: "/precios",      label: "Precios" },
  { href: "/blog",         label: "Blog" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand)] text-white shadow-[0_4px_12px_-4px_rgba(46,139,87,.5)] group-hover:bg-[var(--brand-strong)] transition-colors">
            <PawPrint size={18} strokeWidth={2} />
          </span>
          <span className="text-[18px] font-display font-extrabold text-[var(--text)] tracking-tight">Veteriblandenguer</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-[var(--text-soft)] hover:text-[var(--brand)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-[var(--text)] hover:text-[var(--brand)] transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(46,139,87,.5)] hover:bg-[var(--brand-strong)] transition-all hover:shadow-[0_6px_18px_-4px_rgba(46,139,87,.55)]"
          >
            Empezar gratis
          </Link>
        </div>

        {/* Botón menú mobile */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Menú"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menú mobile desplegable */}
      <div className={cn("md:hidden overflow-hidden border-t border-[var(--border)] transition-all", open ? "max-h-80" : "max-h-0 border-t-0")}>
        <div className="flex flex-col gap-1 px-5 py-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[8px] px-3 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--brand-tint)] hover:text-[var(--brand)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 pt-2 border-t border-[var(--border)]">
            <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-[10px] border border-[var(--border)] px-4 py-2 text-center text-sm font-semibold text-[var(--text)]">Entrar</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-[10px] bg-[var(--brand)] px-4 py-2 text-center text-sm font-bold text-white">Empezar gratis</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
