CREATE TABLE IF NOT EXISTS "life_ai_profile_sections" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_key" text DEFAULT 'admin' NOT NULL,
  "category" text NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "life_ai_profile_sections_category_check" CHECK ("category" in ('about','values','priorities','goals','professional','relationships','wellbeing','interests','spiritual','lifestyle'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_ai_profile_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_key" text DEFAULT 'admin' NOT NULL,
  "ai_context_enabled" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_ai_profile_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_key" text DEFAULT 'admin' NOT NULL,
  "category" text NOT NULL,
  "ai_enabled" boolean DEFAULT false NOT NULL,
  "consented_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "life_ai_profile_permissions_category_check" CHECK ("category" in ('about','values','priorities','goals','professional','relationships','wellbeing','interests','spiritual','lifestyle'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "life_ai_profile_sections_owner_category_unique" ON "life_ai_profile_sections" USING btree ("owner_key", "category");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "life_ai_profile_settings_owner_unique" ON "life_ai_profile_settings" USING btree ("owner_key");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "life_ai_profile_permissions_owner_category_unique" ON "life_ai_profile_permissions" USING btree ("owner_key", "category");
--> statement-breakpoint
ALTER TABLE "life_ai_profile_sections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "life_ai_profile_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "life_ai_profile_permissions" ENABLE ROW LEVEL SECURITY;
