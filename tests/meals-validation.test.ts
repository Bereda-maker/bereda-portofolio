import test from 'node:test';
import assert from 'node:assert/strict';
import { actionSchema, foodCreateSchema, nutritionProfileSchema, profileSchema, progressSchema, hydrationSchema } from '../lib/meals/validation';

test('food records keep pieces, total weight and units separate', () => {
  const result = foodCreateSchema.safeParse({ name: 'Banana', category: 'Fruit', unit: 'piece', pieceCount: '45', totalWeight: '500', totalWeightUnit: 'g', currency: 'ETB', allergens: [], dietTags: ['vegan'], restrictions: [] });
  assert.equal(result.success, true);
  assert.equal(foodCreateSchema.safeParse({ name: 'Banana', unit: 'g', totalWeight: '500', allergens: [], dietTags: [], restrictions: [] }).success, false);
  assert.equal(foodCreateSchema.safeParse({ name: 'Banana', unit: 'piece', totalWeight: '500', totalWeightUnit: 'piece', allergens: [], dietTags: [], restrictions: [] }).success, false);
});

test('currency values require a supported code and retain no invented precision', () => {
  assert.equal(foodCreateSchema.safeParse({ name: 'Test', unit: 'piece', currency: 'ETB' }).success, true);
  assert.equal(foodCreateSchema.safeParse({ name: 'Test', unit: 'piece', currency: 'ZZZ' }).success, false);
});

test('manual nutrition profiles allow unknown nutrients and require a named serving basis', () => {
  const base = { foodId: 1, basisType: 'serving' as const, servingName: 'one piece', servingQuantity: '1', servingUnit: 'piece', nutrients: { energyKcal: '62', ironMg: null, vitaminDMcg: '0.4' }, nutrientUnits: { energyKcal: 'kcal', vitaminDMcg: 'mcg' }, source: 'Manual label', provenance: { manuallyReviewed: true } };
  assert.equal(nutritionProfileSchema.safeParse(base).success, true);
  assert.equal(nutritionProfileSchema.safeParse({ ...base, nutrientUnits: { energyKcal: 'kcal' } }).success, false);
  assert.equal(nutritionProfileSchema.safeParse({ ...base, servingUnit: undefined }).success, false);
  assert.equal(nutritionProfileSchema.safeParse({ ...base, surprise: 'reject' }).success, false);
});

test('profile validation stores age as years and requires a height unit with height', () => {
  assert.equal(profileSchema.safeParse({ ageYears: 17, height: '150', heightUnit: 'cm', fitnessGoal: 'balanced', preferences: [], restrictions: [], allergies: [] }).success, true);
  assert.equal(profileSchema.safeParse({ ageYears: 17, height: '150', preferences: [], restrictions: [], allergies: [] }).success, false);
  assert.equal(profileSchema.safeParse({ ageYears: 121, preferences: [], restrictions: [], allergies: [] }).success, false);
});

test('profile validation accepts a user-set daily protein goal but rejects nonpositive or implausibly large inputs', () => {
  const base = { preferences: [], restrictions: [], allergies: [] };
  assert.equal(profileSchema.safeParse({ ...base, proteinTargetGPerDay: '120' }).success, true);
  assert.equal(profileSchema.safeParse({ ...base, proteinTargetGPerDay: null }).success, true);
  assert.equal(profileSchema.safeParse({ ...base, proteinTargetGPerDay: '0' }).success, false);
  assert.equal(profileSchema.safeParse({ ...base, proteinTargetGPerDay: '501' }).success, false);
});

test('plan revisions require a complete operation and separate serving measures', () => {
  assert.equal(actionSchema.safeParse({ action: 'plan.item.revise', data: { planId: 1, itemId: 2, operation: 'adjust', quantity: '150', unit: 'g' } }).success, true);
  assert.equal(actionSchema.safeParse({ action: 'plan.item.revise', data: { planId: 1, operation: 'add', foodId: 5, quantity: '2', unit: 'piece', mealType: 'SNACK' } }).success, true);
  assert.equal(actionSchema.safeParse({ action: 'plan.item.revise', data: { planId: 1, itemId: 2, operation: 'remove' } }).success, true);
  assert.equal(actionSchema.safeParse({ action: 'plan.item.revise', data: { planId: 1, itemId: 2, operation: 'adjust', unit: 'g' } }).success, false);
  assert.equal(actionSchema.safeParse({ action: 'plan.item.revise', data: { planId: 1, itemId: 2, operation: 'replace', foodId: 5, quantity: '1', unit: 'kg', extra: true } }).success, false);
});

test('actions reject unknown payload fields and do not grant sensitive AI consent while AI is disabled', () => {
  assert.equal(actionSchema.safeParse({ action: 'budget.save', data: { date: '2026-11-18', amountMinor: '15000', currency: 'ETB', mealsCount: 3, extra: true } }).success, false);
  assert.equal(actionSchema.safeParse({ action: 'settings.save', data: { financeIntegrationEnabled: false, aiEnabled: false, sensitiveAiConsent: true } }).success, false);
  assert.equal(actionSchema.safeParse({ action: 'finance-link.create', data: { inventoryLotId: 1 } }).success, false);
  assert.equal(actionSchema.safeParse({ action: 'finance-link.create', data: { inventoryLotId: 1, confirmed: true } }).success, true);
});

test('progress entries reject future dates while accepting a past dated weight', () => {
  const input = { weight: '60', weightUnit: 'kg', recordedAt: '2099-01-01T00:00:00.000Z' };
  assert.equal(progressSchema.safeParse(input).success, false);
  assert.equal(progressSchema.safeParse({ ...input, recordedAt: '2020-01-01T00:00:00.000Z' }).success, true);
});

test('water intake uses positive millilitres, idempotency and no future dates', () => {
  assert.equal(hydrationSchema.safeParse({ amountMl: '250', idempotencyKey: '123e4567-e89b-12d3-a456-426614174000' }).success, true);
  assert.equal(hydrationSchema.safeParse({ amountMl: '0', idempotencyKey: '123e4567-e89b-12d3-a456-426614174000' }).success, false);
  assert.equal(hydrationSchema.safeParse({ amountMl: '250', idempotencyKey: '123e4567-e89b-12d3-a456-426614174000', recordedAt: '2099-01-01T00:00:00.000Z' }).success, false);
});
