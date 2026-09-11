import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import httpDb from "./index";
import { env } from "../env";
import * as schema from "./schema";

let isWebSocketConfigured = false;

function createServerlessDb(pool: Pool) {
  return drizzle({ client: pool, schema });
}

type ServerlessDb = ReturnType<typeof createServerlessDb>;
type TransactionCallback = Parameters<ServerlessDb["transaction"]>[0];

export type ServerlessTransaction =
  TransactionCallback extends (tx: infer T) => Promise<unknown> ? T : never;

export type DbExecutor = typeof httpDb | ServerlessTransaction;

async function resolveWebSocketConstructor() {
  if (typeof globalThis.WebSocket === "function") {
    return globalThis.WebSocket;
  }

  const moduleName = "next/dist/compiled/ws";
  const wsModule = (await import(moduleName)) as {
    default?: unknown;
    WebSocket?: unknown;
  };
  const constructorCandidate =
    wsModule.WebSocket ?? wsModule.default ?? wsModule;

  if (typeof constructorCandidate !== "function") {
    throw new Error("Unable to resolve a WebSocket constructor for Neon serverless");
  }

  return constructorCandidate as typeof globalThis.WebSocket;
}

async function ensureWebSocketConstructor() {
  if (isWebSocketConfigured || neonConfig.webSocketConstructor) {
    isWebSocketConfigured = true;
    return;
  }

  neonConfig.webSocketConstructor = await resolveWebSocketConstructor();
  isWebSocketConfigured = true;
}

export async function withTransaction<T>(
  callback: (tx: ServerlessTransaction) => Promise<T>,
): Promise<T> {
  await ensureWebSocketConstructor();

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });
  const db = createServerlessDb(pool);

  try {
    return await db.transaction(callback);
  } finally {
    await pool.end();
  }
}
