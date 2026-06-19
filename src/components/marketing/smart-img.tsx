"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Imagen con fallback elegante: el contenedor siempre muestra un degradado de
 * marca; la imagen se superpone si carga. Si falta (404), se oculta y queda el
 * degradado — la landing nunca se ve rota.
 */
export function SmartImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-[var(--brand-tint)] via-[var(--surface-2)] to-[var(--accent-tint)]",
        className,
      )}
    >
      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
