ALTER TABLE "hackathons"
  ADD COLUMN IF NOT EXISTS "detailed_description" text,
  ADD COLUMN IF NOT EXISTS "country" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "venue" text,
  ADD COLUMN IF NOT EXISTS "timezone" text,
  ADD COLUMN IF NOT EXISTS "first_prize" text,
  ADD COLUMN IF NOT EXISTS "other_prizes" text,
  ADD COLUMN IF NOT EXISTS "total_prize_pool" text,
  ADD COLUMN IF NOT EXISTS "mentorship" text,
  ADD COLUMN IF NOT EXISTS "benefits" text,
  ADD COLUMN IF NOT EXISTS "team_size" text,
  ADD COLUMN IF NOT EXISTS "experience_level" text,
  ADD COLUMN IF NOT EXISTS "technologies" text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "required_skills" text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "source_url" text,
  ADD COLUMN IF NOT EXISTS "origin_type" text NOT NULL DEFAULT 'AUTOMATED',
  ADD COLUMN IF NOT EXISTS "entry_status" text NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN IF NOT EXISTS "startup_profile_id" integer REFERENCES "hackathon_startup_profiles"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "personal_notes" text,
  ADD COLUMN IF NOT EXISTS "why_interesting" text,
  ADD COLUMN IF NOT EXISTS "priority" text NOT NULL DEFAULT 'MEDIUM';
CREATE INDEX IF NOT EXISTS "hackathons_origin_type_idx" ON "hackathons" ("origin_type");
CREATE INDEX IF NOT EXISTS "hackathons_entry_status_idx" ON "hackathons" ("entry_status");
