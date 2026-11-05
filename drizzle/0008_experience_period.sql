ALTER TABLE "experiences" ADD COLUMN "period" text NOT NULL DEFAULT '';

UPDATE "experiences"
SET "period" = CASE "slug"
  WHEN 'web-development-instructor' THEN 'June 2026 – Present'
  WHEN 'marketing-manager-gezahegn-and-elfinesh' THEN 'April–May 2026'
  WHEN 'hawassa-university-computer-science' THEN '2024–2027 · Graduating 2027'
  WHEN 'founder-startup-builder' THEN '1+ years'
  ELSE "period"
END,
"updated_at" = now()
WHERE "slug" IN (
  'web-development-instructor',
  'marketing-manager-gezahegn-and-elfinesh',
  'hawassa-university-computer-science',
  'founder-startup-builder'
);
