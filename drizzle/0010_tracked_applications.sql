CREATE TABLE IF NOT EXISTS "tracked_applications" (
  "id" serial PRIMARY KEY NOT NULL,
  "opportunity_id" integer NOT NULL UNIQUE REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'applied',
  "applied_at" timestamp with time zone NOT NULL DEFAULT now(),
  "notes" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "tracked_applications_status_idx" ON "tracked_applications" ("status");
CREATE INDEX IF NOT EXISTS "tracked_applications_applied_at_idx" ON "tracked_applications" ("applied_at");
