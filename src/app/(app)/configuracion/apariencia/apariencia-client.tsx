"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, RotateCcw, CalendarDays, Users, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { guardarApariencia, guardarZonaHoraria } from "@/app/actions/apariencia";
import { TIMEZONES } from "@/lib/tz";
import {
  ALL_PRESETS,
  buildThemeFromColors,
  resolveTenantTheme,
  themeToStyle,
  type BrandTheme,
} from "@/lib/theme/themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  orgId: string;
  clinicName: string;
  vertical: string;
  brandColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  timezone: string;
}

export function AparienciaClient({ orgId, clinicName, vertical, brandColor, accentColor, logoUrl: logoInicial, timezone }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tz, setTz] = useState(timezone);
  const [savingTz, setSavingTz] = useState(false);

  async function guardarTz() {
    setSavingTz(true);
    const res = await guardarZonaHoraria(tz);
    setSavingTz(false);
    if (res.error) return toast.error(res.error);
    toast.success("Zona horaria guardada. La agenda ya la usa.");
    router.refresh();
  }

  const porDefecto = resolveTenantTheme({ vertical: vertical as never });
  const [brand, setBrand] = useState(brandColor ?? porDefecto.brand);
  const [accent, setAccent] = useState(accentColor ?? porDefecto.accent);
  const [logoUrl, setLogoUrl] = useState<string | null>(logoInicial);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const tema: BrandTheme = useMemo(
    () => buildThemeFromColors({ primary: brand, accent }),
    [brand, accent],
  );

  function aplicarPreset(p: BrandTheme) {
    setBrand(p.brand);
    setAccent(p.accent);
  }

  async function subirLogo(file: File) {
    setSubiendo(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${orgId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("org-assets").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/png",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("org-assets").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast.success("Logo subido. Recuerda guardar los cambios.");
    } catch {
      toast.error("No se pudo subir el logo.");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    const res = await guardarApariencia({ brand_color: brand, accent_color: accent, logo_path: logoUrl });
    setGuardando(false);
    if (res.error) return toast.error(res.error);
    toast.success("Apariencia guardada. Toda la app usa ya tu nueva identidad.");
    router.refresh();
  }

  async function restaurar() {
    setGuardando(true);
    const res = await guardarApariencia({ brand_color: null, accent_color: null, logo_path: null });
    setGuardando(false);
    if (res.error) return toast.error(res.error);
    setBrand(porDefecto.brand);
    setAccent(porDefecto.accent);
    setLogoUrl(null);
    toast.success("Apariencia restaurada al tema de tu especialidad.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Presets */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display font-semibold text-[var(--text)]">Temas</h2>
          <p className="mt-0.5 mb-4 text-sm text-[var(--text-soft)]">Elige un modelo de partida y ajústalo a tu gusto.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ALL_PRESETS.map((p) => {
              const activo = p.brand.toLowerCase() === brand.toLowerCase() && p.accent.toLowerCase() === accent.toLowerCase();
              return (
                <button
                  key={p.label}
                  onClick={() => aplicarPreset(p)}
                  className={cn(
                    "rounded-[12px] border p-3 text-left transition-all",
                    activo
                      ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/20 bg-[var(--brand-tint)]"
                      : "border-[var(--border)] hover:border-[var(--brand-soft)] hover:bg-[var(--surface-2)]",
                  )}
                >
                  <div className="flex gap-1.5">
                    <span className="h-6 w-6 rounded-full border border-black/5" style={{ background: p.brand }} />
                    <span className="h-6 w-6 rounded-full border border-black/5" style={{ background: p.brandSoft }} />
                    <span className="h-6 w-6 rounded-full border border-black/5" style={{ background: p.accent }} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[var(--text)]">{p.label}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Colores personalizados */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display font-semibold text-[var(--text)]">Colores de tu marca</h2>
          <p className="mt-0.5 mb-4 text-sm text-[var(--text-soft)]">Usa los colores exactos de tu clínica.</p>
          <div className="flex flex-wrap gap-6">
            {[
              { label: "Color primario", value: brand, set: setBrand },
              { label: "Color de acento", value: accent, set: setAccent },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <input
                  type="color"
                  value={c.value}
                  onChange={(e) => c.set(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-[10px] border border-[var(--border)] bg-transparent p-1"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{c.label}</p>
                  <p className="text-xs uppercase tabular-nums text-[var(--text-soft)]">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Logo */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display font-semibold text-[var(--text)]">Logo</h2>
          <p className="mt-0.5 mb-4 text-sm text-[var(--text-soft)]">Se muestra en el menú lateral y en tus facturas. PNG o JPG, idealmente cuadrado.</p>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo de la clínica" className="h-16 w-16 rounded-[14px] border border-[var(--border)] object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-[14px] text-2xl font-display font-bold text-white" style={{ background: brand }}>
                {clinicName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subirLogo(f);
                }}
              />
              <Button variant="outline" size="sm" className="gap-1.5" disabled={subiendo} onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> {subiendo ? "Subiendo…" : logoUrl ? "Cambiar logo" : "Subir logo"}
              </Button>
              {logoUrl && (
                <button onClick={() => setLogoUrl(null)} className="text-left text-xs text-[var(--text-soft)] hover:text-[var(--error)]">
                  Quitar logo
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Zona horaria */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display font-semibold text-[var(--text)]">Zona horaria</h2>
          <p className="mt-0.5 mb-4 text-sm text-[var(--text-soft)]">La agenda muestra y crea las citas en esta zona horaria, sin importar desde dónde se acceda.</p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="h-10 min-w-[260px] rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
            >
              {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button variant="outline" onClick={guardarTz} disabled={savingTz || tz === timezone}>
              {savingTz ? "Guardando…" : "Guardar zona horaria"}
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar apariencia"}
          </Button>
          <Button size="lg" variant="outline" className="gap-1.5" onClick={restaurar} disabled={guardando}>
            <RotateCcw size={15} /> Restaurar tema del sector
          </Button>
        </div>
      </div>

      {/* Vista previa en vivo */}
      <aside>
        <div className="sticky top-6 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-3 font-display font-semibold text-[var(--text)]">Vista previa</h3>
          <div style={themeToStyle(tema)} className="overflow-hidden rounded-[14px] border border-[var(--border)]">
            <div className="flex h-9 items-center gap-2 px-3 text-white" style={{ background: "linear-gradient(135deg, var(--brand-deep), var(--brand-strong))" }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-5 w-5 rounded-[6px] object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white/20 text-[10px] font-bold">
                  {clinicName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate text-xs font-semibold">{clinicName}</span>
            </div>
            <div className="space-y-3 bg-[var(--bg)] p-3">
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-tint)] px-2 py-0.5 text-[10px] font-bold" style={{ color: tema.brandStrong }}>
                  <CalendarDays size={10} /> Cita confirmada
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-tint)] px-2 py-0.5 text-[10px] font-bold" style={{ color: tema.accent }}>
                  <Sparkles size={10} /> Nuevo
                </span>
              </div>
              <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text)]">
                  <Users size={11} style={{ color: tema.brand }} /> Pacientes de hoy
                </p>
                <p className="font-display text-xl font-bold" style={{ color: tema.brand }}>12</p>
              </div>
              <button className="w-full rounded-[9px] px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: tema.brand }}>
                Nueva cita
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--text-soft)]">
            Los cambios se aplican a toda la app de tu clínica al guardar: menús, botones, estados y facturas.
          </p>
        </div>
      </aside>
    </div>
  );
}
