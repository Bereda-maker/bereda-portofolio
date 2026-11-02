// Server-only module. This file is never imported from a 'use client'
// component — only from Server Components, Route Handlers, and scripts/*.
// (We intentionally didn't add the `server-only` package since it wasn't
// part of the step-1 install list; `postgres` itself uses Node APIs that
// fail to bundle for the browser, which gives the same protection.)
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// `prepare: false` is required for connection poolers (e.g. Railway's
// PgBouncer-style proxy, Supabase pooler, etc.) that don't support
// prepared statements. Safe to keep even against a plain Postgres instance.
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  }
  // Keep the pool deliberately small for serverless deployments. The previous
  // default pool could open many connections across concurrent cold starts,
  // exhausting a small hosted Postgres instance and making refreshes appear
  // intermittently disconnected.
  const client = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 300,
  });
  return drizzle(client, { schema });
}

// Cache the client on `globalThis` so Next.js dev-mode hot reloads (which
// re-run this module) reuse the same connection pool instead of opening a
// new one on every edit.
const g = globalThis as unknown as { __db?: ReturnType<typeof createClient> };

export const db = g.__db ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  g.__db = db;
}
