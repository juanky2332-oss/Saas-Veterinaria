"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-4 pr-12 text-xs leading-relaxed text-[var(--text)]">
        <code>{value}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--surface)] text-[var(--text-soft)] shadow-[var(--shadow-card)] hover:text-[var(--brand)] transition-colors"
        aria-label="Copiar"
      >
        {copied ? <Check size={15} className="text-[var(--exito)]" /> : <Copy size={15} />}
      </button>
    </div>
  );
}
