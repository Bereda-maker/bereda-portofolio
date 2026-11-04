CREATE TABLE IF NOT EXISTS "experiences" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "role" text NOT NULL,
  "place" text NOT NULL,
  "type" text NOT NULL,
  "image" text DEFAULT '/images/experience/teaching.webp' NOT NULL,
  "image_alt" text DEFAULT '' NOT NULL,
  "text" text NOT NULL,
  "details" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "links" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "experiences_slug_unique" ON "experiences" ("slug");
CREATE INDEX IF NOT EXISTS "experiences_order_idx" ON "experiences" ("sort_order");
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;
