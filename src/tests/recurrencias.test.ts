import { describe, it, expect } from "vitest";
import { addMonths, isBefore } from "date-fns";

// Lógica de recurrencia de tratamientos
function calcularProximaRecomendacion(
  ultimaSesion: Date,
  periodicidadMeses: number
): Date {
  return addMonths(ultimaSesion, periodicidadMeses);
}

function esRecomendacionVencida(
  proximaRecomendada: Date | null,
  ahora: Date = new Date()
): boolean {
  if (!proximaRecomendada) return false;
  return isBefore(proximaRecomendada, ahora);
}

describe("Recurrencias de tratamientos", () => {
  it("calcula la próxima sesión correctamente a 6 meses", () => {
    const ultima = new Date(2024, 0, 15); // 15 enero 2024, hora local
    const proxima = calcularProximaRecomendacion(ultima, 6);
    expect(proxima.getFullYear()).toBe(2024);
    expect(proxima.getMonth()).toBe(6); // julio (0-indexado)
    expect(proxima.getDate()).toBe(15);
  });

  it("calcula la próxima sesión a 3 meses", () => {
    const ultima = new Date(2024, 2, 1); // 1 marzo 2024, hora local
    const proxima = calcularProximaRecomendacion(ultima, 3);
    expect(proxima.getFullYear()).toBe(2024);
    expect(proxima.getMonth()).toBe(5); // junio
    expect(proxima.getDate()).toBe(1);
  });

  it("detecta recomendación vencida cuando la fecha ya pasó", () => {
    const proximaPasada = new Date("2023-01-01");
    expect(esRecomendacionVencida(proximaPasada, new Date("2024-01-01"))).toBe(true);
  });

  it("no marca como vencida una cita futura", () => {
    const proximaFutura = new Date("2099-12-31");
    expect(esRecomendacionVencida(proximaFutura)).toBe(false);
  });

  it("retorna false si proxima_recomendada es null", () => {
    expect(esRecomendacionVencida(null)).toBe(false);
  });

  it("calcula correctamente botox cada 6 meses dado el caso real", () => {
    const ultima = new Date("2024-06-04");
    const proxima = calcularProximaRecomendacion(ultima, 6);
    const ahora = new Date("2026-06-04"); // fecha de hoy en el proyecto
    expect(esRecomendacionVencida(proxima, ahora)).toBe(true);
  });
});
