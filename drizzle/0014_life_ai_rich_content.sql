CREATE TABLE "life_ai_message_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "life_ai_message_blocks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "life_ai_saved_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_key" text DEFAULT 'admin' NOT NULL,
	"resource_type" text NOT NULL,
	"resource_key" text NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_watched" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "life_ai_saved_resources_type_check" CHECK ("life_ai_saved_resources"."resource_type" in ('youtube_video','book','website','course','tool','product','project'))
);
ALTER TABLE "life_ai_saved_resources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "life_ai_message_blocks" ADD CONSTRAINT "life_ai_message_blocks_message_id_life_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."life_ai_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "life_ai_message_blocks_message_unique" ON "life_ai_message_blocks" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "life_ai_saved_resources_owner_resource_unique" ON "life_ai_saved_resources" USING btree ("owner_key","resource_type","resource_key");--> statement-breakpoint
CREATE INDEX "life_ai_saved_resources_owner_updated_idx" ON "life_ai_saved_resources" USING btree ("owner_key","updated_at");
