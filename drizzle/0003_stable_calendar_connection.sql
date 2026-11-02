DO $$
DECLARE
  duplicate RECORD;
  keeper_id integer;
BEGIN
  FOR duplicate IN
    SELECT DISTINCT ON (provider) provider, id AS keeper_id
    FROM calendar_connections
    ORDER BY provider,
      (status = 'connected' AND encrypted_refresh_token IS NOT NULL) DESC,
      updated_at DESC,
      id DESC
  LOOP
    keeper_id := duplicate.keeper_id;
    UPDATE calendar_sync_jobs
      SET connection_id = keeper_id
      WHERE connection_id IN (
        SELECT id FROM calendar_connections
        WHERE provider = duplicate.provider AND id <> keeper_id
      );
    DELETE FROM calendar_connections
      WHERE provider = duplicate.provider AND id <> keeper_id;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_provider_unique" ON "calendar_connections" USING btree ("provider");
