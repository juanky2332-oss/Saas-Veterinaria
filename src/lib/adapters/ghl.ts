/**
 * Adaptador GoHighLevel API v2
 * Controlado por GHL_MODE=mock|live
 */

export interface GhlStage {
  id: string;
  name: string;
  pipelineId: string;
}

export interface GhlPipeline {
  id: string;
  name: string;
  stages: GhlStage[];
}

export interface GhlOpportunity {
  id: string;
  name: string;
  stageId: string;
  contactName: string;
  phone?: string;
  email?: string;
  monetaryValue?: number;
  source?: string;
}

interface GhlAdapter {
  getPipelines(): Promise<GhlPipeline[]>;
  updateOpportunityStage(opportunityId: string, stageId: string): Promise<boolean>;
  getOpportunity(opportunityId: string): Promise<GhlOpportunity | null>;
}

class MockGhlAdapter implements GhlAdapter {
  getPipelines(): Promise<GhlPipeline[]> {
    return Promise.resolve([
      {
        id: "ghl_pipe_esse_001",
        name: "Pipeline Principal",
        stages: [
          { id: "ghl_stage_001", name: "Nuevo Lead", pipelineId: "ghl_pipe_esse_001" },
          { id: "ghl_stage_002", name: "Contactado", pipelineId: "ghl_pipe_esse_001" },
          { id: "ghl_stage_003", name: "Consulta Agendada", pipelineId: "ghl_pipe_esse_001" },
          { id: "ghl_stage_004", name: "Primera Cita", pipelineId: "ghl_pipe_esse_001" },
          { id: "ghl_stage_005", name: "Paciente Activa", pipelineId: "ghl_pipe_esse_001" },
          { id: "ghl_stage_006", name: "Perdido", pipelineId: "ghl_pipe_esse_001" },
        ],
      },
    ]);
  }

  updateOpportunityStage(opportunityId: string, stageId: string): Promise<boolean> {
    console.info(`[GHL MOCK] Move opportunity ${opportunityId} to stage ${stageId}`);
    return Promise.resolve(true);
  }

  getOpportunity(opportunityId: string): Promise<GhlOpportunity | null> {
    console.info(`[GHL MOCK] Get opportunity ${opportunityId}`);
    return Promise.resolve({
      id: opportunityId,
      name: "Mock Oportunidad",
      stageId: "ghl_stage_001",
      contactName: "Nombre Mock",
      phone: "+34 600 000 000",
    });
  }
}

class LiveGhlAdapter implements GhlAdapter {
  private readonly apiKey = process.env.GHL_API_KEY!;
  private readonly locationId = process.env.GHL_LOCATION_ID!;
  private readonly base = "https://services.leadconnectorhq.com";

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
    };
  }

  async getPipelines(): Promise<GhlPipeline[]> {
    const res = await fetch(
      `${this.base}/opportunities/pipelines?locationId=${this.locationId}`,
      { headers: this.headers() }
    );
    if (!res.ok) return [];
    const data = await res.json() as { pipelines?: { id: string; name: string; stages?: { id: string; name: string }[] }[] };
    return (data.pipelines ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      stages: (p.stages ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        pipelineId: p.id,
      })),
    }));
  }

  async updateOpportunityStage(opportunityId: string, stageId: string): Promise<boolean> {
    const res = await fetch(`${this.base}/opportunities/${opportunityId}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({ stageId }),
    });
    return res.ok;
  }

  async getOpportunity(opportunityId: string): Promise<GhlOpportunity | null> {
    const res = await fetch(`${this.base}/opportunities/${opportunityId}`, {
      headers: this.headers(),
    });
    if (!res.ok) return null;
    const d = await res.json() as { opportunity?: { id: string; name: string; stageId: string; contact?: { name: string; phone?: string; email?: string }; monetaryValue?: number; source?: string } };
    const opp = d.opportunity;
    if (!opp) return null;
    return {
      id: opp.id,
      name: opp.name,
      stageId: opp.stageId,
      contactName: opp.contact?.name ?? opp.name,
      phone: opp.contact?.phone,
      email: opp.contact?.email,
      monetaryValue: opp.monetaryValue,
      source: opp.source,
    };
  }
}

const mode = process.env.GHL_MODE ?? "mock";
export const ghlAdapter: GhlAdapter =
  mode === "live" ? new LiveGhlAdapter() : new MockGhlAdapter();
