// Applies pending SQL migrations from ./drizzle to the database at
// DATABASE_URL. Run after `npm run db:generate`. Safe to run repeatedly —
// Drizzle tracks which migrations have already been applied.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

try {
  console.log('Applying migrations from ./drizzle ...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
