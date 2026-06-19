"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { PLAN_LIST, type PlanKey } from "@/lib/plans";
import { createCheckout } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PricingCards({
  mode = "marketing",
  currentPlan,
}: {
  mode?: "marketing" | "app";
  currentPlan?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanKey | null>(null);

  async function handleSelect(plan: PlanKey) {
    if (mode === "marketing") {
      router.push("/signup");
      return;
    }
    setLoading(plan);
    const res = await createCheckout(plan);
    setLoading(null);
    if (res.error) return toast.error(res.error);
    if (res.url) window.location.href = res.url;
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PLAN_LIST.map((p) => {
        const isCurrent = currentPlan === p.key;
        return (
          <div
            key={p.key}
            className={cn(
              "relative flex flex-col rounded-[16px] border bg-[var(--surface)] p-6 transition-all",
              p.destacado
                ? "border-[var(--brand)] shadow-[var(--shadow-pop)] md:-translate-y-2"
                : "border-[var(--border)] shadow-[var(--shadow-card)]",
            )}
          >
            {p.destacado && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--brand)] px-3 py-1 text-[11px] font-bold text-white">
                <Sparkles size={12} /> Más elegido
              </span>
            )}
            <h3 className="font-display text-lg font-bold text-[var(--text)]">{p.name}</h3>
            <div className="mt-2 flex items-end gap-1">
              <span className="font-display text-4xl font-bold text-[var(--text)]">{p.priceMonth}€</span>
              <span className="mb-1 text-sm text-[var(--text-soft)]">/mes</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-soft)]">
                  <Check size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleSelect(p.key)}
              disabled={loading !== null || isCurrent}
              variant={p.destacado ? "default" : "outline"}
              className="mt-6 w-full"
            >
              {isCurrent ? "Plan actual" : loading === p.key ? "Redirigiendo…" : mode === "marketing" ? "Empezar gratis" : "Elegir plan"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
