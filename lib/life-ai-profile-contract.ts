import { z } from 'zod';

const shortText = z.string().trim().max(240).default('');
const longText = z.string().trim().max(4_000).default('');
const textList = z.array(z.string().trim().min(1).max(240)).max(40).default([]);
const itemId = z.string().trim().min(1).max(80);

export const PROFILE_CATEGORIES = [
  'about', 'values', 'priorities', 'goals', 'professional',
  'relationships', 'wellbeing', 'interests', 'spiritual', 'lifestyle',
] as const;
export type ProfileCategory = (typeof PROFILE_CATEGORIES)[number];

export const PROFILE_CATEGORY_INFO: Record<ProfileCategory, { label: string; description: string; sensitive: boolean }> = {
  about: { label: 'About Me', description: 'The personal introduction and background you choose to keep.', sensitive: true },
  values: { label: 'My Values', description: 'Principles and values that matter to you.', sensitive: false },
  priorities: { label: 'My Life Priorities', description: 'The life areas you are focusing on and why.', sensitive: false },
  goals: { label: 'My Goals', description: 'Your goals, milestones, progress, and target dates.', sensitive: false },
  professional: { label: 'My Professional Life', description: 'Work, skills, career ambitions, and learning objectives.', sensitive: false },
  relationships: { label: 'My Relationships and Social Life', description: 'Optional notes about people, social goals, and boundaries.', sensitive: true },
  wellbeing: { label: 'My Health and Wellbeing Preferences', description: 'Optional wellbeing preferences; not medical records.', sensitive: true },
  interests: { label: 'My Interests and Recreation', description: 'Activities, hobbies, learning, and recreation you enjoy.', sensitive: false },
  spiritual: { label: 'My Spiritual and Personal Growth', description: 'Optional reflection, spiritual, and contribution priorities.', sensitive: true },
  lifestyle: { label: 'My Lifestyle Preferences', description: 'Routines, communication, work-life balance, and what fulfillment means to you.', sensitive: false },
};

export const profileSectionSchemas = {
  about: z.object({
    preferredName: shortText,
    introduction: longText,
    location: shortText,
    background: longText,
    languages: textList,
    personalContext: longText,
  }),
  values: z.object({ values: z.array(z.object({ id: itemId, name: z.string().trim().min(1).max(120) })).max(40).default([]) }),
  priorities: z.object({
    items: z.array(z.object({
      id: itemId, title: z.string().trim().min(1).max(120), level: z.enum(['low', 'medium', 'high']).default('medium'),
      description: longText, currentFocus: longText, notes: longText,
    })).max(30).default([]),
  }),
  goals: z.object({
    items: z.array(z.object({
      id: itemId, title: z.string().trim().min(1).max(160), description: longText, category: shortText,
      priority: z.enum(['low', 'medium', 'high']).default('medium'), targetDate: z.string().max(10).default(''),
      timeframe: z.enum(['short', 'medium', 'long']).default('short'),
      status: z.enum(['not_started', 'in_progress', 'paused', 'completed']).default('not_started'),
      progressPercent: z.number().int().min(0).max(100).default(0),
      milestones: z.array(z.object({ id: itemId, title: z.string().trim().min(1).max(160), completed: z.boolean().default(false) })).max(30).default([]),
      notes: longText,
    })).max(50).default([]),
  }),
  professional: z.object({
    currentRole: shortText, background: longText, skills: textList, careerAmbitions: longText,
    currentProjects: textList, learningObjectives: textList, businessAmbitions: longText, challenges: longText,
  }),
  relationships: z.object({
    importantPeople: textList, familyCommitments: longText, friendships: longText, socialGoals: textList,
    importantDates: textList, sharedActivities: textList, preferencesAndBoundaries: longText,
  }),
  wellbeing: z.object({
    fitnessGoals: longText, preferredActivities: textList, sleepAndRest: longText, recreation: textList,
    stressManagement: longText, moodBoosters: textList, makeMoreTimeFor: textList,
  }),
  interests: z.object({
    hobbies: textList, favoriteActivities: textList, booksAndReading: textList, entertainment: textList,
    travel: textList, creativeInterests: textList, explore: textList,
  }),
  spiritual: z.object({
    spiritualPriorities: longText, personalDevelopment: textList, learningGoals: textList,
    reflectionPractices: textList, communityInvolvement: longText, mentorshipAndContribution: longText,
  }),
  lifestyle: z.object({
    dailyRoutine: longText, workingHours: shortText, workLifeBalance: longText, planningStyle: shortText,
    socialPreferences: longText, recreationPreferences: longText, communicationPreferences: longText,
    thingsToAvoid: longText, fulfillingLife: longText,
  }),
} as const;

export type ProfileData = { [K in ProfileCategory]: z.infer<(typeof profileSectionSchemas)[K]> };

export const EMPTY_PROFILE: ProfileData = {
  about: { preferredName: '', introduction: '', location: '', background: '', languages: [], personalContext: '' },
  values: { values: [] },
  priorities: { items: [] },
  goals: { items: [] },
  professional: { currentRole: '', background: '', skills: [], careerAmbitions: '', currentProjects: [], learningObjectives: [], businessAmbitions: '', challenges: '' },
  relationships: { importantPeople: [], familyCommitments: '', friendships: '', socialGoals: [], importantDates: [], sharedActivities: [], preferencesAndBoundaries: '' },
  wellbeing: { fitnessGoals: '', preferredActivities: [], sleepAndRest: '', recreation: [], stressManagement: '', moodBoosters: [], makeMoreTimeFor: [] },
  interests: { hobbies: [], favoriteActivities: [], booksAndReading: [], entertainment: [], travel: [], creativeInterests: [], explore: [] },
  spiritual: { spiritualPriorities: '', personalDevelopment: [], learningGoals: [], reflectionPractices: [], communityInvolvement: '', mentorshipAndContribution: '' },
  lifestyle: { dailyRoutine: '', workingHours: '', workLifeBalance: '', planningStyle: '', socialPreferences: '', recreationPreferences: '', communicationPreferences: '', thingsToAvoid: '', fulfillingLife: '' },
};

export function isProfileCategory(value: string): value is ProfileCategory {
  return (PROFILE_CATEGORIES as readonly string[]).includes(value);
}
