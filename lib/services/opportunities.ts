export type OpportunityForMatching = { requiredSkills: string[]; minYearsExperience?: number | null; workMode?: string | null; location?: string | null };
export type CandidateForMatching = { skills: string[]; yearsExperience?: number | null; workMode?: string | null; location?: string | null };
export type MatchScore = { score: number; skillScore: number; experienceScore: number; preferenceScore: number };

export function scoreOpportunityMatch(opportunity: OpportunityForMatching, candidate: CandidateForMatching): MatchScore {
  const required = new Set(opportunity.requiredSkills.map(s => s.trim().toLowerCase()).filter(Boolean));
  const skills = new Set(candidate.skills.map(s => s.trim().toLowerCase()).filter(Boolean));
  const skillScore = required.size === 0 ? 1 : [...required].filter(s => skills.has(s)).length / required.size;
  const minYears = opportunity.minYearsExperience ?? 0;
  const years = candidate.yearsExperience ?? 0;
  const experienceScore = minYears === 0 ? 1 : Math.min(years / minYears, 1);
  const workModeMatches = !opportunity.workMode || !candidate.workMode || opportunity.workMode.toLowerCase() === candidate.workMode.toLowerCase();
  const locationMatches = !opportunity.location || !candidate.location || opportunity.location.toLowerCase() === candidate.location.toLowerCase();
  const preferenceScore = (Number(workModeMatches) + Number(locationMatches)) / 2;
  return { score: Math.round((skillScore * 0.6 + experienceScore * 0.25 + preferenceScore * 0.15) * 100), skillScore, experienceScore, preferenceScore };
}
