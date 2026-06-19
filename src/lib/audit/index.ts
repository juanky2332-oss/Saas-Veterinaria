import { createClient } from "@/lib/supabase/server";

export type AuditAccion =
  | "ver_informe"
  | "descargar_foto"
  | "descargar_consentimiento"
  | "modificar_paciente"
  | "borrar_paciente"
  | "exportar_pacientes"
  | "ver_historial"
  | "crear_paciente"
  | "firmar_consentimiento";

export async function registrarAuditoria(
  accion: AuditAccion,
  entidad: string,
  entidadId?: string,
  detalle?: Record<string, string | number | boolean | null>
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // La tabla audit_log no tiene RLS de update, usamos insert directo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_log") as any).insert({
      usuario_id: user.id,
      accion,
      entidad,
      entidad_id: entidadId ?? null,
      detalle: detalle ?? null,
    });
  } catch {
    // No bloquear la operación principal si falla el log
  }
}
