import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateReceivedIncome, currencyExponent, DEFAULT_PLAN, formatMinor, monthRange, parseMoneyToMinor, parsePercentToBasisPoints } from '../lib/finance/money';

test('the 10,000 ETB example gives 10% first and applies six shares to the remaining 90%', () => {
  const result = allocateReceivedIncome(parseMoneyToMinor('10000', 'ETB'));
  assert.equal(result.givingMinor, '100000');
  assert.equal(result.remainingMinor, '900000');
  assert.deepEqual(result.categories, { ESSENTIAL: '270000', BUSINESS: '270000', EMERGENCY: '135000', LONG_TERM_INVESTMENT: '90000', LEARNING: '90000', ENJOYMENT: '45000' });
  assert.equal(result.totalMinor, '1000000');
});

test('small amounts use deterministic largest remainders and reconcile exactly', () => {
  for (const amount of ['1', '2', '3', '7', '11', '99']) {
    const result = allocateReceivedIncome(amount);
    const sum = BigInt(result.givingMinor) + Object.values(result.categories).reduce((total, value) => total + BigInt(value), BigInt(0));
    assert.equal(sum.toString(), amount);
    assert.equal(result.totalMinor, amount);
  }
});

test('multi-currency minor unit exponents are respected for ETB, USD, JPY and KWD', () => {
  assert.equal(parseMoneyToMinor('10.05', 'ETB'), '1005');
  assert.equal(parseMoneyToMinor('10.05', 'USD'), '1005');
  assert.equal(parseMoneyToMinor('10', 'JPY'), '10');
  assert.equal(currencyExponent('KWD'), 3);
  assert.equal(currencyExponent('CLF'), 4);
  assert.equal(currencyExponent('UYW'), 4);
  assert.equal(parseMoneyToMinor('1.2345', 'CLF'), '12345');
  assert.equal(formatMinor('12345', 'CLF'), 'CLF 1.2345');
  assert.throws(() => currencyExponent('ZZZ'));
  assert.equal(parseMoneyToMinor('1.234', 'KWD'), '1234');
  assert.equal(formatMinor('1234', 'KWD'), 'KWD 1.234');
  assert.throws(() => parseMoneyToMinor('10.5', 'JPY'));
  assert.throws(() => parseMoneyToMinor('1.2345', 'KWD'));
});

test('allocation rates must sum to 100% after giving', () => {
  assert.throws(() => allocateReceivedIncome('100', { ...DEFAULT_PLAN, enjoymentBp: 600 }));
  assert.throws(() => allocateReceivedIncome('0'));
});

test('percentages use basis points and preserve hundredths', () => {
  assert.equal(parsePercentToBasisPoints('13.5'), 1350);
  assert.equal(parsePercentToBasisPoints('4.50'), 450);
  assert.throws(() => parsePercentToBasisPoints('1.001'));
});

test('financial month boundaries use the configured start day', () => {
  assert.deepEqual(monthRange('2026-11', 15), { start: '2026-11-15', endExclusive: '2026-12-15' });
  assert.deepEqual(monthRange('2026-12', 1), { start: '2026-12-01', endExclusive: '2027-01-01' });
  assert.throws(() => monthRange('2026-11', 29));
});
