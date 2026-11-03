ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "content" jsonb NOT NULL DEFAULT '{}'::jsonb;
