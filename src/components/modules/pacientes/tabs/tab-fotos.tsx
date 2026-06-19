"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Image as ImageIcon, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFecha } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Foto {
  id: string;
  storage_path: string;
  tomada_at: string;
  etiqueta: string | null;
  treatment_id: string | null;
}

interface TabFotosProps {
  fotos: Record<string, unknown>[];
  pacienteId: string;
  orgId: string;
}

const ETIQUETAS = [
  { value: "antes", label: "Antes" },
  { value: "despues", label: "Después" },
  { value: "seguimiento", label: "Seguimiento" },
];

const etiquetaVariant = (e: string | null): "aviso" | "exito" | "muted" => {
  if (e === "antes") return "aviso";
  if (e === "despues") return "exito";
  return "muted";
};

export function TabFotos({ fotos, pacienteId, orgId }: TabFotosProps) {
  const router = useRouter();
  const supabase = createClient();
  const lista = fotos as unknown as Foto[];
  const inputRef = useRef<HTMLInputElement>(null);
  const [etiqueta, setEtiqueta] = useState("antes");
  const [subiendo, setSubiendo] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState<string | null>(null);

  // URLs firmadas para mostrar las imágenes del bucket privado.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const paths = lista.map((f) => f.storage_path);
      if (paths.length === 0) return;
      const { data } = await supabase.storage.from("patient-photos").createSignedUrls(paths, 3600);
      if (cancelado || !data) return;
      const map: Record<string, string> = {};
      data.forEach((d, i) => { if (d.signedUrl) map[lista[i].id] = d.signedUrl; });
      setUrls(map);
    })();
    return () => { cancelado = true; };
  }, [lista, supabase]);

  const subir = useCallback(async (file: File) => {
    setSubiendo(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${orgId}/${pacienteId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("patient-photos").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("patient_photos").insert({
        organization_id: orgId,
        patient_id: pacienteId,
        storage_path: path,
        etiqueta,
        tomada_at: new Date().toISOString(),
      });
      if (insErr) throw insErr;
      toast.success("Foto subida.");
      router.refresh();
    } catch {
      toast.error("No se pudo subir la foto.");
    } finally {
      setSubiendo(false);
    }
  }, [orgId, pacienteId, etiqueta, supabase, router]);

  async function borrar(foto: Foto) {
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar esta foto?")) return;
    await supabase.storage.from("patient-photos").remove([foto.storage_path]);
    await supabase.from("patient_photos").delete().eq("id", foto.id);
    toast.success("Foto eliminada.");
    router.refresh();
  }

  const controles = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={etiqueta}
        onChange={(e) => setEtiqueta(e.target.value)}
        className="h-9 rounded-[10px] border border-[var(--lino)] bg-white px-3 text-sm text-[var(--tinta)] focus-visible:border-[var(--oliva)] focus-visible:outline-none"
      >
        {ETIQUETAS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
      </select>
      <Button size="sm" className="gap-1.5" disabled={subiendo} onClick={() => inputRef.current?.click()}>
        {subiendo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} strokeWidth={1.75} />}
        {subiendo ? "Subiendo…" : "Subir foto"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); e.target.value = ""; }}
      />
    </div>
  );

  if (lista.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--salvia-tint)]">
          <ImageIcon size={28} strokeWidth={1.5} className="text-[var(--salvia)]" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--tinta)]">Sin fotos clínicas</h3>
        <p className="mt-1 max-w-xs text-sm text-[var(--tinta-suave)]">
          Añade fotos para el seguimiento visual (antes/después) del tratamiento.
        </p>
        <div className="mt-4"><span className="inline-flex items-center gap-1.5 text-xs text-[var(--tinta-suave)]"><Camera size={13} /> Etiqueta y sube tu primera foto</span></div>
        <div className="mt-3">{controles}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--tinta-suave)]">{lista.length} foto(s)</p>
        {controles}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {lista.map((foto) => (
          <div key={foto.id} className="group relative aspect-square overflow-hidden rounded-[12px] border border-[var(--lino)] bg-[var(--arena)]">
            {urls[foto.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urls[foto.id]}
                alt={foto.etiqueta ?? "Foto clínica"}
                className="h-full w-full cursor-zoom-in object-cover"
                onClick={() => setZoom(urls[foto.id])}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[var(--salvia)]" /></div>
            )}
            <button
              onClick={() => borrar(foto)}
              className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              aria-label="Eliminar foto"
            >
              <Trash2 size={13} />
            </button>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--tinta)]/70 to-transparent px-2 py-2">
              <p className="text-xs text-white">{formatFecha(foto.tomada_at)}</p>
              {foto.etiqueta && (
                <Badge variant={etiquetaVariant(foto.etiqueta)} className="mt-0.5 text-[10px] capitalize">{foto.etiqueta}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setZoom(null)}>
          <button className="absolute right-4 top-4 text-white/80 hover:text-white" aria-label="Cerrar"><X size={26} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Foto" className="max-h-full max-w-full rounded-[12px] object-contain" />
        </div>
      )}
    </div>
  );
}
