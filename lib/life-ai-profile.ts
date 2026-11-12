import { and, eq, inArray } from 'drizzle-orm';
import { LIFE_AI_OWNER } from '@/lib/life-ai';
import { lifeAiProfilePermissions, lifeAiProfileSections, lifeAiProfileSettings } from '@/lib/schema';
import { PROFILE_CATEGORIES, PROFILE_CATEGORY_INFO, type ProfileCategory } from '@/lib/life-ai-profile-contract';

async function getDb() { return (await import('@/lib/db')).db; }

export function relevantProfileCategories(question: string): ProfileCategory[] {
  const text = question.toLocaleLowerCase();
  const rules: Array<[ProfileCategory, RegExp]> = [
    ['about', /\b(about me|who am i|my background|my story|personal profile|introduce myself)\b/],
    ['values', /\b(value|values|what matters|meaning|purpose|principle|principles|happier|happiness|fulfillment|fulfilling)\b/],
    ['priorities', /\b(priorit|balanced|balance|week|plan|planning|focus|trade.?off)\b/],
    ['goals', /\b(goal|goals|milestone|progress|aspiration)\b/],
    ['professional', /\b(career|profession|job|work|business|skill|professional|ambition|project)\b/],
    ['relationships', /\b(family|friend|relationship|social|partner|people|boundar|commitment)\b/],
    ['wellbeing', /\b(health|fitness|sleep|stress|well.?being|mood|exercise|energy|rest|happier|happiness)\b/],
    ['interests', /\b(hobb(?:y|ies)|interests?|activities|recreation|travel|reading|books?|free time|fun)\b/],
    ['spiritual', /\b(spiritual|faith|religion|reflection|personal growth|community|mentor)\b/],
    ['lifestyle', /\b(routine|schedule|work.?life|planning style|communication|fulfilling|lifestyle|daily)\b/],
  ];
  const matched = new Set(rules.filter(([, pattern]) => pattern.test(text)).map(([category]) => category));
  if (/\b(plan|planning|week|balanced|balance|schedule|routine)\b/.test(text)) {
    for (const category of ['priorities', 'goals', 'professional', 'lifestyle', 'wellbeing', 'interests'] as const) matched.add(category);
  }
  return PROFILE_CATEGORIES.filter((category) => matched.has(category));
}

export function allowedProfileCategories(globalEnabled: boolean, relevant: ProfileCategory[], permissions: Array<{ category: string; aiEnabled: boolean; consentedAt: Date | null }>): ProfileCategory[] {
  if (!globalEnabled) return [];
  const byCategory = new Map(permissions.map((permission) => [permission.category, permission]));
  return relevant.filter((category) => {
    const permission = byCategory.get(category);
    return Boolean(permission?.aiEnabled && (!PROFILE_CATEGORY_INFO[category].sensitive || permission.consentedAt));
  });
}

export async function getProfileOverviewData() {
  const db = await getDb();
  const [sections, settings, permissions] = await Promise.all([
    db.select().from(lifeAiProfileSections).where(eq(lifeAiProfileSections.ownerKey, LIFE_AI_OWNER)),
    db.select().from(lifeAiProfileSettings).where(eq(lifeAiProfileSettings.ownerKey, LIFE_AI_OWNER)).limit(1),
    db.select().from(lifeAiProfilePermissions).where(eq(lifeAiProfilePermissions.ownerKey, LIFE_AI_OWNER)),
  ]);
  return {
    sections: Object.fromEntries(sections.map((section) => [section.category, { data: section.data, updatedAt: section.updatedAt }])),
    settings: { aiContextEnabled: settings[0]?.aiContextEnabled ?? false, updatedAt: settings[0]?.updatedAt ?? null },
    permissions: Object.fromEntries(permissions.map((permission) => [permission.category, { aiEnabled: permission.aiEnabled, consentedAt: permission.consentedAt, updatedAt: permission.updatedAt }])),
  };
}

function hasProfileContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasProfileContent);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).some(hasProfileContent);
  return typeof value === 'number' ? value !== 0 : value === true;
}

export async function getMissingProfileCategoryLabels(): Promise<string[]> {
  const db = await getDb();
  const sections = await db.select({ category: lifeAiProfileSections.category, data: lifeAiProfileSections.data })
    .from(lifeAiProfileSections).where(eq(lifeAiProfileSections.ownerKey, LIFE_AI_OWNER));
  const populated = new Set(sections.filter((section) => hasProfileContent(section.data)).map((section) => section.category));
  return PROFILE_CATEGORIES.filter((category) => !populated.has(category)).map((category) => PROFILE_CATEGORY_INFO[category].label);
}

function boundProfileValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return undefined;
  if (typeof value === 'string') return value.slice(0, 220);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 8).map((item) => boundProfileValue(item, depth + 1)).filter((item) => item !== undefined);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 24).map(([key, item]) => [key, boundProfileValue(item, depth + 1)]).filter(([, item]) => item !== undefined));
  }
  return undefined;
}

export async function buildAuthorizedProfileContext(question: string): Promise<string> {
  const relevant = relevantProfileCategories(question);
  if (!relevant.length) return '';

  const db = await getDb();
  const [settings] = await db.select({ enabled: lifeAiProfileSettings.aiContextEnabled }).from(lifeAiProfileSettings).where(eq(lifeAiProfileSettings.ownerKey, LIFE_AI_OWNER)).limit(1);
  if (!settings?.enabled) return '';

  const permissions = await db.select({ category: lifeAiProfilePermissions.category, aiEnabled: lifeAiProfilePermissions.aiEnabled, consentedAt: lifeAiProfilePermissions.consentedAt })
    .from(lifeAiProfilePermissions)
    .where(and(eq(lifeAiProfilePermissions.ownerKey, LIFE_AI_OWNER), eq(lifeAiProfilePermissions.aiEnabled, true), inArray(lifeAiProfilePermissions.category, relevant)));
  const allowed = allowedProfileCategories(true, relevant, permissions);
  if (!allowed.length) return '';

  const sections = await db.select({ category: lifeAiProfileSections.category, data: lifeAiProfileSections.data })
    .from(lifeAiProfileSections)
    .where(and(eq(lifeAiProfileSections.ownerKey, LIFE_AI_OWNER), inArray(lifeAiProfileSections.category, allowed)));
  if (!sections.length) return '';

  const context = sections.map(({ category, data }) => ({
    category: PROFILE_CATEGORY_INFO[category as ProfileCategory].label,
    userMaintainedFacts: boundProfileValue(data),
  }));
  const bounded = [] as typeof context;
  for (const item of context) {
    const candidate = [...bounded, item];
    if (JSON.stringify(candidate).length > 10_000) break;
    bounded.push(item);
  }
  return JSON.stringify(bounded);
}
