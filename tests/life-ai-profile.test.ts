import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_PROFILE, PROFILE_CATEGORY_INFO, profileSectionSchemas } from '../lib/life-ai-profile-contract';
import { allowedProfileCategories, relevantProfileCategories } from '../lib/life-ai-profile';

const now = new Date('2026-11-12T12:00:00.000Z');

test('new profiles start empty and accept owner-entered About Me details', () => {
  assert.deepEqual(profileSectionSchemas.about.parse({}), EMPTY_PROFILE.about);
  const created = profileSectionSchemas.about.parse({
    preferredName: 'Sam', introduction: 'I value a balanced, curious life.', location: 'Nairobi',
    background: 'A short personal introduction.', languages: ['English', 'Kiswahili'], personalContext: '',
  });
  assert.equal(created.preferredName, 'Sam');
  assert.deepEqual(created.languages, ['English', 'Kiswahili']);
});

test('profile edits accept custom values and preserve their user-defined order', () => {
  const saved = profileSectionSchemas.values.parse({ values: [
    { id: 'custom-1', name: 'Quiet mornings' },
    { id: 'custom-2', name: 'Meaningful contribution' },
  ] });
  const edited = profileSectionSchemas.values.parse({ values: [saved.values[1], saved.values[0]] });
  assert.deepEqual(edited.values.map((entry) => entry.name), ['Meaningful contribution', 'Quiet mornings']);
});

test('goal validation supports dates, progress states, and ordered milestones', () => {
  const goal = profileSectionSchemas.goals.parse({ items: [{
    id: 'goal-1', title: 'Build a steady learning routine', description: 'Keep weekly time for study.',
    category: 'Learning', priority: 'high', targetDate: '2026-12-31', timeframe: 'medium',
    status: 'in_progress', progressPercent: 35,
    milestones: [{ id: 'milestone-1', title: 'Choose a course', completed: true }, { id: 'milestone-2', title: 'Complete the first module', completed: false }],
    notes: 'Review progress monthly.',
  }] });
  assert.equal(goal.items[0].progressPercent, 35);
  assert.equal(goal.items[0].milestones.length, 2);
  assert.equal(profileSectionSchemas.goals.safeParse({ items: [{ id: 'bad', title: '', milestones: [] }] }).success, false);
  assert.equal(profileSectionSchemas.values.safeParse({ values: [{ id: 'x', name: 'x'.repeat(121) }] }).success, false);
});

test('topic routing chooses only relevant categories for example prompts', () => {
  assert.deepEqual(relevantProfileCategories('Help me plan a balanced week.'), [
    'priorities', 'goals', 'professional', 'wellbeing', 'interests', 'lifestyle',
  ]);
  assert.deepEqual(relevantProfileCategories('Help me improve my career.'), ['professional']);
  assert.deepEqual(relevantProfileCategories('Suggest activities that would make me happier.'), ['values', 'wellbeing', 'interests']);
  assert.deepEqual(relevantProfileCategories('What is the capital of France?'), []);
});

test('global and category permissions fail closed and sensitive categories require consent', () => {
  const relevant = ['about', 'values', 'relationships', 'wellbeing'] as const;
  const permissions = [
    { category: 'about', aiEnabled: true, consentedAt: null },
    { category: 'values', aiEnabled: false, consentedAt: null },
    { category: 'relationships', aiEnabled: true, consentedAt: null },
    { category: 'wellbeing', aiEnabled: true, consentedAt: now },
  ];
  assert.deepEqual(allowedProfileCategories(false, [...relevant], permissions), []);
  assert.deepEqual(allowedProfileCategories(true, [...relevant], permissions), ['wellbeing']);
  assert.equal(PROFILE_CATEGORY_INFO.relationships.sensitive, true);
  assert.equal(PROFILE_CATEGORY_INFO.values.sensitive, false);
});
