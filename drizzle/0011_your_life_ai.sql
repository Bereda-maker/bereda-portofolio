CREATE TABLE IF NOT EXISTS "life_ai_conversations" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_key" text DEFAULT 'admin' NOT NULL,
  "title" text DEFAULT 'New conversation' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_ai_conversations_owner_updated_idx" ON "life_ai_conversations" USING btree ("owner_key","updated_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_ai_messages" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "subject" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "life_ai_messages" ADD CONSTRAINT "life_ai_messages_conversation_id_life_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "life_ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "life_ai_messages_conversation_created_idx" ON "life_ai_messages" USING btree ("conversation_id","created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "life_ai_context_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_key" text DEFAULT 'admin' NOT NULL,
  "preferences" boolean DEFAULT true NOT NULL,
  "goals" boolean DEFAULT true NOT NULL,
  "commitments" boolean DEFAULT true NOT NULL,
  "habits" boolean DEFAULT false NOT NULL,
  "journal" boolean DEFAULT false NOT NULL,
  "relationships" boolean DEFAULT false NOT NULL,
  "finances" boolean DEFAULT false NOT NULL,
  "conversations" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "life_ai_context_settings_owner_unique" ON "life_ai_context_settings" USING btree ("owner_key");
