"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBillingPortal } from "@/app/actions/billing";
import { toast } from "sonner";

export function ManageSubscriptionButton({ hasCustomer }: { hasCustomer: boolean }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const r = await createBillingPortal();
    setLoading(false);
    if (r.error) return toast.error(r.error);
    if (r.url) window.location.href = r.url;
  }
  return (
    <Button variant="outline" onClick={go} disabled={loading || !hasCustomer}>
      {loading ? "Abriendo…" : "Gestionar suscripción"}
    </Button>
  );
}
