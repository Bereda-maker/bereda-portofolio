// Applies pending SQL migrations from ./drizzle to the database at
// DATABASE_URL. Run after `npm run db:generate`. Safe to run repeatedly —
// Drizzle tracks which migrations have already been applied.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

const knownExistingMigrations = [
  ['0000_lovely_stepford_cuckoos', 1793091041410],
  ['0001_legal_nehzno', 1793091143858],
  ['0002_messy_ben_urich', 1793522830845],
  ['0003_stable_calendar_connection', 1793560000000],
];

async function baselineExistingDatabase() {
  await client`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await client`CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" serial PRIMARY KEY NOT NULL,
    "hash" text NOT NULL,
    "created_at" bigint
  )`;

  const [{ count }] = await client`
    SELECT count(*)::int AS count
    FROM "drizzle"."__drizzle_migrations"
  `;
  const [{ exists: hasExistingSchema }] = await client`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'applications'
    ) AS exists
  `;

  if (Number(count) !== 0 || !hasExistingSchema) return;

  console.log('Existing schema detected with empty migration history; creating a safe baseline.');
  for (const [tag, createdAt] of knownExistingMigrations) {
    const sql = await readFile(resolve('drizzle', `${tag}.sql`));
    const hash = createHash('sha256').update(sql).digest('hex');
    await client`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${hash}, ${createdAt})
    `;
  }
  console.log('Baseline recorded through migration 0003.');
}

try {
  await baselineExistingDatabase();
  console.log('Applying migrations from ./drizzle ...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
