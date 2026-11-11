import { and, eq } from 'drizzle-orm';
import { candidateProfiles, opportunityEvidence, opportunityMatches, opportunities, outreachDrafts } from '@/lib/schema';
import { scoreOpportunityMatch } from './opportunities';
import { aiProvider } from './providers';

export type OpportunityAnalysis = {
  title: string;
  company?: string;
  description: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  requiredSkills: string[];
  minYearsExperience?: number;
  applicationUrl?: string;
  recruitingChannel?: string;
  whyRelevant: string;
  risks: string[];
};

function parseJson(text: string): OpportunityAnalysis | null {
  try {
    const parsed = JSON.parse(text) as Partial<OpportunityAnalysis>;
    if (!parsed.title || !parsed.description) return null;
    return {
      title: parsed.title,
      company: parsed.company,
      description: parsed.description,
      location: parsed.location,
      workMode: parsed.workMode,
      employmentType: parsed.employmentType,
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills.filter((v): v is string => typeof v === 'string') : [],
      minYearsExperience: typeof parsed.minYearsExperience === 'number' ? parsed.minYearsExperience : undefined,
      applicationUrl: parsed.applicationUrl,
      recruitingChannel: parsed.recruitingChannel,
      whyRelevant: parsed.whyRelevant ?? '',
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter((v): v is string => typeof v === 'string') : [],
    };
  } catch {
    return null;
  }
}

function cleanText(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}

function feedRecordsText(data: unknown) {
  const records = Array.isArray(data) ? data : data && typeof data === 'object' && Array.isArray((data as { jobs?: unknown[] }).jobs) ? (data as { jobs: unknown[] }).jobs : [];
  const jobs = records.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))).map((item) => {
    const title = typeof item.position === 'string' ? item.position : typeof item.title === 'string' ? item.title : '';
    const description = typeof item.description === 'string' ? cleanText(item.description) : '';
    if (!title || !description) return null;
    const tags = Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string').join(', ') : '';
    const applyUrl = typeof item.apply_url === 'string' ? item.apply_url : typeof item.url === 'string' ? item.url : '';
    return { title, company: typeof item.company === 'string' ? item.company : '', location: typeof item.location === 'string' ? item.location : '', tags, applyUrl, description };
  }).filter((job): job is NonNullable<typeof job> => job !== null);
  const softwareTerms = /software|developer|programmer|web|frontend|front-end|backend|back-end|full.?stack|javascript|typescript|react|python|golang|devops|mobile|machine learning|data engineer|platform engineer|api/i;
  const relevant = jobs.filter((job) => softwareTerms.test(`${job.title} ${job.tags}`));
  const selected = (relevant.length ? relevant : jobs).slice(0, 6);
  return selected.map((job, index) => `Opportunity ${index + 1}\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nTags: ${job.tags}\nApplication URL: ${job.applyUrl}\nDescription: ${job.description.slice(0, 1800)}`).join('\n\n');
}

async function readPublicSource(url: string) {
  const response = await fetch(url, { headers: { 'user-agent': 'BeredaOpportunityResearch/1.0' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const feedText = feedRecordsText(await response.json());
    if (feedText) return feedText.slice(0, 24000);
    throw new Error('The source returned JSON, but no readable opportunity records were found.');
  }
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) throw new Error('The source is not a readable public web page.');
  const html = await response.text();
  const feedLink = (html.match(/<link\b[^>]*>/gi) ?? []).find((tag) => {
    const rel = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase().split(/\s+/) ?? [];
    const type = tag.match(/\btype\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase().split(';')[0].trim();
    return rel.includes('alternate') && type === 'application/json' && /\bhref\s*=/i.test(tag);
  });
  const href = feedLink?.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2]?.replace(/&amp;/gi, '&');
  if (href) {
    const sourceOrigin = new URL(url).origin;
    const feedUrl = new URL(href, url);
    if (feedUrl.origin === sourceOrigin && (feedUrl.protocol === 'https:' || feedUrl.protocol === 'http:')) {
      const feedResponse = await fetch(feedUrl, { headers: { 'user-agent': 'BeredaOpportunityResearch/1.0', accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (feedResponse.ok && (feedResponse.headers.get('content-type') ?? '').includes('application/json')) {
        const feedText = feedRecordsText(await feedResponse.json());
        if (feedText) return feedText.slice(0, 24000);
      }
    }
  }
  return cleanText(html).slice(0, 24000);
}

export async function researchOpportunity(input: { sourceUrl: string; notes?: string }) {
  const sourceText = await readPublicSource(input.sourceUrl);
  const result = await aiProvider.complete({
    json: true,
    system: 'You are an evidence-first career opportunity researcher. Never invent facts. If a field is not present in the source, use an empty string or empty list. Return JSON only.',
    prompt: `Extract one software development job, freelance opportunity, or potential client lead from this public source. If it contains multiple job records, choose one complete software-development opportunity supported by the records. Do not use generic site navigation as a job description and do not invent missing details. Return JSON with exactly these keys: title, company, description, location, workMode, employmentType, requiredSkills (array), minYearsExperience (number or null), applicationUrl, recruitingChannel, whyRelevant, risks (array). Keep whyRelevant and risks concise. Source URL: ${input.sourceUrl}\nAdditional user notes: ${input.notes ?? ''}\nSource text:\n${sourceText}`,
  });
  if (result.status !== 'ok') throw new Error(result.message);
  const analysis = parseJson(result.data.text);
  if (!analysis) throw new Error('The AI provider returned an invalid opportunity analysis.');
  return { analysis, excerpt: sourceText.slice(0, 1000) };
}

export { discoverOpportunityRecommendations } from './opportunity-discovery';

export async function saveMatch(opportunityId: number, profileId: number, reasoning?: string) {
  const { db } = await import('@/lib/db');
  const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, profileId)).limit(1);
  if (!opportunity || !profile) throw new Error('Opportunity or profile not found.');
  const score = scoreOpportunityMatch(opportunity, { skills: profile.skills, yearsExperience: profile.yearsExperience, workMode: profile.workMode, location: profile.locations[0] });
  const matchedSkills = opportunity.requiredSkills.filter((skill) => profile.skills.some((candidateSkill) => candidateSkill.trim().toLowerCase() === skill.trim().toLowerCase()));
  const gaps = opportunity.requiredSkills.filter((skill) => !matchedSkills.includes(skill));
  const explanation = reasoning ?? `Matched ${matchedSkills.length} of ${opportunity.requiredSkills.length || 0} listed skills. Experience fit is ${Math.round(score.experienceScore * 100)}% and preference fit is ${Math.round(score.preferenceScore * 100)}%. Review the evidence and gaps before approving.`;
  const [row] = await db.insert(opportunityMatches).values({ opportunityId, profileId, score: score.score, reasoning: explanation, matchedSkills, gaps, status: 'pending' }).onConflictDoUpdate({ target: [opportunityMatches.opportunityId, opportunityMatches.profileId], set: { score: score.score, reasoning: explanation, matchedSkills, gaps, updatedAt: new Date() } }).returning();
  return row;
}

export async function draftOutreach(opportunityId: number, profileId: number, channel: string) {
  const { db } = await import('@/lib/db');
  const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, profileId)).limit(1);
  if (!opportunity || !profile) throw new Error('Opportunity or profile not found.');
  const [evidence] = await db.select({ publisher: opportunityEvidence.publisher }).from(opportunityEvidence).where(eq(opportunityEvidence.opportunityId, opportunityId)).limit(1);
  const channelGuidance = channel === 'email'
    ? 'Write a concise, warm email to the hiring team. Return a specific, non-generic subject and a 3–5 short paragraph body with a natural greeting, one concrete profile-to-role connection, a brief evidence-backed example, and a polite next step. No markdown headings or fake contact names.'
    : channel === 'linkedin'
      ? 'Write a natural LinkedIn message, not an email. Keep it under 100 words, conversational and specific; open with why this role/person is relevant, connect one verified profile detail, and end with a low-pressure question. Do not include a subject, greeting like “Dear Hiring Manager”, formal sign-off, or unsupported assumptions about the recipient.'
      : 'Write a tailored application cover letter of 180–260 words with readable short paragraphs. Lead with the role and a genuine reason for interest, connect two or fewer verified skills/projects to explicit role needs, and close with a confident but modest next step. No invented metrics or claims.';
  const result = await aiProvider.complete({
    json: true,
    system: 'You are a thoughtful career-writing partner. Produce natural, specific writing that sounds like a real person, not an AI template. Never invent experience, achievements, metrics, motivation, recipient identity, or company facts. Use only evidence in the supplied profile and opportunity. Avoid clichés such as “I am writing to express my interest”, “passionate”, “perfect fit”, and “leverage”. Return only valid JSON with string keys subject and body; subject may be empty for channels that do not use one.',
    prompt: `${channelGuidance}\n\nDo not label the copy as a draft; the interface labels it. Make the wording distinct from generic templates and grounded in the candidate’s actual profile. If evidence is thin, keep the message simpler rather than filling gaps.\n\nOPPORTUNITY\nRole: ${opportunity.title}\nCompany: ${evidence?.publisher ?? 'Not provided'}\nDescription: ${opportunity.description ?? ''}\nRequired skills: ${opportunity.requiredSkills.join(', ') || 'Not specified'}\nLocation/work mode: ${opportunity.location ?? 'Not specified'} / ${opportunity.workMode ?? 'Not specified'}\n\nCANDIDATE PROFILE\nName: ${profile.name}\nHeadline: ${profile.headline ?? 'Not provided'}\nSkills: ${profile.skills.join(', ') || 'Not provided'}\nExperience: ${profile.yearsExperience ?? 'Not provided'} years\nProjects and proof: ${profile.projectsSummary ?? 'Not provided'}\nPortfolio: ${profile.portfolioUrl ?? 'Not provided'}\nGitHub: ${profile.githubUrl ?? 'Not provided'}\nPreferences/boundaries: ${profile.preferences ?? 'Not provided'}`,
  });
  if (result.status !== 'ok') throw new Error(result.message);
  let content: { subject?: string; body?: string };
  try { content = JSON.parse(result.data.text) as { subject?: string; body?: string }; } catch { throw new Error('The AI provider returned an invalid message draft. Please try again.'); }
  if (typeof content.body !== 'string' || !content.body.trim()) throw new Error('The AI provider returned an empty message draft. Please try again.');
  const [draft] = await db.insert(outreachDrafts).values({ opportunityId, channel, subject: content.subject?.trim() || null, body: content.body.trim(), status: 'draft' }).returning();
  return draft;
}
