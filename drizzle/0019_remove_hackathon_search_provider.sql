-- The Hackathons feature no longer uses third-party search-provider caching or usage telemetry.
DROP TABLE IF EXISTS "hackathon_search_cache";
DROP TABLE IF EXISTS "hackathon_search_usage";
