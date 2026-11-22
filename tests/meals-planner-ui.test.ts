import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(new URL('../components/admin/MealsNutritionWorkspace.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../app/api/admin/meals/route.ts', import.meta.url), 'utf8');

test('planner does not present catalog-only foods or a hard-coded 1 g serving as recommendations', () => {
  assert.match(component, /const plannerFoods=foods\.filter/);
  assert.match(component, /hasServing[\s\S]*hasStock/);
  assert.match(component, /suggestedServingQuantity/);
  assert.doesNotMatch(component, /defaultValue="1" required aria-label="New item quantity"/);
  assert.match(component, /No foods are ready to plan yet/);
  assert.match(component, /catalog foods are not stock/);
  assert.match(component, /href="\/admin\/meals\/spending#purchase-inventory"/);
  assert.match(component, /id="purchase-inventory"/);
});

test('empty state reports live stock, missing suggested portions, and unverified estimates', () => {
  assert.match(component, /Current stock is recorded for/);
  assert.match(component, /need a suggested serving size/);
  assert.match(component, /estimateStatus==='estimated_unverified'/);
  assert.match(component, /not lab-verified/);
  assert.match(component, /const plannerReadyMessage=/);
  assert.match(component, /treat them as estimates/);
  assert.match(component, /href="\/admin\/meals\/foods#nutrition-profile"/);
  assert.match(component, /id="nutrition-profile"/);
});

test('a generation with no eligible meals does not persist an empty plan', () => {
  assert.match(route, /if\(!selected\.meals\.length\)return \{plan:null,planItems:\[\]/);
});
