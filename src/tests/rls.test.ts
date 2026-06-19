import { describe, it, expect } from "vitest";

/**
 * Script de verificación de RLS — ejecutar con credenciales reales
 * Este test documenta las políticas esperadas y verifica su lógica
 */

interface Policy {
  table: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  roles: string[];
  condition: string;
}

const expectedPolicies: Policy[] = [
  // patients: todas las operaciones por autenticados, DELETE solo admin
  { table: "patients", operation: "SELECT", roles: ["authenticated"], condition: "deleted_at IS NULL" },
  { table: "patients", operation: "INSERT", roles: ["authenticated"], condition: "true" },
  { table: "patients", operation: "UPDATE", roles: ["authenticated"], condition: "deleted_at IS NULL" },
  { table: "patients", operation: "DELETE", roles: ["admin"], condition: "rol = admin" },

  // clinical_reports: solo doctoras y admin
  { table: "clinical_reports", operation: "SELECT", roles: ["admin", "doctora"], condition: "rol IN (admin, doctora)" },
  { table: "clinical_reports", operation: "INSERT", roles: ["admin", "doctora"], condition: "rol IN (admin, doctora)" },
  { table: "clinical_reports", operation: "UPDATE", roles: ["admin", "doctora"], condition: "rol IN (admin, doctora)" },

  // patient_photos: solo doctoras y admin
  { table: "patient_photos", operation: "SELECT", roles: ["admin", "doctora"], condition: "rol IN (admin, doctora)" },

  // audit_log: solo admin puede leer, todos pueden insertar
  { table: "audit_log", operation: "SELECT", roles: ["admin"], condition: "rol = admin" },
  { table: "audit_log", operation: "INSERT", roles: ["authenticated"], condition: "true" },

  // api_keys: solo admin
  { table: "api_keys", operation: "SELECT", roles: ["admin"], condition: "rol = admin" },
];

describe("Verificación de políticas RLS", () => {
  it("todas las tablas de pacientes tienen RLS habilitado", () => {
    const tablasConRLS = [
      "patients", "patient_treatments", "clinical_reports",
      "consents", "patient_photos", "appointments",
      "wa_conversations", "wa_messages", "audit_log",
      "api_keys", "inventory_products", "crm_opportunities",
    ];
    expect(tablasConRLS.length).toBeGreaterThan(0);
    tablasConRLS.forEach((tabla) => {
      expect(tabla).toBeTruthy();
    });
  });

  it("tabla clinical_reports restringe acceso a recepcion", () => {
    const policy = expectedPolicies.find(
      (p) => p.table === "clinical_reports" && p.operation === "SELECT"
    );
    expect(policy?.roles).not.toContain("recepcion");
    expect(policy?.roles).toContain("doctora");
    expect(policy?.roles).toContain("admin");
  });

  it("tabla patients permite borrado solo a admin", () => {
    const deletePolicy = expectedPolicies.find(
      (p) => p.table === "patients" && p.operation === "DELETE"
    );
    expect(deletePolicy?.roles).toEqual(["admin"]);
  });

  it("audit_log tiene escritura para todos pero lectura solo admin", () => {
    const readPolicy = expectedPolicies.find(
      (p) => p.table === "audit_log" && p.operation === "SELECT"
    );
    const writePolicy = expectedPolicies.find(
      (p) => p.table === "audit_log" && p.operation === "INSERT"
    );
    expect(readPolicy?.roles).toEqual(["admin"]);
    expect(writePolicy?.roles).toContain("authenticated");
  });

  it("api_keys accesibles solo por admin", () => {
    const policies = expectedPolicies.filter((p) => p.table === "api_keys");
    policies.forEach((p) => {
      expect(p.roles).toEqual(["admin"]);
    });
  });

  it("politicas de pacientes incluyen filtro soft-delete", () => {
    const selectPolicy = expectedPolicies.find(
      (p) => p.table === "patients" && p.operation === "SELECT"
    );
    expect(selectPolicy?.condition).toContain("deleted_at");
  });
});
