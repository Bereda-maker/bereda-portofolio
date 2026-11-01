import postgres from 'postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

async function ensureAiResearchSchema(sql: ReturnType<typeof postgres>) {
  await sql`CREATE TABLE IF NOT EXISTS "candidate_profiles" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "headline" text,
    "skills" text[] DEFAULT '{}' NOT NULL,
    "years_experience" integer,
    "work_mode" text,
    "locations" text[] DEFAULT '{}' NOT NULL,
    "portfolio_url" text,
    "github_url" text,
    "projects_summary" text,
    "preferences" text,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS "opportunity_evidence" (
    "id" serial PRIMARY KEY NOT NULL,
    "opportunity_id" integer NOT NULL,
    "source_url" text NOT NULL,
    "source_title" text,
    "publisher" text,
    "excerpt" text,
    "source_type" text DEFAULT 'public_web' NOT NULL,
    "captured_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS "opportunity_matches" (
    "id" serial PRIMARY KEY NOT NULL,
    "opportunity_id" integer NOT NULL,
    "profile_id" integer NOT NULL,
    "score" integer NOT NULL,
    "reasoning" text,
    "matched_skills" text[] DEFAULT '{}' NOT NULL,
    "gaps" text[] DEFAULT '{}' NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS "research_runs" (
    "id" serial PRIMARY KEY NOT NULL,
    "query" text NOT NULL,
    "status" text DEFAULT 'completed' NOT NULL,
    "provider" text DEFAULT 'manual' NOT NULL,
    "result_count" integer DEFAULT 0 NOT NULL,
    "error" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_evidence_opportunity_id_opportunities_id_fk') THEN
      ALTER TABLE "opportunity_evidence" ADD CONSTRAINT "opportunity_evidence_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_matches_opportunity_id_opportunities_id_fk') THEN
      ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_matches_profile_id_candidate_profiles_id_fk') THEN
      ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade;
    END IF;
  END $$`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "opportunity_matches_opportunity_profile_unique" ON "opportunity_matches" USING btree ("opportunity_id", "profile_id")`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin || !isSameOrigin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 500 });

  const client = postgres(url, { max: 1, prepare: false });
  try {
    await ensureAiResearchSchema(client);
    return NextResponse.json({ ok: true, message: 'AI and research schema applied.' });
  } catch (error) {
    console.error('[admin/migrate] Failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Migration failed.' }, { status: 500 });
  } finally {
    await client.end({ timeout: 5 });
  }
}
