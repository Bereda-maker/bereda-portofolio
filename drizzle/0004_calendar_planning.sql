CREATE TABLE "calendar_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'planned' NOT NULL,
  "priority" text DEFAULT 'normal' NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "calendar_tasks_starts_ends_idx" ON "calendar_tasks" USING btree ("starts_at", "ends_at");
--> statement-breakpoint
CREATE TABLE "calendar_plans" (
  "id" serial PRIMARY KEY NOT NULL,
  "period" text NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "title" text NOT NULL,
  "target_minutes" integer DEFAULT 0 NOT NULL,
  "target_label" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_plans_period_start_unique" ON "calendar_plans" USING btree ("period", "period_start");
