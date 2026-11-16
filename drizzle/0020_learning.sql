CREATE TABLE IF NOT EXISTS "learning_experiences" (
  "id" serial PRIMARY KEY NOT NULL, "title" text NOT NULL, "category" text NOT NULL, "organizer" text, "description" text,
  "official_website" text, "registration_url" text, "source_url" text, "mode" text DEFAULT 'ONLINE' NOT NULL,
  "country" text, "city" text, "venue" text, "meeting_url" text, "starts_at" timestamptz, "ends_at" timestamptz,
  "registration_deadline" timestamptz, "timezone" text DEFAULT 'UTC' NOT NULL, "motivation" text, "expected_outcomes" text,
  "skills_to_acquire" text[] DEFAULT '{}' NOT NULL, "personal_goals" text, "priority" text DEFAULT 'MEDIUM' NOT NULL,
  "cost_type" text DEFAULT 'UNKNOWN' NOT NULL, "fee_cents" integer, "scholarship" text, "other_expenses" text,
  "learning_hours" integer, "status" text DEFAULT 'INTERESTED' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "learning_experiences_status_idx" ON "learning_experiences" ("status");
CREATE INDEX IF NOT EXISTS "learning_experiences_dates_idx" ON "learning_experiences" ("starts_at");
CREATE INDEX IF NOT EXISTS "learning_experiences_category_idx" ON "learning_experiences" ("category");
CREATE TABLE IF NOT EXISTS "learning_status_history" (
  "id" serial PRIMARY KEY NOT NULL, "experience_id" integer NOT NULL REFERENCES "learning_experiences"("id") ON DELETE CASCADE,
  "from_status" text, "to_status" text NOT NULL, "note" text, "changed_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "learning_status_history_experience_changed_idx" ON "learning_status_history" ("experience_id", "changed_at");
CREATE TABLE IF NOT EXISTS "learning_reflections" (
  "id" serial PRIMARY KEY NOT NULL, "experience_id" integer NOT NULL UNIQUE REFERENCES "learning_experiences"("id") ON DELETE CASCADE,
  "learned" text, "technical_knowledge" text, "soft_skills" text, "takeaways" text, "challenges" text, "people_met" text,
  "ideas" text, "application_plan" text, "action_items" text, "rating" integer, "notes" text,
  "draft" boolean DEFAULT true NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "learning_skills" (
  "id" serial PRIMARY KEY NOT NULL, "name" text NOT NULL, "normalized_name" text NOT NULL UNIQUE, "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "learning_experience_skills" (
  "id" serial PRIMARY KEY NOT NULL, "experience_id" integer NOT NULL REFERENCES "learning_experiences"("id") ON DELETE CASCADE,
  "skill_id" integer NOT NULL REFERENCES "learning_skills"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL, UNIQUE ("experience_id", "skill_id")
);
CREATE TABLE IF NOT EXISTS "learning_attachments" (
  "id" serial PRIMARY KEY NOT NULL, "experience_id" integer NOT NULL REFERENCES "learning_experiences"("id") ON DELETE CASCADE,
  "label" text NOT NULL, "kind" text DEFAULT 'DOCUMENT' NOT NULL, "url" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "learning_attachments_experience_idx" ON "learning_attachments" ("experience_id");
