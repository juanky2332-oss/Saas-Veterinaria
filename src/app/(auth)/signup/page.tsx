"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PawPrint, Check, Star, Eye, EyeOff } from "lucide-react";

const PERKS = [
  "Agenda y citas online desde el día 1",
  "Fichas de mascotas con historial completo",
  "Recordatorios automáticos por WhatsApp",
  "Facturación integrada sin complicaciones",
];

export default function SignupPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const router  = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);

    // Crear usuario con email pre-confirmado (sin necesidad de clic en email)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    // Login inmediato tras crear la cuenta
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      toast.error("Cuenta creada pero no se pudo iniciar sesión. Intenta entrar manualmente.");
      router.push("/login");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #0F3D23 0%, #1A5C37 50%, #2E8B57 100%)" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #6FB88A, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #D97706, transparent)", transform: "translate(-30%, 30%)" }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/15 backdrop-blur border border-white/20">
              <PawPrint size={22} className="text-white" strokeWidth={2} />
            </span>
            <span className="text-2xl font-display font-extrabold text-white">Veteriblandenguer</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-white leading-tight">
              10 días gratis para descubrir todo lo que puedes hacer
            </h2>
            <p className="mt-3 text-white/60 text-[15px] leading-relaxed">
              Sin tarjeta, sin complicaciones. Configura tu veterinaria en minutos.
            </p>
          </div>

          <div className="space-y-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2E8B57]/60 border border-white/20">
                  <Check size={13} className="text-white" strokeWidth={2.5} />
                </span>
                <span className="text-sm text-white/75 font-medium">{p}</span>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] bg-white/8 border border-white/15 p-5">
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} fill="currentColor" className="text-[#D97706]" />
              ))}
            </div>
            <p className="text-sm text-white/70 leading-relaxed italic">
              &ldquo;Llevamos dos meses y los recordatorios de WhatsApp han eliminado casi todas las ausencias. Muy fácil de usar.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-white/50">— Clínica Veterinaria Sur</p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/35 text-xs">Software veterinario · Datos en la UE · RGPD</p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand)] text-white shadow-[var(--shadow-card)]">
              <PawPrint size={20} strokeWidth={2} />
            </span>
            <span className="text-2xl font-display font-bold text-[var(--text)]">Veteriblandenguer</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-tint)] px-3 py-1 text-xs font-bold text-[var(--brand-strong)] mb-3">
              <PawPrint size={12} /> 10 días gratis · sin tarjeta
            </span>
            <h1 className="font-display text-2xl font-extrabold text-[var(--text)]">Crea tu veterinaria</h1>
            <p className="mt-1.5 text-sm text-[var(--text-soft)]">Empieza gratis hoy. Acceso inmediato, sin confirmar email.</p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@veterinaria.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-soft)] transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando tu veterinaria…" : "Crear cuenta gratis →"}
              </Button>
              <p className="text-center text-xs text-[var(--text-soft)]">
                Al continuar aceptas los términos y la política de privacidad.
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-soft)]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
