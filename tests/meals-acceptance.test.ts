import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(new URL('../app/api/admin/meals/route.ts', import.meta.url), 'utf8');

test('the public plan.accept action delegates to transactional acceptance validation', () => {
  assert.match(route, /case 'plan\.accept':\s*return acceptPlan\(db,\s*s,\s*owner,\s*action\.planId\)/);
  assert.doesNotMatch(route, /case 'plan\.accept':\s*\{[\s\S]{0,500}?set\(\{\s*status:\s*'ACCEPTED'/);
});

test('acceptance serializes competing plans and rejects stale safety or stock conditions', () => {
  const start = route.indexOf('async function acceptPlan(');
  const end = route.indexOf('\nasync function recordConsumption', start);
  assert.ok(start >= 0 && end > start, 'acceptPlan helper must remain present');
  const helper = route.slice(start, end);
  assert.match(helper, /mealsSettings\)\.values\(\{id:true\}\)\.onConflictDoNothing\(\)/);
  assert.match(helper, /mealsSettings\)\.where\(eq\(s\.mealsSettings\.id,true\)\)\.for\('update'\)/);
  assert.match(helper, /plan\.status!=='DRAFT'/);
  assert.match(helper, /food\.allergens\.some\([\s\S]*allergies/);
  assert.match(helper, /food\.restrictions\.some\([\s\S]*restrictions/);
  assert.match(helper, /food\.expiresAt&&food\.expiresAt<plan\.planDate/);
  assert.match(helper, /decimal\.compare\(available,need\)<0/);
  assert.match(helper, /status:'SUPERSEDED'/);
  assert.match(helper, /active\.map\(\(p\)=>p\.id\)/);
});
