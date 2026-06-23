import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CopyField } from "@/components/configuracion/copy-field";
import { ApiClient, type ApiKeyRow } from "./api-client";

export const metadata = { title: "API y desarrolladores — VetClinic" };

export default async function ApiPage() {
  const supabase = await createClient();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, nombre, scopes, activo, ultima_uso_at, created_at")
    .order("created_at", { ascending: false });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const curl = `curl -H "Authorization: Bearer TU_CLAVE" \\\n  "${base}/api/public/v1/patients?limit=10"`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">API y desarrolladores</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Conecta tu clínica con cualquier otra aplicación: pacientes, citas, CRM y facturación a través de tu API.
        </p>
      </div>

      <section className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <ApiClient keys={(keys ?? []) as ApiKeyRow[]} />
      </section>

      <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display font-semibold text-[var(--text)]">Cómo usar la API</h2>
        <p className="mt-1 mb-3 text-sm text-[var(--text-soft)]">
          Autentícate con tu clave en la cabecera <code className="rounded bg-[var(--surface-2)] px-1">Authorization: Bearer</code>. Solo verás los datos de tu clínica.
        </p>
        <CopyField value={curl} />
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {[
            { metodo: "GET", ruta: "/api/public/v1/patients", desc: "Listado de pacientes (filtro por teléfono)" },
            { metodo: "GET", ruta: "/api/public/v1/appointments", desc: "Citas (filtro por fecha)" },
            { metodo: "POST", ruta: "/api/public/v1/appointments", desc: "Crear cita (reservas externas)" },
            { metodo: "GET", ruta: "/api/public/v1/openapi.json", desc: "Especificación OpenAPI" },
          ].map((e) => (
            <div key={e.metodo + e.ruta} className="rounded-[10px] border border-[var(--border)] px-3 py-2.5">
              <p className="font-mono text-xs font-bold text-[var(--brand-strong)]">{e.metodo} <span className="text-[var(--text)]">{e.ruta}</span></p>
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">{e.desc}</p>
            </div>
          ))}
        </div>
        <Link
          href="/api/public/v1/openapi.json"
          target="_blank"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Ver especificación OpenAPI <ExternalLink size={13} />
        </Link>
      </section>
    </div>
  );
}
