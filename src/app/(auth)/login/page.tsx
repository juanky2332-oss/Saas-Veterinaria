"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";

type Modo = "password" | "magic";

function LoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<Modo>("password");
  const [magicEnviado, setMagicEnviado] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
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
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand)] text-white text-xl font-display font-bold shadow-[var(--shadow-card)]">
              C
            </span>
            <span className="text-2xl font-display font-bold text-[var(--text)]">Clinicomatic</span>
          </Link>
          <p className="mt-3 text-sm text-[var(--text-soft)]">
            Te damos la bienvenida. Accede a tu clínica.
          </p>
        </div>

        <div className="flex rounded-[12px] border border-[var(--border)] overflow-hidden mb-4">
          <button
            onClick={() => { setModo("password"); setMagicEnviado(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
              modo === "password" ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--text-soft)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <Lock size={13} strokeWidth={2} /> Contraseña
          </button>
          <button
            onClick={() => { setModo("magic"); setMagicEnviado(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
              modo === "magic" ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--text-soft)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <Mail size={13} strokeWidth={2} /> Enlace mágico
          </button>
        </div>

        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          {modo === "password" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@clinica.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando…" : "Entrar"}
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
                <Input id="email-magic" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@clinica.com" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Enviando…" : (<>Enviar enlace mágico <ArrowRight size={14} strokeWidth={2} /></>)}
              </Button>
            </form>
          )}

          {modo === "magic" && magicEnviado && (
            <div className="text-center py-4 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--exito-tint)] mx-auto">
                <Mail size={22} strokeWidth={1.75} className="text-[var(--exito)]" />
              </div>
              <h3 className="font-display font-semibold text-[var(--text)]">Revisa tu correo</h3>
              <p className="text-sm text-[var(--text-soft)]">
                Hemos enviado un enlace de acceso a <strong className="text-[var(--text)]">{email}</strong>.
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
            Crea tu clínica
          </Link>
        </p>
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
