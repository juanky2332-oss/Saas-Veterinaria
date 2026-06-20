/**
 * RUTA TEMPORAL DE SETUP — Eliminar tras aplicar el schema.
 * Llama a POST http://localhost:3000/api/setup-db con el header X-Setup-Key: veteriblandenguer-setup
 */
import { NextRequest, NextResponse } from "next/server";
import pg from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const { Client } = pg;

const SETUP_KEY  = "veteriblandenguer-setup";
const DB_PASS    = "Blusita.2026";
const PROJECT    = "wpizveklcchglpyaqhjt";

const CONFIGS = [
  // Conexión directa (IPv6)
  { host: `db.${PROJECT}.supabase.co`, port: 5432, user: "postgres", password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
  // Pooler eu-west-2 session
  { host: "aws-0-eu-west-2.pooler.supabase.com", port: 5432, user: `postgres.${PROJECT}`, password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
  // Pooler eu-west-2 txn
  { host: "aws-0-eu-west-2.pooler.supabase.com", port: 6543, user: `postgres.${PROJECT}`, password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
  // Pooler eu-west-1
  { host: "aws-0-eu-west-1.pooler.supabase.com", port: 5432, user: `postgres.${PROJECT}`, password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
  { host: "aws-0-eu-west-1.pooler.supabase.com", port: 6543, user: `postgres.${PROJECT}`, password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
  // Pooler eu-central-1
  { host: "aws-0-eu-central-1.pooler.supabase.com", port: 5432, user: `postgres.${PROJECT}`, password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
  // Pooler us-east-1
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 5432, user: `postgres.${PROJECT}`, password: DB_PASS, database: "postgres", ssl: { rejectUnauthorized: false } },
];

async function tryConnect(config: object) {
  const c = new Client({ ...config, connectionTimeoutMillis: 10000 });
  await c.connect();
  return c;
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-key") !== SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const root   = process.cwd();
  const parte1 = readFileSync(join(root, "supabase", "setup_parte1.sql"), "utf8");
  const parte2 = readFileSync(join(root, "supabase", "setup_parte2.sql"), "utf8");

  const log: string[] = [];

  // Encontrar conexión que funcione
  let workingConfig = null;
  for (const cfg of CONFIGS) {
    try {
      const c = await tryConnect(cfg);
      await c.end();
      workingConfig = cfg;
      log.push(`✓ Conectado a ${(cfg as any).host}:${(cfg as any).port}`);
      break;
    } catch (e: any) {
      log.push(`✗ ${(cfg as any).host}:${(cfg as any).port} → ${e.message.slice(0, 80)}`);
    }
  }

  if (!workingConfig) {
    return NextResponse.json({ error: "No se pudo conectar a la BD", log }, { status: 500 });
  }

  // Parte 1
  try {
    const c = await tryConnect(workingConfig);
    await c.query(parte1);
    await c.end();
    log.push("✓ Parte 1 (schema base + enums) aplicada");
  } catch (e: any) {
    if (!e.message.includes("already exists") && !e.message.includes("duplicate")) {
      return NextResponse.json({ error: `Error Parte 1: ${e.message}`, log }, { status: 500 });
    }
    log.push("✓ Parte 1 OK (algunos objetos ya existían)");
  }

  // Pausa para commit del ENUM
  await new Promise(r => setTimeout(r, 3000));

  // Parte 2
  try {
    const c = await tryConnect(workingConfig);
    await c.query(parte2);
    await c.end();
    log.push("✓ Parte 2 (multitenant + RLS + tablas vet) aplicada");
  } catch (e: any) {
    if (!e.message.includes("already exists") && !e.message.includes("duplicate")) {
      return NextResponse.json({ error: `Error Parte 2: ${e.message}`, log }, { status: 500 });
    }
    log.push("✓ Parte 2 OK (algunos objetos ya existían)");
  }

  log.push("✅ Schema completo. Ve a /signup.");
  return NextResponse.json({ ok: true, log });
}
