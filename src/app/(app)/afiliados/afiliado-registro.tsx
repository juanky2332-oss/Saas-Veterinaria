"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { registrarmeComoAfiliado } from "@/app/actions/afiliados";

export function AfiliadoRegistro({ nombrePorDefecto, emailPorDefecto }: { nombrePorDefecto: string; emailPorDefecto: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(nombrePorDefecto);
  const [email, setEmail] = useState(emailPorDefecto);
  const [metodo, setMetodo] = useState("transferencia");
  const [cuenta, setCuenta] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registrarmeComoAfiliado({ nombre, email, metodo_pago: metodo, cuenta_pago: cuenta });
      if (res.error) { toast.error(res.error); return; }
      toast.success("¡Bienvenido al programa de afiliados!");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--brand-tint)] text-[var(--brand-strong)]"><Handshake size={22} /></span>
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--text)]">Programa de afiliados</h1>
          <p className="text-sm text-[var(--text-soft)]">Recomienda Clinicomatic y gana una comisión recurrente por cada clínica que se suscriba.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { t: "20% recurrente", d: "sobre cada cuota mientras siga activa" },
          { t: "Enlace propio", d: "atribución automática de referidos" },
          { t: "Pagos mensuales", d: "liquidamos tus comisiones cada mes" },
        ].map((x) => (
          <div key={x.t} className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--text)]"><Sparkles size={14} className="text-[var(--brand)]" /> {x.t}</p>
            <p className="mt-0.5 text-xs text-[var(--text-soft)]">{x.d}</p>
          </div>
        ))}
      </div>

      <form onSubmit={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nombre o empresa</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" required />
          </div>
          <div className="space-y-1.5">
            <Label>Email de contacto</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Método de cobro</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transferencia">Transferencia (IBAN)</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{metodo === "paypal" ? "Email de PayPal" : "IBAN"}</Label>
            <Input value={cuenta} onChange={(e) => setCuenta(e.target.value)} placeholder={metodo === "paypal" ? "tu@paypal.com" : "ES00 0000 0000 0000 0000 0000"} />
          </div>
        </div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Dándote de alta…" : "Unirme al programa"}
        </Button>
      </form>
    </div>
  );
}
