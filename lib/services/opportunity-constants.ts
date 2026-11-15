export const APPLICATION_STAGES = [
  'SAVED',
  'REVIEWING',
  'READY_TO_APPLY',
  'APPLIED',
  'ASSESSMENT',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'ARCHIVED',
] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const ACTIVITY_KINDS = [
  'opportunity_discovered',
  'manual_creation',
  'ai_research',
  'approval',
  'application_preparation',
  'application_submission',
  'assessment',
  'interview_scheduling',
  'follow_up',
  'offer',
  'rejection',
  'withdrawal',
  'custom_note',
  'duplicate_merged',
  'duplicate_dismissed',
  'details_updated',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
