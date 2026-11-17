export const CATEGORY_ORDER = ['ESSENTIAL', 'BUSINESS', 'EMERGENCY', 'LONG_TERM_INVESTMENT', 'LEARNING', 'ENJOYMENT'] as const;
export type AllocationCategory = typeof CATEGORY_ORDER[number];
export type PlanBasisPoints = {
  givingBp: number;
  essentialBp: number;
  businessBp: number;
  emergencyBp: number;
  investmentBp: number;
  learningBp: number;
  enjoymentBp: number;
};
export type AllocationResult = { givingMinor: string; remainingMinor: string; categories: Record<AllocationCategory, string>; totalMinor: string };

const FOUR_DECIMAL = new Set(['CLF','UYW']);
const CURRENCY_FALLBACK = new Set(['AED','AUD','CAD','CHF','CLF','CNY','EUR','GBP','INR','JPY','KES','KWD','MXN','NOK','NZD','SAR','SEK','USD','UYW','ZAR']);
const intlCurrencyValues = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
const SUPPORTED_CURRENCIES = new Set([...(intlCurrencyValues ? intlCurrencyValues.call(Intl, 'currency') : CURRENCY_FALLBACK), ...FOUR_DECIMAL]);

export function currencyExponent(currency: string): number {
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !SUPPORTED_CURRENCIES.has(code)) throw new Error('Choose a supported ISO 4217 currency code.');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function parseMoneyToMinor(value: string, currency: string, options: { allowZero?: boolean; allowNegative?: boolean } = {}): string {
  const exponent = currencyExponent(currency);
  const match = value.trim().match(options.allowNegative ? /^(-?)(\d+)(?:\.(\d*))?$/ : /^(\d+)(?:\.(\d*))?$/);
  if (!match) throw new Error('Enter a valid amount using digits and a decimal point.');
  const negative = options.allowNegative ? match[1] === '-' : false;
  const major = options.allowNegative ? match[2] : match[1];
  const fraction = options.allowNegative ? match[3] ?? '' : match[2] ?? '';
  if (fraction.length > exponent) throw new Error(`${currency.toUpperCase()} supports at most ${exponent} decimal places.`);
  const scale = BigInt(10) ** BigInt(exponent);
  const minor = BigInt(major) * scale + BigInt((fraction + '0'.repeat(exponent)).slice(0, exponent) || '0');
  if (!options.allowZero && minor === BigInt(0)) throw new Error('Amount must be greater than zero.');
  if (!options.allowNegative && negative) throw new Error('Amount cannot be negative.');
  return (negative ? -minor : minor).toString();
}

export function formatMinor(minorValue: string | bigint, currency: string): string {
  const exponent = currencyExponent(currency);
  const minor = BigInt(minorValue);
  const negative = minor < BigInt(0);
  const absolute = negative ? -minor : minor;
  const scale = BigInt(10) ** BigInt(exponent);
  const whole = absolute / scale;
  const fraction = exponent ? (absolute % scale).toString().padStart(exponent, '0') : '';
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(whole);
  return `${currency.toUpperCase()} ${negative ? '-' : ''}${grouped}${exponent ? `.${fraction}` : ''}`;
}

export function formatMajorInput(minorValue: string | bigint, currency: string): string {
  const exponent = currencyExponent(currency);
  const minor = BigInt(minorValue);
  const negative = minor < BigInt(0);
  const absolute = negative ? -minor : minor;
  const scale = BigInt(10) ** BigInt(exponent);
  const whole = absolute / scale;
  const fraction = exponent ? (absolute % scale).toString().padStart(exponent, '0') : '';
  return `${negative ? '-' : ''}${whole.toString()}${exponent ? `.${fraction}` : ''}`;
}

export function parsePercentToBasisPoints(value: string): number {
  const match = value.trim().match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error('Enter a percentage with up to two decimal places.');
  const bp = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  if (bp < 0 || bp > 10000) throw new Error('Percentage must be from 0% to 100%.');
  return bp;
}

export function formatBasisPoints(bp: number): string {
  const whole = Math.floor(bp / 100);
  const fraction = String(bp % 100).padStart(2, '0').replace(/0+$/, '');
  return `${whole}${fraction ? `.${fraction}` : ''}%`;
}

export const DEFAULT_PLAN: PlanBasisPoints = {
  givingBp: 1000,
  essentialBp: 3000,
  businessBp: 3000,
  emergencyBp: 1500,
  investmentBp: 1000,
  learningBp: 1000,
  enjoymentBp: 500,
};

export function allocateReceivedIncome(amountMinorValue: string | bigint, plan: PlanBasisPoints = DEFAULT_PLAN): AllocationResult {
  const amountMinor = BigInt(amountMinorValue);
  if (amountMinor <= BigInt(0)) throw new Error('Received income must be greater than zero.');
  const shares = [plan.essentialBp, plan.businessBp, plan.emergencyBp, plan.investmentBp, plan.learningBp, plan.enjoymentBp];
  if (shares.some((share) => !Number.isInteger(share) || share < 0 || share > 10000) || shares.reduce((sum, share) => sum + share, 0) !== 10000) {
    throw new Error('The six post-giving allocation shares must be non-negative and sum to exactly 100%.');
  }
  if (!Number.isInteger(plan.givingBp) || plan.givingBp < 0 || plan.givingBp > 10000) throw new Error('The first-stage giving rate must be from 0% to 100%.');
  const denominator = BigInt(10000);
  const givingNumerator = amountMinor * BigInt(plan.givingBp);
  const givingMinor = (givingNumerator + BigInt(5000)) / denominator;
  const remainingMinor = amountMinor - givingMinor;
  const raw = shares.map((share, index) => {
    const product = remainingMinor * BigInt(share);
    return { index, base: product / denominator, remainder: product % denominator };
  });
  let unitsLeft = remainingMinor - raw.reduce((sum, entry) => sum + entry.base, BigInt(0));
  const ranking = [...raw].sort((left, right) => left.remainder === right.remainder ? left.index - right.index : left.remainder > right.remainder ? -1 : 1);
  const amounts = raw.map((entry) => entry.base);
  for (let index = 0; unitsLeft > BigInt(0); index += 1, unitsLeft -= BigInt(1)) amounts[ranking[index % ranking.length].index] += BigInt(1);
  const categories = Object.fromEntries(CATEGORY_ORDER.map((key, index) => [key, amounts[index].toString()])) as Record<AllocationCategory, string>;
  const totalMinor = givingMinor + amounts.reduce((sum, value) => sum + value, BigInt(0));
  if (totalMinor !== amountMinor) throw new Error('Allocation did not reconcile to the received income.');
  return { givingMinor: givingMinor.toString(), remainingMinor: remainingMinor.toString(), categories, totalMinor: totalMinor.toString() };
}

export function monthRange(month: string, monthStartDay = 1): { start: string; endExclusive: string } {
  if (!/^\d{4}-\d{2}$/.test(month) || Number(month.slice(5,7)) < 1 || Number(month.slice(5,7)) > 12 || !Number.isInteger(monthStartDay) || monthStartDay < 1 || monthStartDay > 28) throw new Error('Invalid financial month.');
  const [year, monthIndex] = month.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, monthIndex - 1, monthStartDay));
  const endDate = new Date(Date.UTC(year, monthIndex, monthStartDay));
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return { start: iso(startDate), endExclusive: iso(endDate) };
}


export function currentFinancialMonth(date = new Date(), monthStartDay = 1): string {
  if (!Number.isInteger(monthStartDay) || monthStartDay < 1 || monthStartDay > 28) throw new Error('Financial month start day must be 1–28.');
  const monthOffset = date.getUTCDate() < monthStartDay ? -1 : 0;
  const startMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1));
  return `${startMonth.getUTCFullYear()}-${String(startMonth.getUTCMonth() + 1).padStart(2, '0')}`;
}
