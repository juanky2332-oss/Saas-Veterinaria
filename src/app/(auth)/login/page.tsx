"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, PawPrint, Syringe, CalendarDays, MessageCircle } from "lucide-react";

type Modo = "password" | "magic";

const FEATURES = [
  { icon: PawPrint,      text: "Fichas de mascotas completas" },
  { icon: Syringe,       text: "Control de vacunaciones y desparasitaciones" },
  { icon: CalendarDays,  text: "Agenda con recordatorios WhatsApp" },
  { icon: MessageCircle, text: "Agente IA para atención al cliente" },
];

function LoginInner() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [modo, setModo]         = useState<Modo>("password");
  const [magicEnviado, setMagicEnviado] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next   = params.get("next") || "/dashboard";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Credenciales incorrectas. Revisa tu email y contraseña.");
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toast.error("No hemos podido enviar el enlace. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }
    setMagicEnviado(true);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex">
      {/* Panel izquierdo — identidad de marca veterinaria */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #0F3D23 0%, #1A5C37 50%, #2E8B57 100%)" }}>
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #6FB88A, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #D97706, transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/15 backdrop-blur text-white text-xl font-display font-extrabold border border-white/20">
              V
            </span>
            <span className="text-2xl font-display font-extrabold text-white">Veteriblandenguer</span>
          </Link>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-white leading-tight">
              La plataforma que tu veterinaria necesitaba
            </h2>
            <p className="mt-3 text-white/60 text-[15px] leading-relaxed">
              Gestiona mascotas, citas, vacunas y facturación desde un único lugar. Diseñado para clínicas veterinarias en España.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/10 border border-white/15">
                    <Icon size={15} className="text-white/80" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm text-white/75 font-medium">{f.text}</span>
                </div>
              );
            })}
          </div>

          {/* Mini dashboard preview */}
          <div className="rounded-[16px] bg-white/8 border border-white/15 backdrop-blur p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Citas de hoy</p>
            {[
              { hora: "09:30", nombre: "Toby · Perro", estado: "Confirmada" },
              { hora: "11:00", nombre: "Misi · Gato", estado: "En sala" },
              { hora: "12:30", nombre: "Pipo · Loro", estado: "Pendiente" },
            ].map((c) => (
              <div key={c.hora} className="flex items-center gap-2.5 rounded-[8px] bg-white/5 px-3 py-2">
                <span className="text-[11px] font-bold text-white/40 w-9 shrink-0">{c.hora}</span>
                <span className="text-xs text-white/80 flex-1">{c.nombre}</span>
                <span className="text-[10px] font-semibold text-white/50">{c.estado}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <div className="relative z-10">
          <p className="text-white/35 text-xs">Software veterinario · Datos en la UE · RGPD</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-[var(--bg)]">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand)] text-white text-xl font-display font-bold shadow-[var(--shadow-card)]">
              V
            </span>
            <span className="text-2xl font-display font-bold text-[var(--text)]">Veteriblandenguer</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-extrabold text-[var(--text)]">Bienvenido de nuevo</h1>
            <p className="mt-1.5 text-sm text-[var(--text-soft)]">Accede a tu veterinaria y continúa donde lo dejaste.</p>
          </div>

          {/* Toggle modo */}
          <div className="flex rounded-[12px] border border-[var(--border)] overflow-hidden mb-5 bg-[var(--surface)]">
            <button
              onClick={() => { setModo("password"); setMagicEnviado(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors ${
                modo === "password"
                  ? "bg-[var(--brand)] text-white"
                  : "bg-transparent text-[var(--text-soft)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Lock size={13} strokeWidth={2} /> Contraseña
            </button>
            <button
              onClick={() => { setModo("magic"); setMagicEnviado(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors ${
                modo === "magic"
                  ? "bg-[var(--brand)] text-white"
                  : "bg-transparent text-[var(--text-soft)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Mail size={13} strokeWidth={2} /> Enlace mágico
            </button>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            {modo === "password" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@veterinaria.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando…" : "Entrar a mi veterinaria"}
                </Button>
              </form>
            )}

            {modo === "magic" && !magicEnviado && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <p className="text-sm text-[var(--text-soft)]">
                  Te enviamos un enlace a tu correo. Haz clic en él y entrarás directamente, sin contraseña.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="email-magic">Correo electrónico</Label>
                  <Input id="email-magic" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@veterinaria.com" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? "Enviando…" : (<>Enviar enlace mágico <ArrowRight size={14} strokeWidth={2} /></>)}
                </Button>
              </form>
            )}

            {modo === "magic" && magicEnviado && (
              <div className="text-center py-4 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--exito-tint)] mx-auto">
                  <Mail size={24} strokeWidth={1.75} className="text-[var(--exito)]" />
                </div>
                <h3 className="font-display font-bold text-[var(--text)]">Revisa tu correo</h3>
                <p className="text-sm text-[var(--text-soft)]">
                  Hemos enviado un enlace de acceso a{" "}
                  <strong className="text-[var(--text)]">{email}</strong>.
                </p>
                <button onClick={() => { setMagicEnviado(false); setEmail(""); }} className="text-xs text-[var(--brand)] hover:underline">
                  Usar otro correo
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-soft)]">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="font-semibold text-[var(--brand)] hover:underline">
              Prueba gratis 10 días
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
