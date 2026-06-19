"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (error) {
      toast.error(error.message.includes("registered") ? "Ese correo ya tiene cuenta. Inicia sesión." : "No se pudo crear la cuenta. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }
    // Si la confirmación de email está desactivada, hay sesión inmediata → onboarding
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }
    setEnviado(true);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand)] text-white text-xl font-display font-bold shadow-[var(--shadow-card)]">
              C
            </span>
            <span className="text-2xl font-display font-bold text-[var(--text)]">Clinicomatic</span>
          </Link>
          <p className="mt-3 text-sm text-[var(--text-soft)]">
            Empieza gratis. 14 días de prueba, sin tarjeta.
          </p>
        </div>

        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          {!enviado ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@clinica.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando cuenta…" : "Crear cuenta"}
              </Button>
              <p className="text-center text-xs text-[var(--text-soft)]">
                Al continuar aceptas los términos y la política de privacidad.
              </p>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--exito-tint)] mx-auto">
                <CheckCircle2 size={22} strokeWidth={1.75} className="text-[var(--exito)]" />
              </div>
              <h3 className="font-display font-semibold text-[var(--text)]">Confirma tu correo</h3>
              <p className="text-sm text-[var(--text-soft)] flex items-center justify-center gap-1.5">
                <Mail size={14} /> Te hemos enviado un enlace a <strong className="text-[var(--text)]">{email}</strong>.
              </p>
              <p className="text-xs text-[var(--text-soft)]">Haz clic en él para activar tu cuenta y crear tu clínica.</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--text-soft)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
