"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Heading2, List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Variable { clave: string; label: string }

interface Props {
  value: string;
  onChange: (html: string) => void;
  variables?: Variable[];
  placeholder?: string;
  className?: string;
}

/**
 * Editor de texto enriquecido ligero (contentEditable + toolbar), sin dependencias.
 * Guarda HTML. Permite insertar variables {{clave}} en el cursor.
 */
export function RichTextEditor({ value, onChange, variables = [], placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef(value);

  // Inyecta el HTML inicial una sola vez (evita resetear el cursor en cada render).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initial.current) {
      ref.current.innerHTML = initial.current || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const insertarVariable = (clave: string) => {
    ref.current?.focus();
    document.execCommand("insertText", false, `{{${clave}}}`);
    emit();
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
    >
      {children}
    </button>
  );

  return (
    <div className={cn("overflow-hidden rounded-[12px] border border-[var(--border)] bg-white", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50 px-2 py-1.5">
        <Btn onClick={() => cmd("bold")} title="Negrita"><Bold size={15} /></Btn>
        <Btn onClick={() => cmd("italic")} title="Cursiva"><Italic size={15} /></Btn>
        <Btn onClick={() => cmd("underline")} title="Subrayado"><Underline size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-[var(--border)]" />
        <Btn onClick={() => cmd("formatBlock", "<h2>")} title="Título"><Heading2 size={15} /></Btn>
        <Btn onClick={() => cmd("insertUnorderedList")} title="Lista"><List size={15} /></Btn>
        <Btn onClick={() => cmd("insertOrderedList")} title="Lista numerada"><ListOrdered size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-[var(--border)]" />
        <Btn onClick={() => cmd("undo")} title="Deshacer"><Undo2 size={15} /></Btn>
        <Btn onClick={() => cmd("redo")} title="Rehacer"><Redo2 size={15} /></Btn>
        {variables.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { insertarVariable(e.target.value); e.target.value = ""; } }}
            className="ml-auto h-8 rounded-[8px] border border-[var(--border)] bg-white px-2 text-xs font-semibold text-[var(--text-soft)] focus-visible:outline-none"
            title="Insertar variable"
          >
            <option value="">+ Insertar variable…</option>
            {variables.map((v) => <option key={v.clave} value={v.clave}>{v.label}</option>)}
          </select>
        )}
      </div>

      {/* Área editable */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        className="rte-content min-h-[280px] max-h-[60vh] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-[var(--text)] focus-visible:outline-none [&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5"
      />
    </div>
  );
}
