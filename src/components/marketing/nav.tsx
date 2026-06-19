"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#funciones", label: "Funciones" },
  { href: "/#verticales", label: "Para tu clínica" },
  { href: "/precios", label: "Precios" },
  { href: "/blog", label: "Blog" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand)] text-white text-lg font-display font-bold">C</span>
          <span className="text-xl font-display font-bold text-[var(--text)]">Clinicomatic</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-semibold text-[var(--text)] hover:text-[var(--brand)] transition-colors">
            Entrar
          </Link>
          <Link href="/signup" className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-[var(--brand-strong)] transition-colors">
            Empezar gratis
          </Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="md:hidden flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--text)]" aria-label="Menú">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={cn("md:hidden overflow-hidden border-t border-[var(--border)] transition-all", open ? "max-h-80" : "max-h-0 border-t-0")}>
        <div className="flex flex-col gap-1 px-5 py-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-[8px] px-2 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]">
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-[10px] border border-[var(--border)] px-4 py-2 text-center text-sm font-semibold text-[var(--text)]">Entrar</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-[10px] bg-[var(--brand)] px-4 py-2 text-center text-sm font-semibold text-white">Empezar gratis</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
