import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../env";

const DEFAULT_DB_FETCH_TIMEOUT_MS = env.DATABASE_FETCH_TIMEOUT_MS ?? 8_000;
const MAX_RETRIES = env.DATABASE_FETCH_MAX_RETRIES ?? 2;
const RETRY_DELAY_MS = env.DATABASE_FETCH_RETRY_DELAY_MS ?? 350;

function getErrorCode(error: unknown): string | undefined {
    if (!(error instanceof Error)) return undefined;
    return (error as NodeJS.ErrnoException).code;
}

function getNestedErrors(error: unknown): unknown[] {
    if (!(error instanceof Error)) return [];

    const nested: unknown[] = [];
    if ("cause" in error && error.cause) {
        nested.push(error.cause);
    }
    if (error instanceof AggregateError) {
        nested.push(...error.errors);
    }
    return nested;
}

function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        const code = getErrorCode(error);
        if (
            code === "ECONNRESET" ||
            code === "ETIMEDOUT" ||
            code === "ECONNREFUSED" ||
            code === "ENETUNREACH" ||
            code === "EHOSTUNREACH"
        ) {
            return true;
        }
        if (
            error instanceof TypeError && msg.includes("fetch")
        ) {
            return true;
        }
        if (
            msg.includes("fetch failed") ||
            msg.includes("network") ||
            msg.includes("timeout") ||
            msg.includes("socket") ||
            msg.includes("connection")
        ) {
            return true;
        }
    }

    for (const nestedError of getNestedErrors(error)) {
        if (isRetryableError(nestedError)) {
            return true;
        }
    }

    return false;
}

async function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const timeoutMs = DEFAULT_DB_FETCH_TIMEOUT_MS;
    const createTimeoutSignal = () => {
        if (typeof AbortSignal?.timeout === "function") {
            return AbortSignal.timeout(timeoutMs);
        }
        const c = new AbortController();
        setTimeout(() => c.abort(), timeoutMs);
        return c.signal;
    };
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const signal = init?.signal ?? createTimeoutSignal();
        try {
            const res = await fetch(input, { ...init, signal });
            if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
                continue;
            }
            return res;
        } catch (err) {
            lastError = err;
            if (attempt < MAX_RETRIES - 1 && isRetryableError(err)) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

function installNeonFetchWrapper() {
    if (neonConfig.fetchFunction) return;
    neonConfig.fetchFunction = fetchWithRetry;
}

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb() {
    if (!cachedDb) {
        installNeonFetchWrapper();
        const sql = neon(env.DATABASE_URL);
        cachedDb = drizzle(sql);
    }

    return cachedDb;
}

// The connection is constructed lazily (on first query), not at module load.
// Next.js imports server modules to collect route metadata at build time,
// even for routes that never execute during the build — eagerly connecting
// here would make the build depend on a reachable DATABASE_URL.
const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop, receiver) {
        return Reflect.get(getDb(), prop, receiver);
    },
});

export default db;
