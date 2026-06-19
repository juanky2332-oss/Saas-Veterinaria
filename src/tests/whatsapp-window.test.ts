import { describe, it, expect } from "vitest";

// Lógica de ventana 24h WhatsApp
function isVentanaAbierta(ultimaEntradaAt: string | null): boolean {
  if (!ultimaEntradaAt) return false;
  const ahora = Date.now();
  const ultima = new Date(ultimaEntradaAt).getTime();
  return ahora - ultima < 24 * 60 * 60 * 1000;
}

describe("Ventana 24h WhatsApp", () => {
  it("retorna true si el último mensaje entrante fue hace menos de 24h", () => {
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isVentanaAbierta(haceUnaHora)).toBe(true);
  });

  it("retorna false si el último mensaje fue hace más de 24h", () => {
    const hace25h = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isVentanaAbierta(hace25h)).toBe(false);
  });

  it("retorna false si ultima_entrada_at es null", () => {
    expect(isVentanaAbierta(null)).toBe(false);
  });

  it("retorna true si el último mensaje fue exactamente 23:59 antes", () => {
    const hace23h59m = new Date(Date.now() - (24 * 60 * 60 * 1000 - 60 * 1000)).toISOString();
    expect(isVentanaAbierta(hace23h59m)).toBe(true);
  });

  it("retorna false en el límite exacto de 24h (sin holgura)", () => {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1).toISOString();
    expect(isVentanaAbierta(hace24h)).toBe(false);
  });
});
