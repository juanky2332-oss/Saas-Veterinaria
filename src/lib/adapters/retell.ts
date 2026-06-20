/**
 * Adaptador Retell AI (agente de voz). Controlado por RETELL_MODE=mock|live.
 *
 * Flujo semi-automático: la app crea/actualiza el agente de cada clínica vía la
 * API de Retell con el prompt compuesto (base + base de conocimiento de la
 * clínica). El número de teléfono lo aporta Twilio y se vincula al agente.
 * Los webhooks de fin de llamada llegan a /api/webhooks/retell con transcripción
 * y resumen, que guardamos en voice_calls vinculados al paciente por teléfono.
 *
 * Docs: https://docs.retellai.com
 */

export interface SincronizarAgenteInput {
  apiKey: string;
  nombreClinica: string;
  prompt: string;
  vozId: string;
  agentId?: string; // si existe, se actualiza
  webhookUrl?: string;
}

export interface SincronizarAgenteResult {
  agentId: string;
  error?: string;
}

interface RetellAdapter {
  sincronizarAgente(input: SincronizarAgenteInput): Promise<SincronizarAgenteResult>;
}

class MockRetellAdapter implements RetellAdapter {
  async sincronizarAgente(input: SincronizarAgenteInput): Promise<SincronizarAgenteResult> {
    console.info(`[RETELL MOCK] Sincronizar agente de "${input.nombreClinica}" (voz ${input.vozId})`);
    return { agentId: input.agentId || `mock-agent-${Date.now().toString(36)}` };
  }
}

class LiveRetellAdapter implements RetellAdapter {
  private readonly base = "https://api.retellai.com";

  private async call(path: string, apiKey: string, body: unknown): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) data.error = (data.error as string) || `Retell respondió ${res.status}.`;
    return data;
  }

  async sincronizarAgente(input: SincronizarAgenteInput): Promise<SincronizarAgenteResult> {
    if (!input.apiKey) return { agentId: "", error: "Falta la API key de Retell." };
    try {
      // 1) LLM de respuesta con el prompt de la clínica.
      const llm = await this.call("/create-retell-llm", input.apiKey, {
        general_prompt: input.prompt,
        model: "gpt-4o-mini",
      });
      if (llm.error) return { agentId: "", error: String(llm.error) };

      // 2) Agente (voz + LLM + webhook).
      const agent = await this.call("/create-agent", input.apiKey, {
        response_engine: { type: "retell-llm", llm_id: llm.llm_id },
        voice_id: input.vozId,
        agent_name: `Veteriblandenguer · ${input.nombreClinica}`,
        language: "es-ES",
        webhook_url: input.webhookUrl,
      });
      if (agent.error) return { agentId: "", error: String(agent.error) };

      return { agentId: String(agent.agent_id ?? "") };
    } catch (e) {
      return { agentId: "", error: e instanceof Error ? e.message : "Error de red con Retell." };
    }
  }
}

const mode = process.env.RETELL_MODE ?? "mock";
export const retellAdapter: RetellAdapter =
  mode === "live" ? new LiveRetellAdapter() : new MockRetellAdapter();

export function retellModo(): "mock" | "live" {
  return mode === "live" ? "live" : "mock";
}
