import { describe, it, expect } from "vitest";

interface Producto {
  id: string;
  nombre: string;
  unidades: number;
  umbral_alerta: number;
}

function productosConStockBajo(productos: Producto[]): Producto[] {
  return productos.filter((p) => p.unidades <= p.umbral_alerta);
}

function necesitaAlerta(producto: Producto): boolean {
  return producto.unidades <= producto.umbral_alerta;
}

describe("Alertas de stock", () => {
  const productos: Producto[] = [
    { id: "1", nombre: "Botox Azzalure", unidades: 2, umbral_alerta: 3 },
    { id: "2", nombre: "Ácido Hialurónico", unidades: 10, umbral_alerta: 4 },
    { id: "3", nombre: "PRP Kit", unidades: 3, umbral_alerta: 3 },
    { id: "4", nombre: "Agujas 30G", unidades: 0, umbral_alerta: 5 },
  ];

  it("detecta productos con stock exactamente en el umbral", () => {
    const bajos = productosConStockBajo(productos);
    expect(bajos.map((p) => p.id)).toContain("3");
  });

  it("detecta productos por debajo del umbral", () => {
    const bajos = productosConStockBajo(productos);
    expect(bajos.map((p) => p.id)).toContain("1");
    expect(bajos.map((p) => p.id)).toContain("4");
  });

  it("no detecta productos por encima del umbral", () => {
    const bajos = productosConStockBajo(productos);
    expect(bajos.map((p) => p.id)).not.toContain("2");
  });

  it("retorna array vacío si todos tienen stock suficiente", () => {
    const ok: Producto[] = [
      { id: "1", nombre: "A", unidades: 10, umbral_alerta: 5 },
      { id: "2", nombre: "B", unidades: 6, umbral_alerta: 5 },
    ];
    expect(productosConStockBajo(ok)).toHaveLength(0);
  });

  it("necesitaAlerta es true cuando unidades === 0", () => {
    expect(necesitaAlerta({ id: "x", nombre: "x", unidades: 0, umbral_alerta: 5 })).toBe(true);
  });
});
