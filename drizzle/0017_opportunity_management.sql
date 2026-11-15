ALTER TABLE "opportunities"
  ADD COLUMN IF NOT EXISTS "origin_type" text NOT NULL DEFAULT 'AUTOMATED',
  ADD COLUMN IF NOT EXISTS "company_name" text,
  ADD COLUMN IF NOT EXISTS "source_platform" text,
  ADD COLUMN IF NOT EXISTS "discovered_at" timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "original_listing_url" text,
  ADD COLUMN IF NOT EXISTS "application_url" text,
  ADD COLUMN IF NOT EXISTS "requirements" text,
  ADD COLUMN IF NOT EXISTS "experience_level" text,
  ADD COLUMN IF NOT EXISTS "salary_range" text,
  ADD COLUMN IF NOT EXISTS "currency" text,
  ADD COLUMN IF NOT EXISTS "application_deadline" date;

CREATE INDEX IF NOT EXISTS "opportunities_origin_type_idx" ON "opportunities" ("origin_type");
CREATE INDEX IF NOT EXISTS "opportunities_source_platform_idx" ON "opportunities" ("source_platform");

UPDATE "opportunities" o
SET "discovered_at" = o."created_at",
    "company_name" = COALESCE(o."company_name", (
      SELECT e."publisher" FROM "opportunity_evidence" e
      WHERE e."opportunity_id" = o."id" AND e."publisher" IS NOT NULL
      ORDER BY e."captured_at" DESC LIMIT 1
    )),
    "source_platform" = COALESCE(o."source_platform", (
      SELECT e."publisher" FROM "opportunity_evidence" e
      WHERE e."opportunity_id" = o."id" AND e."publisher" IS NOT NULL
      ORDER BY e."captured_at" DESC LIMIT 1
    )),
    "original_listing_url" = COALESCE(o."original_listing_url", (
      SELECT e."source_url" FROM "opportunity_evidence" e
      WHERE e."opportunity_id" = o."id"
      ORDER BY e."captured_at" DESC LIMIT 1
    ));

ALTER TABLE "tracked_applications"
  ALTER COLUMN "status" SET DEFAULT 'SAVED',
  ADD COLUMN IF NOT EXISTS "application_date" date,
  ADD COLUMN IF NOT EXISTS "application_method" text,
  ADD COLUMN IF NOT EXISTS "cv_version" text,
  ADD COLUMN IF NOT EXISTS "cover_letter" text,
  ADD COLUMN IF NOT EXISTS "confirmation_reference" text,
  ADD COLUMN IF NOT EXISTS "recruiter_name" text,
  ADD COLUMN IF NOT EXISTS "recruiter_contact" text,
  ADD COLUMN IF NOT EXISTS "next_follow_up_date" date,
  ADD COLUMN IF NOT EXISTS "assessment_date" date,
  ADD COLUMN IF NOT EXISTS "interview_date" date,
  ADD COLUMN IF NOT EXISTS "interview_notes" text,
  ADD COLUMN IF NOT EXISTS "offer_details" text,
  ADD COLUMN IF NOT EXISTS "final_outcome" text;

-- Legacy tracker rows were created by marking a role applied; retain that date.
UPDATE "tracked_applications"
SET "application_date" = COALESCE("application_date", "applied_at"::date);

CREATE TABLE IF NOT EXISTS "application_status_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "opportunity_id" integer NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "from_status" text,
  "to_status" text NOT NULL,
  "changed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "actor_key" text NOT NULL DEFAULT 'admin',
  "change_source" text NOT NULL DEFAULT 'manual',
  "description" text
);
CREATE INDEX IF NOT EXISTS "application_status_history_opportunity_changed_idx"
  ON "application_status_history" ("opportunity_id", "changed_at");

CREATE TABLE IF NOT EXISTS "opportunity_activities" (
  "id" serial PRIMARY KEY NOT NULL,
  "opportunity_id" integer NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "actor_key" text NOT NULL DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS "opportunity_activities_opportunity_created_idx"
  ON "opportunity_activities" ("opportunity_id", "created_at");

-- Capture a baseline for every existing tracker before translating legacy values.
INSERT INTO "application_status_history" ("opportunity_id", "from_status", "to_status", "changed_at", "change_source", "description")
SELECT ta."opportunity_id", NULL,
  CASE lower(ta."status")
    WHEN 'saved' THEN 'SAVED'
    WHEN 'reviewing' THEN 'REVIEWING'
    WHEN 'ready_to_apply' THEN 'READY_TO_APPLY'
    WHEN 'applied' THEN 'APPLIED'
    WHEN 'assessment' THEN 'ASSESSMENT'
    WHEN 'interviewing' THEN 'INTERVIEW'
    WHEN 'interview' THEN 'INTERVIEW'
    WHEN 'offer' THEN 'OFFER'
    WHEN 'rejected' THEN 'REJECTED'
    WHEN 'withdrawn' THEN 'WITHDRAWN'
    WHEN 'archived' THEN 'ARCHIVED'
    WHEN 'no_response' THEN 'ARCHIVED'
    ELSE 'ARCHIVED'
  END,
  ta."updated_at", 'migration', 'Initial stage migrated from legacy status: ' || ta."status"
FROM "tracked_applications" ta
WHERE NOT EXISTS (
  SELECT 1 FROM "application_status_history" h WHERE h."opportunity_id" = ta."opportunity_id"
);

UPDATE "tracked_applications"
SET "status" = CASE lower("status")
  WHEN 'saved' THEN 'SAVED'
  WHEN 'reviewing' THEN 'REVIEWING'
  WHEN 'ready_to_apply' THEN 'READY_TO_APPLY'
  WHEN 'applied' THEN 'APPLIED'
  WHEN 'assessment' THEN 'ASSESSMENT'
  WHEN 'interviewing' THEN 'INTERVIEW'
  WHEN 'interview' THEN 'INTERVIEW'
  WHEN 'offer' THEN 'OFFER'
  WHEN 'rejected' THEN 'REJECTED'
  WHEN 'withdrawn' THEN 'WITHDRAWN'
  WHEN 'archived' THEN 'ARCHIVED'
  WHEN 'no_response' THEN 'ARCHIVED'
  ELSE 'ARCHIVED'
END;

-- A listing without a tracker is a saved opportunity, not an applied application.
INSERT INTO "tracked_applications" ("opportunity_id", "status", "applied_at", "updated_at")
SELECT o."id", 'SAVED', o."created_at", now()
FROM "opportunities" o
LEFT JOIN "tracked_applications" ta ON ta."opportunity_id" = o."id"
WHERE ta."id" IS NULL
ON CONFLICT ("opportunity_id") DO NOTHING;

INSERT INTO "application_status_history" ("opportunity_id", "from_status", "to_status", "changed_at", "change_source", "description")
SELECT ta."opportunity_id", NULL, 'SAVED', ta."updated_at", 'migration', 'Initial SAVED stage added for an existing opportunity.'
FROM "tracked_applications" ta
WHERE ta."status" = 'SAVED'
  AND NOT EXISTS (
    SELECT 1 FROM "application_status_history" h WHERE h."opportunity_id" = ta."opportunity_id"
  );

INSERT INTO "opportunity_activities" ("opportunity_id", "kind", "title", "description", "created_at")
SELECT o."id", 'opportunity_discovered', 'Opportunity added to workspace', 'Existing opportunity retained during the opportunity management migration.', o."created_at"
FROM "opportunities" o
WHERE NOT EXISTS (
  SELECT 1 FROM "opportunity_activities" a WHERE a."opportunity_id" = o."id"
);
