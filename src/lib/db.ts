import dns from "node:dns";
import net from "node:net";
import { createClient, type Client } from "@libsql/client";
import { initSchema } from "./schema";
import { seedInitialData } from "./seed";

// Force IPv4 priority & disable Happy Eyeballs multi-family probing on Windows networks
// where broken IPv6 routes cause intermittent UND_ERR_CONNECT_TIMEOUT hangs.
dns.setDefaultResultOrder("ipv4first");
if (typeof net.setDefaultAutoSelectFamily === "function") {
  net.setDefaultAutoSelectFamily(false);
}

type GlobalWithDb = typeof globalThis & {
  __vericertClient?: Client;
  __vericertInitPromise?: Promise<void>;
};

const g = globalThis as GlobalWithDb;

export type DbMode = "turso" | "local";

export function getDbMode(): DbMode {
  return process.env.TURSO_DATABASE_URL?.trim() ? "turso" : "local";
}

function normalizeTursoHttpUrl(rawUrl: string): string {
  // Using HTTPS Hrana transport avoids fragile WebSocket handshakes & cold-reconnect stalls
  // while keeping full query, batch, and transaction support against Turso Cloud.
  return rawUrl.replace(/^libsql:\/\//i, "https://");
}

function isRetryableConnectError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const cause = (err as { cause?: { code?: string } }).cause;
  const code = cause?.code || (err as { code?: string }).code;
  return (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EAI_AGAIN"
  );
}

async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (isRetryableConnectError(err)) {
      return await fetch(input, init);
    }
    throw err;
  }
}

export function getDbClient(): Client {
  if (!g.__vericertClient) {
    const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
    if (tursoUrl) {
      g.__vericertClient = createClient({
        url: normalizeTursoHttpUrl(tursoUrl),
        authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
        fetch: resilientFetch,
      });
    } else {
      g.__vericertClient = createClient({
        url: "file:local.db",
      });
    }
  }
  return g.__vericertClient;
}

/**
 * Idempotently initializes tables, indexes, and initial admin/sample seed data.
 * Uses a single fast-path check so already-initialized databases skip DDL/seed round-trips.
 */
export async function ensureDbInitialized(): Promise<Client> {
  const client = getDbClient();
  if (!g.__vericertInitPromise) {
    g.__vericertInitPromise = (async () => {
      try {
        const probe = await client.execute(
          "SELECT COUNT(*) as cnt FROM admins"
        );
        if (Number(probe.rows[0]?.cnt ?? 0) > 0) {
          return;
        }
      } catch {
        // Table does not exist yet; proceed with full schema init & seed.
      }
      await initSchema(client);
      await seedInitialData(client);
    })().catch((err) => {
      g.__vericertInitPromise = undefined;
      throw err;
    });
  }
  await g.__vericertInitPromise;
  return client;
}
