CREATE TABLE IF NOT EXISTS "daily_application_goals" (
  "day" text PRIMARY KEY NOT NULL,
  "target" integer NOT NULL DEFAULT 5,
  "applied" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
