/**
 * Adaptador Holded (facturación)
 * Controlado por HOLDED_MODE=mock|live
 * La app NO genera facturas; emite billing-events que n8n convierte en facturas en Holded
 */

export interface BillingEvent {
  patientId: string;
  appointmentId: string;
  treatmentName: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface BillingEventResult {
  success: boolean;
  holdedInvoiceId?: string;
  error?: string;
}

interface HoldedAdapter {
  emitBillingEvent(event: BillingEvent): Promise<BillingEventResult>;
}

class MockHoldedAdapter implements HoldedAdapter {
  emitBillingEvent(event: BillingEvent): Promise<BillingEventResult> {
    console.info(`[HOLDED MOCK] Billing event: ${event.treatmentName} — ${event.amount}€`);
    return Promise.resolve({
      success: true,
      holdedInvoiceId: `mock_inv_${Date.now()}`,
    });
  }
}

class LiveHoldedAdapter implements HoldedAdapter {
  // Holded no recibe directamente desde la app — el evento queda en cola para n8n
  async emitBillingEvent(event: BillingEvent): Promise<BillingEventResult> {
    // En producción: llamar al webhook de n8n que crea la factura en Holded
    const n8nBase = process.env.N8N_WEBHOOK_BASE;
    if (!n8nBase) return { success: false, error: "N8N_WEBHOOK_BASE no configurado" };

    const res = await fetch(`${n8nBase}/webhook/billing-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.N8N_API_KEY ?? "",
      },
      body: JSON.stringify(event),
    });
    if (!res.ok) return { success: false, error: await res.text() };
    const data = await res.json() as { holdedInvoiceId?: string };
    return { success: true, holdedInvoiceId: data.holdedInvoiceId };
  }
}

const mode = process.env.HOLDED_MODE ?? "mock";
export const holdedAdapter: HoldedAdapter =
  mode === "live" ? new LiveHoldedAdapter() : new MockHoldedAdapter();
