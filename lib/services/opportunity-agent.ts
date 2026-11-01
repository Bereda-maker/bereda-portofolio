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

async function readPublicSource(url: string) {
  const response = await fetch(url, { headers: { 'user-agent': 'BeredaOpportunityResearch/1.0' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) throw new Error('The source is not a readable public web page.');
  const html = await response.text();
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24000);
}

export async function researchOpportunity(input: { sourceUrl: string; notes?: string }) {
  const sourceText = await readPublicSource(input.sourceUrl);
  const result = await aiProvider.complete({
    json: true,
    system: 'You are an evidence-first career opportunity researcher. Never invent facts. If a field is not present in the source, use an empty string or empty list. Return JSON only.',
    prompt: `Extract one software development job, freelance opportunity, or potential client lead from this public source. Return JSON with exactly these keys: title, company, description, location, workMode, employmentType, requiredSkills (array), minYearsExperience (number or null), applicationUrl, recruitingChannel, whyRelevant, risks (array). Keep whyRelevant and risks concise. Source URL: ${input.sourceUrl}\nAdditional user notes: ${input.notes ?? ''}\nSource text:\n${sourceText}`,
  });
  if (result.status !== 'ok') throw new Error(result.message);
  const analysis = parseJson(result.data.text);
  if (!analysis) throw new Error('The AI provider returned an invalid opportunity analysis.');
  return { analysis, excerpt: sourceText.slice(0, 1000) };
}

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
  const result = await aiProvider.complete({
    system: 'You write concise, honest, personalized application or outreach drafts. Never claim experience not present in the profile. Return plain text only.',
    prompt: `Write a draft ${channel} message for this opportunity. It must be clearly labeled as a draft and must not imply it was sent. Mention only relevant skills and projects from the profile. Opportunity: ${opportunity.title}\n${opportunity.description ?? ''}\nRequired skills: ${opportunity.requiredSkills.join(', ')}\nProfile: ${profile.name}; ${profile.headline ?? ''}; skills ${profile.skills.join(', ')}; projects ${profile.projectsSummary ?? ''}`,
  });
  if (result.status !== 'ok') throw new Error(result.message);
  const [draft] = await db.insert(outreachDrafts).values({ opportunityId, channel, subject: `Draft for ${opportunity.title}`, body: result.data.text, status: 'draft' }).returning();
  return draft;
}
