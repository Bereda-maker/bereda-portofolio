import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateAdultEer, poundsToKilograms } from '../lib/meals/targets';

const eligible = {
  ageYears: 22,
  heightCm: '165',
  weightKg: '63',
  weightRecordedAt: '2026-11-18T00:00:00.000Z',
  biologicalSex: 'female',
  activityLevel: 'low_active',
  pregnantOrLactating: false,
  eatingDisorderConcern: false,
  medicalCondition: '',
};

test('adult female EER matches the NASEM published example and declares the equation', () => {
  const result = estimateAdultEer(eligible);
  assert.equal(result.estimate?.kcalPerDay, '2275');
  assert.equal(result.estimate?.equation, 'EER = 575.77 − 7.01 × age + 6.60 × height (cm) + 12.14 × weight (kg)');
  assert.equal(result.estimate?.sexModel, 'female');
  assert.equal(result.estimate?.activityCategory, 'low active');
  assert.equal(result.estimate?.referenceStandardErrorKcal, 241);
  assert.match(result.estimate?.standardErrorContext ?? '', /not a personal interval/);
});

test('adult male coefficients, positive estimate and report caveat are explicit', () => {
  const result = estimateAdultEer({ ...eligible, biologicalSex: 'male', activityLevel: 'active', ageYears: 30, heightCm: '180', weightKg: '80' });
  assert.equal(result.estimate?.equation, 'EER = 1004.82 − 10.83 × age + 6.52 × height (cm) + 15.91 × weight (kg)');
  assert.equal(result.estimate?.referenceStandardErrorKcal, 342);
  assert.match(result.estimate?.interpretation ?? '', /weight stability/);
  assert.match(result.estimate?.interpretation ?? '', /not adjusted for the selected fitness goal/);
});

test('no adult equation is applied under 19 and no sex/activity is guessed', () => {
  const minor = estimateAdultEer({ ...eligible, ageYears: 17 });
  assert.equal(minor.estimate, null);
  assert.ok(minor.reasons.some((reason) => reason.includes('19 and older')));
  const unspecified = estimateAdultEer({ ...eligible, biologicalSex: 'unspecified', activityLevel: 'moderate' });
  assert.equal(unspecified.estimate, null);
  assert.ok(unspecified.reasons.some((reason) => reason.includes('no equation is inferred')));
  assert.ok(unspecified.reasons.some((reason) => reason.includes('ambiguous activity')));
});

test('pregnancy, unknown pregnancy status, eating-disorder concerns and medical conditions suppress estimates', () => {
  for (const input of [
    { ...eligible, pregnantOrLactating: true },
    { ...eligible, pregnantOrLactating: null },
    { ...eligible, eatingDisorderConcern: true },
    { ...eligible, eatingDisorderConcern: null },
    { ...eligible, medicalCondition: 'diabetes' },
  ]) assert.equal(estimateAdultEer(input).estimate, null);
});

test('an invalid or missing height/weight cannot produce an estimate', () => {
  assert.equal(estimateAdultEer({ ...eligible, heightCm: null }).estimate, null);
  assert.equal(estimateAdultEer({ ...eligible, weightKg: '0' }).estimate, null);
  assert.equal(estimateAdultEer({ ...eligible, weightKg: 'unknown' }).estimate, null);
  assert.equal(estimateAdultEer({ ...eligible, weightRecordedAt: null }).estimate, null);
  assert.equal(estimateAdultEer({ ...eligible, weightRecordedAt: '2020-01-01T00:00:00.000Z' }).estimate, null);
  assert.equal(estimateAdultEer({ ...eligible, weightRecordedAt: '2099-01-01T00:00:00.000Z' }).estimate, null);
});

test('pound-to-kilogram conversion is rounded to the engine decimal scale without floating point', () => {
  assert.equal(poundsToKilograms('220.462262'), '100');
});


test('all eight NASEM adult sex and activity equations are selected explicitly', () => {
  const cases = [
    ['male','inactive','753.07 − 10.83 × age + 6.50 × height (cm) + 14.10 × weight (kg)'],
    ['male','low_active','581.47 − 10.83 × age + 8.30 × height (cm) + 14.94 × weight (kg)'],
    ['male','active','1004.82 − 10.83 × age + 6.52 × height (cm) + 15.91 × weight (kg)'],
    ['male','very_active','-517.88 − 10.83 × age + 15.61 × height (cm) + 19.11 × weight (kg)'],
    ['female','inactive','584.90 − 7.01 × age + 5.72 × height (cm) + 11.71 × weight (kg)'],
    ['female','low_active','575.77 − 7.01 × age + 6.60 × height (cm) + 12.14 × weight (kg)'],
    ['female','active','710.25 − 7.01 × age + 6.54 × height (cm) + 12.34 × weight (kg)'],
    ['female','very_active','511.83 − 7.01 × age + 9.07 × height (cm) + 12.56 × weight (kg)'],
  ] as const;
  for (const [sex, activityLevel, equation] of cases) {
    const result = estimateAdultEer({ ...eligible, biologicalSex: sex, activityLevel });
    assert.equal(result.estimate?.equation, `EER = ${equation}`);
  }
});
