import Link from "next/link";
import { ExternalLink, Code2 } from "lucide-react";
import { getCurrentOrg } from "@/lib/auth/org";
import { CopyField } from "@/components/configuracion/copy-field";

export const metadata = { title: "Widget de reservas — Clinicomatic" };

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function WidgetConfigPage() {
  const org = await getCurrentOrg();
  const slug = org?.slug ?? "";
  const snippet = `<script src="${APP}/widget.js" data-clinic="${slug}"></script>`;
  const reservarUrl = `${APP}/reservar/${slug}`;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Widget de reservas</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Añade un formulario de reservas a la web de tu clínica. Las solicitudes entran en tu agenda como citas pendientes.
        </p>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-display font-semibold text-[var(--text)]">
          <Code2 size={18} className="text-[var(--brand)]" /> Tu código para incrustar
        </h2>
        <p className="mt-1 mb-3 text-sm text-[var(--text-soft)]">Pega este fragmento en tu web (WordPress, HTML, etc.) donde quieras el formulario.</p>
        <CopyField value={snippet} />
        <p className="mt-3 text-xs text-[var(--text-soft)]">
          Personalizable: añade <code className="rounded bg-[var(--surface-2)] px-1">data-height=&quot;800&quot;</code> para ajustar la altura.
        </p>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display font-semibold text-[var(--text)]">Vista previa</h2>
        <p className="mt-1 mb-3 text-sm text-[var(--text-soft)]">Así verán tus pacientes el formulario de reservas:</p>
        <Link href={reservarUrl} target="_blank" className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
          Abrir página de reservas <ExternalLink size={15} />
        </Link>
      </div>
    </div>
  );
}
