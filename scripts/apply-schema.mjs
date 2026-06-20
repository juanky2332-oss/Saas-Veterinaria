import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Client } = pg;
const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");

const PROJECT_REF = "wpizveklcchglpyaqhjt";
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error("Falta DB_PASSWORD. Usa: $env:DB_PASSWORD='contraseña'; node scripts/apply-schema.mjs");
  process.exit(1);
}

// El proyecto resuelve en IPv6 (AWS eu-west-2 Londres).
// Intentamos pooler (IPv4) en todos los hosts posibles + directo IPv6.
const CONFIGS = [
  // Pooler session mode eu-west-2 (Londres)
  { label: "Pooler eu-west-2 session :5432", host: "aws-0-eu-west-2.pooler.supabase.com",   port: 5432, user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
  // Pooler transaction mode eu-west-2
  { label: "Pooler eu-west-2 txn :6543",     host: "aws-0-eu-west-2.pooler.supabase.com",   port: 6543, user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
  // Pooler eu-west-1 (Irlanda)
  { label: "Pooler eu-west-1 session :5432", host: "aws-0-eu-west-1.pooler.supabase.com",   port: 5432, user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
  { label: "Pooler eu-west-1 txn :6543",     host: "aws-0-eu-west-1.pooler.supabase.com",   port: 6543, user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
  // Pooler eu-central-1
  { label: "Pooler eu-central-1 :5432",      host: "aws-0-eu-central-1.pooler.supabase.com", port: 5432, user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
  // Directo DB (requiere IPv6 en la red local)
  { label: "Directo db host IPv6",            host: `db.${PROJECT_REF}.supabase.co`,          port: 5432, user: "postgres",               password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
  // Pooler us-east-1
  { label: "Pooler us-east-1 :5432",         host: "aws-0-us-east-1.pooler.supabase.com",   port: 5432, user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 },
];

async function tryConnect(config) {
  const c = new Client(config);
  await c.connect();
  return c;
}

const parte1 = readFileSync(join(root, "supabase", "setup_parte1.sql"), "utf8");
const parte2 = readFileSync(join(root, "supabase", "setup_parte2.sql"), "utf8");

let workingConfig = null;

for (const cfg of CONFIGS) {
  process.stdout.write(`Probando ${cfg.label}... `);
  try {
    const c = await tryConnect(cfg);
    await c.end();
    console.log("✓");
    workingConfig = cfg;
    break;
  } catch (e) {
    console.log(`✗ (${e.code ?? e.message.slice(0,60)})`);
  }
}

if (!workingConfig) {
  console.error("\n❌ No se pudo conectar. ¿Es correcta la contraseña? ¿Hay restricciones de red en el proyecto?");
  process.exit(1);
}

console.log(`\nUsando: ${workingConfig.label}\n`);

// ── Parte 1 ──
console.log("▶ Aplicando Parte 1 (extensiones + schema base + enums)...");
{
  const c = await tryConnect(workingConfig);
  try {
    await c.query(parte1);
    console.log("✓ Parte 1 OK");
  } catch (e) {
    // Ignorar errores de "already exists" — son inofensivos
    if (e.message.includes("already exists") || e.message.includes("duplicate")) {
      console.log("✓ Parte 1 OK (algunos objetos ya existían)");
    } else {
      console.error("✗ Error Parte 1:", e.message);
      await c.end();
      process.exit(1);
    }
  }
  await c.end();
}

// Pausa entre partes para que el ENUM se haga commit
console.log("⏳ Esperando commit del ENUM 'owner'...");
await new Promise(r => setTimeout(r, 3000));

// ── Parte 2 ──
console.log("▶ Aplicando Parte 2 (multitenant + RLS + funciones + tablas vet)...");
{
  const c = await tryConnect(workingConfig);
  try {
    await c.query(parte2);
    console.log("✓ Parte 2 OK");
  } catch (e) {
    if (e.message.includes("already exists") || e.message.includes("duplicate")) {
      console.log("✓ Parte 2 OK (algunos objetos ya existían)");
    } else {
      console.error("✗ Error Parte 2:", e.message);
      await c.end();
      process.exit(1);
    }
  }
  await c.end();
}

console.log("\n✅ Schema aplicado. Ve a http://localhost:3000/signup y regístrate.");
