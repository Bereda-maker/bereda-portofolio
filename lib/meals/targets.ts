import { decimal } from './engine';

export type EerInput = {
  ageYears: number | null;
  heightCm: string | null;
  weightKg: string | null;
  weightRecordedAt: Date | string | null;
  biologicalSex: string | null;
  activityLevel: string | null;
  pregnantOrLactating: boolean | null;
  eatingDisorderConcern: boolean | null;
  medicalCondition: string | null;
};

export type EerEstimate = {
  kcalPerDay: string;
  equation: string;
  sexModel: 'female' | 'male';
  activityCategory: 'inactive' | 'low active' | 'active' | 'very active';
  ageYears: number;
  heightCm: string;
  weightKg: string;
  weightRecordedAt: string;
  referenceStandardErrorKcal: number;
  standardErrorContext: string;
  source: string;
  interpretation: string;
};

export type EerResult = { estimate: EerEstimate | null; reasons: string[] };

const EQUATIONS = {
  male: {
    inactive: { constant: '753.07', age: '-10.83', height: '6.50', weight: '14.10' },
    low_active: { constant: '581.47', age: '-10.83', height: '8.30', weight: '14.94' },
    active: { constant: '1004.82', age: '-10.83', height: '6.52', weight: '15.91' },
    very_active: { constant: '-517.88', age: '-10.83', height: '15.61', weight: '19.11' },
  },
  female: {
    inactive: { constant: '584.90', age: '-7.01', height: '5.72', weight: '11.71' },
    low_active: { constant: '575.77', age: '-7.01', height: '6.60', weight: '12.14' },
    active: { constant: '710.25', age: '-7.01', height: '6.54', weight: '12.34' },
    very_active: { constant: '511.83', age: '-7.01', height: '9.07', weight: '12.56' },
  },
} as const;

const SOURCE = 'https://www.ncbi.nlm.nih.gov/books/NBK591034/table/tab_S_3/?report=objectonly';
const UNCERTAINTY = 'The 2023 report gives a standard error of 241 kcal/day for women and 342 kcal/day for men at its sample-average adult covariates with active PAL; this is not a personal interval for these inputs. The report notes large individual uncertainty and says an intake-to-EER comparison alone does not establish energy adequacy.';

function normalizedSex(value: string | null): 'female' | 'male' | null {
  const sex = value?.trim().toLowerCase();
  if (sex === 'female' || sex === 'f' || sex === 'woman') return 'female';
  if (sex === 'male' || sex === 'm' || sex === 'man') return 'male';
  return null;
}

function normalizedActivity(value: string | null): keyof typeof EQUATIONS.male | null {
  const activity = value?.trim().toLowerCase();
  if (activity === 'inactive' || activity === 'sedentary') return 'inactive';
  if (activity === 'low_active' || activity === 'low active' || activity === 'light') return 'low_active';
  if (activity === 'active') return 'active';
  if (activity === 'very_active' || activity === 'very active') return 'very_active';
  return null;
}

function nearestKcal(value: string): string {
  const scaled = decimal.parse(value);
  const sign = scaled < BigInt(0) ? BigInt(-1) : BigInt(1);
  const absolute = scaled < BigInt(0) ? -scaled : scaled;
  const unit = BigInt(1000000);
  let whole = absolute / unit;
  if ((absolute % unit) * BigInt(2) >= unit) whole += BigInt(1);
  return (whole * sign).toString();
}

function validPositiveDecimal(value: string | null): value is string {
  if (!value) return false;
  try { return decimal.compare(value, '0') > 0; } catch { return false; }
}

export function estimateAdultEer(input: EerInput): EerResult {
  const reasons: string[] = [];
  if (input.ageYears === null || !Number.isInteger(input.ageYears) || input.ageYears < 19) reasons.push('The cited adult equation applies to ages 19 and older; no adult estimate is shown for a minor or for an age outside that range.');
  const sex = normalizedSex(input.biologicalSex);
  if (!sex) reasons.push('Choose Female or Male in the optional biological-sex field to use the matching published equation; no equation is inferred.');
  const activity = normalizedActivity(input.activityLevel);
  if (!activity) reasons.push('Choose a named NASEM activity category (Inactive, Low active, Active or Very active); an unspecified or ambiguous activity level is not mapped.');
  if (!validPositiveDecimal(input.heightCm)) reasons.push('A positive height in centimetres is needed.');
  if (!validPositiveDecimal(input.weightKg)) reasons.push('A positive, dated body-weight record in kilograms is needed.');
  const weightDate=input.weightRecordedAt instanceof Date?input.weightRecordedAt:input.weightRecordedAt?new Date(input.weightRecordedAt):null;const weightDateValid=weightDate!==null&&!Number.isNaN(weightDate.getTime())&&weightDate.getTime()<=Date.now();if(!weightDateValid)reasons.push('A valid past date is required for the most recent weight record.');else if(Date.now()-weightDate!.getTime()>366*24*60*60*1000)reasons.push('The latest weight record is over a year old; record a recent weight before viewing an estimate.');
  if (input.pregnantOrLactating === true) reasons.push('This adult equation is not used for pregnancy or lactation; seek individualized professional guidance.');
  else if (input.pregnantOrLactating !== false) reasons.push('Confirm pregnancy/lactation status as No before showing this non-pregnant adult equation.');
  if (input.eatingDisorderConcern === true) reasons.push('A reported eating-disorder concern suppresses calorie estimates; seek qualified professional guidance.');
  else if (input.eatingDisorderConcern !== false) reasons.push('Confirm eating-disorder concern as No before showing a calorie estimate.');
  const condition = input.medicalCondition?.trim().toLowerCase() ?? '';
  if (condition && !['none', 'no', 'n/a', 'na'].includes(condition)) reasons.push('A reported medical condition suppresses this estimate; seek individualized professional guidance.');
  if (reasons.length || !sex || !activity || input.ageYears === null || !validPositiveDecimal(input.heightCm) || !validPositiveDecimal(input.weightKg) || !weightDateValid || Date.now()-weightDate!.getTime()>366*24*60*60*1000) return { estimate: null, reasons };

  const equation = EQUATIONS[sex][activity];
  const raw = decimal.add(
    decimal.add(equation.constant, decimal.multiply(equation.age, String(input.ageYears))),
    decimal.add(decimal.multiply(equation.height, input.heightCm), decimal.multiply(equation.weight, input.weightKg)),
  );
  if (decimal.compare(raw, '0') <= 0) return { estimate: null, reasons: ['The entered values do not yield a valid positive result; check the profile values.'] };

  const category = activity === 'low_active' ? 'low active' : activity === 'very_active' ? 'very active' : activity;
  const expression = `${equation.constant} ${equation.age.startsWith('-') ? '−' : '+'} ${equation.age.replace('-', '')} × age + ${equation.height} × height (cm) + ${equation.weight} × weight (kg)`;
  return {
    estimate: {
      kcalPerDay: nearestKcal(raw),
      equation: `EER = ${expression}`,
      sexModel: sex,
      activityCategory: category,
      ageYears: input.ageYears,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      weightRecordedAt: weightDate!.toISOString(),
      referenceStandardErrorKcal: sex === 'female' ? 241 : 342,
      standardErrorContext: UNCERTAINTY,
      source: SOURCE,
      interpretation: 'This is a population-based estimate of energy needs for weight stability, not a prescription or a weight-gain/loss target. It is not adjusted for the selected fitness goal. Individual needs vary, and the selected activity category may not describe your actual activity accurately.',
    },
    reasons: [],
  };
}


export function poundsToKilograms(value: string): string {
  const input = decimal.parse(value);
  if (input < BigInt(0)) throw new Error('Weight must be non-negative.');
  const numerator = input * BigInt(45359237);
  const denominator = BigInt(100000000);
  let result = numerator / denominator;
  if ((numerator % denominator) * BigInt(2) >= denominator) result += BigInt(1);
  return decimal.format(result);
}
