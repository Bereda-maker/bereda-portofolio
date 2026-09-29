// Seeds the `projects` table from the PROJECTS array in data/content.ts.
// Idempotent: matches existing rows by `title` and only inserts titles that
// aren't already in the database, so running this multiple times (or after
// adding one new project to data/content.ts) never creates duplicates or
// touches rows you've already edited from the admin dashboard.
//
// This script is plain Node (no ts-node/tsx dependency), so it can't
// `import` lib/schema.ts (TypeScript) directly. It talks to Postgres with
// raw SQL via `postgres` instead, using the same column names as
// lib/schema.ts. If you change that schema, update the SQL below to match.
//
// data/content.ts is also TypeScript; this script reads it as text and
// parses just the PROJECTS array, which is valid JSON in its current
// generated form (double-quoted keys, no trailing commas, no JS
// expressions).
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

async function loadProjectsFromContent() {
  const src = await readFile(new URL('../data/content.ts', import.meta.url), 'utf8');
  const marker = 'export const PROJECTS: Project[] = ';
  const start = src.indexOf(marker);
  if (start === -1) throw new Error('Could not find "PROJECTS" export in data/content.ts');
  const arrayStart = start + marker.length;
  const arrayEnd = src.indexOf('];', arrayStart) + 1;
  if (arrayEnd === 0) throw new Error('Could not find the end of the PROJECTS array in data/content.ts');
  const json = src.slice(arrayStart, arrayEnd);
  try {
    return JSON.parse(json);
  } catch (err) {
    throw new Error(
      `Failed to parse PROJECTS from data/content.ts as JSON (${err instanceof Error ? err.message : err}). ` +
        'If you edited it by hand, make sure it still looks like a plain JSON array (double-quoted keys, no trailing commas, no JS expressions).'
    );
  }
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  const fromContent = await loadProjectsFromContent();
  if (fromContent.length === 0) {
    console.log('No projects found in data/content.ts — nothing to seed.');
  } else {
    const titles = fromContent.map((p) => p.title);
    const existingRows = await sql`select title from projects where title in ${sql(titles)}`;
    const existingTitles = new Set(existingRows.map((r) => r.title));
    const toInsert = fromContent.filter((p) => !existingTitles.has(p.title));

    if (toInsert.length === 0) {
      console.log(`All ${fromContent.length} project(s) from data/content.ts already exist in the database. Nothing to do.`);
    } else {
      for (const p of toInsert) {
        await sql`
          insert into projects (title, category, description, stack, demo, repo)
          values (${p.title}, ${p.category}, ${p.description}, ${sql.array(p.stack)}, ${p.demo}, ${p.repo})
        `;
      }
      console.log(`Inserted ${toInsert.length} project(s): ${toInsert.map((p) => p.title).join(', ')}`);
      if (existingTitles.size > 0) {
        console.log(`Skipped ${existingTitles.size} already-seeded project(s).`);
      }
    }
  }
} catch (err) {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
