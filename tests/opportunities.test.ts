import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_STAGES,
  assertPublicHttpsUrl,
  canonicalizeJobUrl,
  findPotentialDuplicates,
  isValidHttpsUrl,
  normalizeCompanyTitle,
} from '../lib/services/opportunity-management';

test('application pipeline exposes the ten requested stages in order', () => {
  assert.deepEqual(APPLICATION_STAGES, [
    'SAVED', 'REVIEWING', 'READY_TO_APPLY', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'ARCHIVED',
  ]);
});

test('canonical job URLs remove fragments and known tracking parameters but retain meaningful query data', () => {
  assert.equal(
    canonicalizeJobUrl('https://Example.com/careers/role/?utm_source=mail&ref=board&team=design#apply'),
    'https://example.com/careers/role?team=design',
  );
  assert.equal(canonicalizeJobUrl('https://example.com/jobs?id=42'), 'https://example.com/jobs?id=42');
  assert.equal(canonicalizeJobUrl('https://example.com/jobs?id=43'), 'https://example.com/jobs?id=43');
  assert.notEqual(canonicalizeJobUrl('https://example.com/jobs?id=42'), canonicalizeJobUrl('https://example.com/jobs?id=43'));
});

test('unsafe URL forms are rejected for listing and application links', () => {
  assert.equal(isValidHttpsUrl('https://jobs.example/role'), true);
  assert.equal(isValidHttpsUrl(''), true);
  assert.equal(isValidHttpsUrl('http://jobs.example/role'), false);
  assert.equal(isValidHttpsUrl('https://user:pass@jobs.example/role'), false);
  assert.equal(canonicalizeJobUrl('javascript:alert(1)'), null);
  assert.equal(canonicalizeJobUrl('http://jobs.example/role'), null);
});

test('company and title normalization is stable across punctuation and accents', () => {
  assert.equal(normalizeCompanyTitle('Café & Co., Inc.'), 'cafe co inc');
  assert.equal(normalizeCompanyTitle('  Staff Engineer — Platform  '), 'staff engineer platform');
});

test('duplicate detection catches normalized URL and company/title pairs without merging distinct jobs', () => {
  const existing = [
    { id: 1, title: 'Senior Engineer', companyName: 'Acme, Inc.', originalListingUrl: 'https://jobs.acme.com/role?utm_campaign=x' },
    { id: 2, title: 'Product Designer', companyName: 'Acme, Inc.', originalListingUrl: 'https://jobs.acme.com/design-role' },
    { id: 3, title: 'Senior Engineer', companyName: 'Other Co', originalListingUrl: 'https://other.example/engineer' },
  ];
  const urlMatches = findPotentialDuplicates({ title: 'Senior Engineer', companyName: 'Different employer', originalListingUrl: 'https://jobs.acme.com/role#apply' }, existing);
  assert.equal(urlMatches.length, 1);
  assert.equal(urlMatches[0].id, 1);
  assert.equal(urlMatches[0].reason, 'matching_url');
  assert.equal(urlMatches[0].identityMatches, false);

  const sameJob = findPotentialDuplicates({ title: 'Senior Engineer', companyName: 'Acme Inc.', originalListingUrl: 'https://jobs.acme.com/role' }, [existing[0]]);
  assert.equal(sameJob[0].identityMatches, true);

  const identityMatches = findPotentialDuplicates({ title: 'senior engineer', companyName: 'ACME Inc.' }, existing);
  assert.equal(identityMatches.length, 1);
  assert.equal(identityMatches[0].id, 1);
  assert.equal(identityMatches[0].reason, 'matching_company_and_title');

  const distinct = findPotentialDuplicates({ title: 'Staff Engineer', companyName: 'Acme Inc.' }, existing);
  assert.deepEqual(distinct, []);
});

test('duplicate detection checks source evidence URLs while preserving historical records', () => {
  const result = findPotentialDuplicates(
    { title: 'Frontend Engineer', companyName: 'Example', applicationUrl: 'https://apply.example/abc?utm_source=x' },
    [{ id: 9, title: 'Web Developer', companyName: 'Example', evidence: [{ sourceUrl: 'https://apply.example/abc' }] }],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].reason, 'matching_url');
});

test('URL research rejects loopback, private hosts, and non-HTTPS schemes before fetching', async () => {
  await assert.rejects(() => assertPublicHttpsUrl('http://example.com/job'), /HTTPS/);
  await assert.rejects(() => assertPublicHttpsUrl('https://localhost/job'), /Private and local/);
  await assert.rejects(() => assertPublicHttpsUrl('https://127.0.0.1/job'), /Private and local/);
  await assert.rejects(() => assertPublicHttpsUrl('https://10.1.2.3/job'), /Private and local/);
  await assert.rejects(() => assertPublicHttpsUrl('https://[::1]/job'), /Private and local/);
  await assert.rejects(() => assertPublicHttpsUrl('https://[::ffff:7f00:1]/job'), /Private and local/);
});
