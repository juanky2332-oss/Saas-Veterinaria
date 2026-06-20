import { NextResponse } from "next/server";

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Veteriblandenguer API",
    version: "1.0.0",
    description: "API pública de Veteriblandenguer. Autenticación con Bearer token (API key).",
    contact: { name: "Flownexion", email: "hola@flownexion.com" },
  },
  servers: [{ url: "/api/public/v1" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "API Key" },
    },
  },
  paths: {
    "/patients": {
      get: {
        summary: "Listar pacientes",
        description: "Scope requerido: patients:read",
        parameters: [
          { name: "telefono", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "Lista de pacientes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { type: "object" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/appointments": {
      get: {
        summary: "Listar citas",
        description: "Scope requerido: appointments:read",
        parameters: [{ name: "fecha", in: "query", schema: { type: "string", format: "date" } }],
        responses: { "200": { description: "Lista de citas" } },
      },
      post: {
        summary: "Crear cita",
        description: "Scope requerido: appointments:write. Usado por el widget de reservas.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["doctora_id", "inicio", "fin"],
                properties: {
                  patient_id: { type: "string", format: "uuid" },
                  telefono: { type: "string" },
                  treatment_id: { type: "string", format: "uuid" },
                  doctora_id: { type: "string", format: "uuid" },
                  sala: { type: "integer", minimum: 1, maximum: 3 },
                  inicio: { type: "string", format: "date-time" },
                  fin: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Cita creada" } },
      },
    },
    "/billing-events": {
      post: {
        summary: "Emitir evento de facturación",
        description: "Scope requerido: billing:write. Consumed by n8n to create invoices in Holded.",
        responses: { "201": { description: "Evento registrado" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openapi);
}
