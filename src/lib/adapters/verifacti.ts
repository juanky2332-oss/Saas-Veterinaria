/**
 * Adaptador Verifacti (Verifactu + TicketBAI). Controlado por VERIFACTI_MODE=mock|live.
 *
 * Modelo MULTI-NIF (la clave vive en el SaaS, no en el cliente):
 *  · La plataforma tiene UNA clave maestra de gestión de NIFs (vfn_…) →
 *    VERIFACTI_NIFS_API_KEY. Con ella se registran/activan/gestionan NIFs y se
 *    obtiene la clave de facturación (vf_…) de cada uno.
 *  · Cada NIF se da de alta en UN régimen: "verifactu" (territorio común) o
 *    "ticketbai" (País Vasco: araba/bizkaia/gipuzkoa). Su clave vf_ solo sirve
 *    para los endpoints de su régimen (/verifactu/* o /ticketbai/*).
 *  · El cliente nunca introduce ninguna clave.
 *
 * Docs: /docs (Verifactu) · /tb-docs (TicketBAI) · /nifs-docs (gestión de NIFs)
 * Base: https://api.verifacti.com
 */

export type Regimen = "verifactu" | "ticketbai";
export type TerritorioTbai = "araba" | "bizkaia" | "gipuzkoa";

export interface VerifactiLinea {
  base_imponible: string;
  tipo_impositivo: string;
  cuota_repercutida: string;
  descripcion?: string;
}

export interface VerifactiCreatePayload {
  serie: string;
  numero: string;
  fecha_expedicion: string; // DD-MM-YYYY (debe ser la fecha actual)
  tipo_factura: string; // F1, R1..R5
  descripcion: string;
  nif?: string;
  nombre?: string;
  validar_destinatario?: boolean;
  lineas: VerifactiLinea[];
  importe_total: string;
  // Rectificativas (R1..R5)
  tipo_rectificativa?: string; // "S" sustitución | "I" por diferencias
  importe_rectificativa?: string;
  facturas_rectificadas?: { serie?: string; numero: string; fecha_expedicion?: string }[];
}

export interface VerifactiResult {
  estado: string;
  uuid: string;
  url: string;
  qr: string;
  error?: string;
}

/** Datos del NIF de la clínica para registrarlo en Verifacti. */
export interface NifDatos {
  nif: string;
  nombre?: string;
  direccion?: string;
  cp?: string;
  poblacion?: string;
  provincia?: string;
  /** Para TicketBAI: territorio foral. Si se indica, el NIF se registra en TBAI. */
  territorio?: TerritorioTbai;
}

export interface AprovisionarResult {
  nif: string;
  entorno: string;
  regimen: Regimen;
  vfKey: string;
  estado: string;
  error?: string;
}

export interface OpResult {
  ok: boolean;
  data: Record<string, unknown>;
  error?: string;
}

interface VerifactiAdapter {
  // ── Gestión de NIFs (clave maestra vfn_) ──
  aprovisionarNif(datos: NifDatos): Promise<AprovisionarResult>;
  listarNifs(): Promise<OpResult>;
  anadirNif(datos: NifDatos): Promise<OpResult>;
  infoNif(nif: string): Promise<OpResult>;
  modificarNif(nif: string, datos: Partial<NifDatos>): Promise<OpResult>;
  activarNif(nif: string): Promise<OpResult>;
  desactivarNif(nif: string): Promise<OpResult>;
  eliminarNif(nif: string): Promise<OpResult>;
  claveNif(nif: string): Promise<{ vfKey: string; error?: string }>;
  // ── Emisión de facturas (clave vf_ del NIF) ──
  crear(payload: VerifactiCreatePayload, apiKey?: string, regimen?: Regimen): Promise<VerifactiResult>;
  anular(serie: string, numero: string, apiKey?: string, regimen?: Regimen): Promise<{ estado: string; error?: string }>;
  estado(serie: string, numero: string, apiKey?: string, regimen?: Regimen): Promise<{ estado: string; error?: string }>;
}

const MOCK_QR =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function entornoActual(): string {
  return process.env.VERIFACTI_ENTORNO || "sandbox";
}

class MockVerifactiAdapter implements VerifactiAdapter {
  async aprovisionarNif(datos: NifDatos): Promise<AprovisionarResult> {
    return {
      nif: datos.nif,
      entorno: entornoActual(),
      regimen: datos.territorio ? "ticketbai" : "verifactu",
      vfKey: `vf_mock_${datos.nif}`,
      estado: "activo",
    };
  }
  async listarNifs(): Promise<OpResult> { return { ok: true, data: { nifs: [] } }; }
  async anadirNif(datos: NifDatos): Promise<OpResult> { return { ok: true, data: { nif: datos.nif } }; }
  async infoNif(nif: string): Promise<OpResult> { return { ok: true, data: { nif, estado: "activo" } }; }
  async modificarNif(nif: string): Promise<OpResult> { return { ok: true, data: { nif } }; }
  async activarNif(nif: string): Promise<OpResult> { return { ok: true, data: { nif, estado: "activo" } }; }
  async desactivarNif(nif: string): Promise<OpResult> { return { ok: true, data: { nif, estado: "inactivo" } }; }
  async eliminarNif(nif: string): Promise<OpResult> { return { ok: true, data: { nif, eliminado: true } }; }
  async claveNif(nif: string): Promise<{ vfKey: string }> { return { vfKey: `vf_mock_${nif}` }; }
  async crear(payload: VerifactiCreatePayload): Promise<VerifactiResult> {
    const uuid = `mock-${payload.serie}${payload.numero}-${payload.importe_total}`.replace(/[^a-zA-Z0-9-]/g, "");
    return {
      estado: "Correcto",
      uuid,
      url: `https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=MOCK&numserie=${payload.serie}${payload.numero}&importe=${payload.importe_total}`,
      qr: MOCK_QR,
    };
  }
  async anular(): Promise<{ estado: string }> { return { estado: "Anulada" }; }
  async estado(): Promise<{ estado: string }> { return { estado: "Correcto" }; }
}

class LiveVerifactiAdapter implements VerifactiAdapter {
  private readonly base = process.env.VERIFACTI_BASE_URL || "https://api.verifacti.com";
  private readonly envKey = process.env.VERIFACTI_API_KEY || ""; // vf_ de respaldo (testing)
  private readonly nifsKey = process.env.VERIFACTI_NIFS_API_KEY || ""; // vfn_ maestra

  private async req(method: string, path: string, key: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  }

  private nifsManaged(path: string, method: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
    if (!this.nifsKey) {
      return Promise.resolve({ ok: false, status: 0, data: { error: "Falta la clave maestra de gestión de NIFs (VERIFACTI_NIFS_API_KEY, empieza por vfn_)." } });
    }
    return this.req(method, path, this.nifsKey, body);
  }

  private msg(d: Record<string, unknown>, status: number): string {
    return String(d.message ?? d.error ?? `Verifacti respondió ${status}.`);
  }

  async aprovisionarNif(datos: NifDatos): Promise<AprovisionarResult> {
    const entorno = entornoActual();
    const regimen: Regimen = datos.territorio ? "ticketbai" : "verifactu";
    const base: AprovisionarResult = { nif: datos.nif, entorno, regimen, vfKey: "", estado: "error" };
    if (!this.nifsKey) return { ...base, error: "Falta la clave maestra de gestión de NIFs (VERIFACTI_NIFS_API_KEY, empieza por vfn_)." };

    const reg = await this.anadirNif(datos);
    if (!reg.ok && !/ya existe|409|duplicad/i.test(reg.error ?? "")) return { ...base, error: `Registro de NIF: ${reg.error}` };

    const act = await this.activarNif(datos.nif);
    if (!act.ok && !/ya activ|403/i.test(act.error ?? "")) return { ...base, error: `Activación de NIF: ${act.error}` };

    const k = await this.claveNif(datos.nif);
    if (k.error || !k.vfKey) return { ...base, error: k.error ?? "Verifacti no devolvió la clave del NIF." };
    return { ...base, vfKey: k.vfKey, estado: "activo" };
  }

  async listarNifs(): Promise<OpResult> {
    const { ok, status, data } = await this.nifsManaged("/nifs", "GET");
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async anadirNif(datos: NifDatos): Promise<OpResult> {
    const body: Record<string, unknown> = {
      nif: datos.nif, nombre: datos.nombre, direccion: datos.direccion,
      cp: datos.cp, poblacion: datos.poblacion, provincia: datos.provincia,
    };
    if (datos.territorio) body.territorio = datos.territorio; // TicketBAI
    const { ok, status, data } = await this.nifsManaged("/nifs", "POST", body);
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async infoNif(nif: string): Promise<OpResult> {
    const { ok, status, data } = await this.nifsManaged(`/nifs/${entornoActual()}/${encodeURIComponent(nif)}`, "GET");
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async modificarNif(nif: string, datos: Partial<NifDatos>): Promise<OpResult> {
    const { ok, status, data } = await this.nifsManaged(`/nifs/${entornoActual()}/${encodeURIComponent(nif)}`, "PUT", datos);
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async activarNif(nif: string): Promise<OpResult> {
    const { ok, status, data } = await this.nifsManaged(`/nifs/activate/${entornoActual()}/${encodeURIComponent(nif)}`, "PUT");
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async desactivarNif(nif: string): Promise<OpResult> {
    const { ok, status, data } = await this.nifsManaged(`/nifs/${entornoActual()}/${encodeURIComponent(nif)}`, "DELETE");
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async eliminarNif(nif: string): Promise<OpResult> {
    const { ok, status, data } = await this.nifsManaged(`/nifs/${entornoActual()}/${encodeURIComponent(nif)}/permanent`, "DELETE");
    return { ok, data, error: ok ? undefined : this.msg(data, status) };
  }
  async claveNif(nif: string): Promise<{ vfKey: string; error?: string }> {
    const { ok, status, data } = await this.nifsManaged(`/nifs/keys/${entornoActual()}/${encodeURIComponent(nif)}`, "GET");
    if (!ok) return { vfKey: "", error: this.msg(data, status) };
    return { vfKey: String(data.api_key ?? data.apiKey ?? data.key ?? data.vf_key ?? "") };
  }

  async crear(payload: VerifactiCreatePayload, apiKey?: string, regimen: Regimen = "verifactu"): Promise<VerifactiResult> {
    const key = apiKey || this.envKey;
    if (!key) return { estado: "Incorrecto", uuid: "", url: "", qr: "", error: "No hay clave de Verifacti para este NIF." };
    // TicketBAI requiere tipo de operación; lo añadimos por defecto.
    const body: Record<string, unknown> = { ...payload };
    if (regimen === "ticketbai" && body.tipo_operacion === undefined) body.tipo_operacion = "servicios";
    const { ok, status, data } = await this.req("POST", `/${regimen}/create`, key, body);
    if (!ok || data.error) {
      return { estado: "Incorrecto", uuid: "", url: "", qr: "", error: this.msg(data, status) };
    }
    return {
      estado: String(data.estado ?? "Pendiente"),
      uuid: String(data.uuid ?? ""),
      url: String(data.url ?? ""),
      qr: String(data.qr ?? ""),
    };
  }

  async anular(serie: string, numero: string, apiKey?: string, regimen: Regimen = "verifactu"): Promise<{ estado: string; error?: string }> {
    const key = apiKey || this.envKey;
    const { ok, status, data } = await this.req("POST", `/${regimen}/cancel`, key, { serie, numero });
    if (!ok || data.error) return { estado: "Error", error: this.msg(data, status) };
    return { estado: String(data.estado ?? "Anulada") };
  }

  async estado(serie: string, numero: string, apiKey?: string, regimen: Regimen = "verifactu"): Promise<{ estado: string; error?: string }> {
    const key = apiKey || this.envKey;
    const { ok, status, data } = await this.req("POST", `/${regimen}/status`, key, { serie, numero });
    if (!ok || data.error) return { estado: "Desconocido", error: this.msg(data, status) };
    return { estado: String(data.estado ?? "Desconocido") };
  }
}

const mode = process.env.VERIFACTI_MODE ?? "mock";
export const verifactiAdapter: VerifactiAdapter =
  mode === "live" ? new LiveVerifactiAdapter() : new MockVerifactiAdapter();

export function verifactiModo(): "mock" | "live" {
  return mode === "live" ? "live" : "mock";
}

/** Fecha de hoy en formato DD-MM-YYYY (requerido por Verifacti como fecha de expedición). */
export function fechaExpedicionHoy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}
