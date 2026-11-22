import { z } from 'zod';
import { currencyExponent } from '../finance/money';

const id = z.number().int().positive().safe();
const text = (max = 240) => z.string().trim().max(max);
const nonempty = (max = 240) => z.string().trim().min(1).max(max);
const decimal = z.union([
  z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/),
  z.number().finite().nonnegative().transform((n) => String(n)),
]);
const positiveDecimal = decimal.refine((value) => /[1-9]/.test(value), 'Value must be greater than zero.');
const signedDecimal = z.union([
  z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d{1,6})?$/),
  z.number().finite().transform((n) => String(n)),
]);
const minor = z.union([
  z.string().regex(/^(?:0|[1-9]\d*)$/),
  z.number().int().nonnegative().safe().transform(String),
]);
const currency = z.string().trim().regex(/^[A-Za-z]{3}$/).transform((s) => s.toUpperCase()).refine((code)=>{try{currencyExponent(code);return true}catch{return false}},'Choose a supported ISO 4217 currency.');
const unit = z.enum(['g', 'kg', 'ml', 'l', 'piece', 'serving']);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const tags = z.array(z.string().trim().min(1).max(80)).max(80).default([]);

export const foodCreateSchema = z.object({
  name: nonempty(160), category: text(100).default('Other'), unit,
  pieceCount: positiveDecimal.optional(), totalWeight: positiveDecimal.optional(),
  totalWeightUnit: z.enum(['g','kg']).optional(), priceMinor: minor.nullable().optional(),
  currency: currency.default('ETB'), priceUnit: text(32).optional(), preparation: text(120).optional(),
  availability: z.enum(['AVAILABLE', 'UNAVAILABLE', 'LOW_STOCK']).default('AVAILABLE'),
  expiresAt: date.nullable().optional(), imageRef: text(1000).optional(), notes: text(2000).optional(),
  allergens: tags, dietTags: tags, restrictions: tags,
}).strict().refine((value) => (value.totalWeight === undefined) === (value.totalWeightUnit === undefined), {
  message: 'Total weight and its unit must be entered together.', path: ['totalWeightUnit'],
});

export const foodUpdateSchema=z.object({foodId:id,name:nonempty(160),category:text(100).default('Other'),pieceCount:positiveDecimal.nullable(),totalWeight:positiveDecimal.nullable(),totalWeightUnit:z.enum(['g','kg']).nullable(),priceMinor:minor.nullable(),currency:currency,priceUnit:text(32).nullable(),preparation:text(120).nullable(),availability:z.enum(['AVAILABLE','UNAVAILABLE','LOW_STOCK']),expiresAt:date.nullable(),imageRef:text(1000).nullable(),notes:text(2000).nullable(),allergens:tags,dietTags:tags,restrictions:tags}).strict().refine((value)=>(value.totalWeight===null)===(value.totalWeightUnit===null),{message:'Total weight and its unit must be entered together.',path:['totalWeightUnit']});

export const nutritionProfileSchema = z.object({
  foodId: id, basisType: z.enum(['100g', '100ml', 'serving']), servingName: text(100).optional(),
  servingQuantity: positiveDecimal.optional(), servingUnit: unit.optional(),
  suggestedServingQuantity: positiveDecimal.optional(), suggestedServingUnit: unit.optional(),
  nutrients: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/), z.union([decimal, z.null()])).refine((o) => Object.keys(o).length <= 80),
  nutrientUnits: z.record(z.string().max(80), z.string().trim().min(1).max(30)).optional(),
  source: nonempty(160), sourceDate: date.nullable().optional(), sourceVersion: text(120).optional(),
  sourceUrl: z.string().url().max(2000).nullable().optional(),
  provenance: z.record(z.string().max(80), z.unknown()).optional(), confidence: z.number().min(0).max(1).nullable().optional(),
}).strict().refine((value) => value.basisType !== 'serving' || Boolean(value.servingName && value.servingQuantity && value.servingUnit), {
  message: 'A named serving requires its name, quantity and unit.', path: ['servingQuantity'],
}).refine((value) => Object.keys(value.nutrientUnits ?? {}).every((key) => key in value.nutrients), {
  message: 'Every nutrient unit must match a value entered in this profile.', path: ['nutrientUnits'],
}).refine((value)=>Object.entries(value.nutrients).every(([key,amount])=>amount===null||Boolean(value.nutrientUnits?.[key])),{
  message: 'Every known nutrient value requires an explicit unit.', path: ['nutrientUnits'],
});

export const inventoryPurchaseSchema = z.object({
  foodId: id, quantity: positiveDecimal, unit, pieces: positiveDecimal.optional(), weight: positiveDecimal.optional(),
  weightUnit: z.enum(['g','kg']).optional(), priceMinor: minor, currency: currency.default('ETB'),
  expiresAt: date.nullable().optional(), notes: text(1000).optional(),
}).strict().refine((value) => (value.weight === undefined) === (value.weightUnit === undefined), {
  message: 'Weight and its unit must be entered together.', path: ['weightUnit'],
});

export const inventoryAdjustSchema = z.object({
  lotId: id, quantityDelta: signedDecimal, unit,
  piecesDelta: signedDecimal.optional(), weightDelta: signedDecimal.nullable().optional(), weightUnit: z.enum(['g','kg']).optional(),
  reason: nonempty(240), idempotencyKey: z.string().uuid(),
}).strict().refine((value) => (value.weightDelta == null) === (value.weightUnit === undefined), {
  message: 'Weight adjustment and its unit must be entered together.', path: ['weightUnit'],
}).refine((value) => Number(value.quantityDelta) !== 0 || Number(value.piecesDelta ?? '0') !== 0 || Number(value.weightDelta ?? '0') !== 0, {
  message: 'Enter a non-zero inventory adjustment.', path: ['quantityDelta'],
});

export const profileSchema = z.object({
  ageYears: z.number().int().min(0).max(120).nullable().optional(), height: positiveDecimal.nullable().optional(),
  heightUnit: z.enum(['cm', 'in']).nullable().optional(), birthDate: date.nullable().optional(),
  sex: text(40).nullable().optional(), activityLevel: text(80).nullable().optional(), fitnessGoal: z.enum(['weight_gain', 'maintenance', 'weight_loss', 'balanced']).nullable().optional(),
  proteinTargetGPerDay: positiveDecimal.nullable().optional().refine((value) => value == null || Number(value) <= 500, 'Protein goal must be 500 g/day or less.'),
  preferences: tags, restrictions: tags, allergies: tags, mealFrequency: z.number().int().min(1).max(10).nullable().optional(),
  weightKg: positiveDecimal.nullable().optional(), pregnantOrLactating: z.boolean().nullable().optional(),
  eatingDisorderConcern: z.boolean().nullable().optional(), medicalCondition: text(1000).nullable().optional(),
}).strict().refine((value) => (value.height == null) === (value.heightUnit == null), {
  message: 'Height and its unit must be entered together.', path: ['heightUnit'],
});

export const budgetSchema = z.object({
  date, amountMinor: minor, currency: currency.default('ETB'), mealsCount: z.number().int().min(1).max(10).default(3), notes: text(1000).optional(),
}).strict();
export const consumptionSchema = z.object({
  planItemId: id.optional(), foodId: id, lotId: id.optional(), quantity: positiveDecimal, unit,
  pieces: positiveDecimal.optional(), weight: positiveDecimal.optional(), weightUnit: z.enum(['g','kg']).optional(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']), idempotencyKey: z.string().uuid(), notes: text(1000).optional(),
}).strict().refine((value) => (value.weight === undefined) === (value.weightUnit === undefined), {
  message: 'Weight and its unit must be entered together.', path: ['weightUnit'],
});
export const hydrationSchema=z.object({amountMl:positiveDecimal,recordedAt:z.string().datetime().optional(),idempotencyKey:z.string().uuid(),notes:text(500).optional()}).strict().refine((value)=>!value.recordedAt||new Date(value.recordedAt).getTime()<=Date.now(),{message:'Hydration record cannot be dated in the future.',path:['recordedAt']});

export const progressSchema = z.object({
  weight: positiveDecimal, weightUnit: z.enum(['kg', 'lb']), bodyFatPercent: decimal.nullable().optional(),
  measurements: z.record(z.string().max(60), positiveDecimal).optional(), notes: text(1000).optional(),
  recordedAt: z.string().datetime().optional(),
}).strict().refine((value) => value.bodyFatPercent == null || Number(value.bodyFatPercent) <= 100, {
  message: 'Body fat percentage cannot exceed 100.', path: ['bodyFatPercent'],
}).refine((value)=>!value.recordedAt||new Date(value.recordedAt).getTime()<=Date.now(),{message:'A progress record cannot be dated in the future.',path:['recordedAt']});

const settingsSchema = z.object({ financeIntegrationEnabled: z.boolean(), aiEnabled: z.boolean(), sensitiveAiConsent: z.boolean() }).strict()
  .refine((value) => !value.sensitiveAiConsent || value.aiEnabled, { message: 'Enable AI before granting sensitive-data consent.' });

const revisePlanSchema=z.object({planId:id,itemId:id.optional(),operation:z.enum(['adjust','replace','add','remove']),foodId:id.optional(),quantity:positiveDecimal.optional(),unit:unit.optional(),mealType:z.enum(['BREAKFAST','LUNCH','DINNER','SNACK','OTHER']).optional()}).strict().superRefine((value,ctx)=>{if(value.operation==='remove'&&!value.itemId)ctx.addIssue({code:'custom',message:'Choose a saved plan item to remove.',path:['itemId']});if(value.operation==='adjust'&&(!value.itemId||!value.quantity||!value.unit))ctx.addIssue({code:'custom',message:'A serving adjustment needs a saved item, quantity and unit.',path:['quantity']});if(value.operation==='replace'&&(!value.itemId||!value.foodId||!value.quantity||!value.unit))ctx.addIssue({code:'custom',message:'A replacement needs the old item, replacement food, quantity and unit.',path:['foodId']});if(value.operation==='add'&&(!value.foodId||!value.quantity||!value.unit))ctx.addIssue({code:'custom',message:'An added item needs a food, quantity and unit.',path:['foodId']});});

export const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('food.create'), data: foodCreateSchema }),
  z.object({ action: z.literal('food.update'), data: foodUpdateSchema }),
  z.object({ action: z.literal('nutrition-profile.save'), data: nutritionProfileSchema }),
  z.object({ action: z.literal('inventory.purchase'), data: inventoryPurchaseSchema }),
  z.object({ action: z.literal('inventory.adjust'), data: inventoryAdjustSchema }),
  z.object({ action: z.literal('profile.save'), data: profileSchema }),
  z.object({ action: z.literal('budget.save'), data: budgetSchema }),
  z.object({ action: z.literal('plan.generate'), date }),
  z.object({ action: z.literal('plan.accept'), planId: id }),
  z.object({ action: z.literal('plan.item.revise'), data: revisePlanSchema }),
  z.object({ action: z.literal('consumption.record'), data: consumptionSchema }),
  z.object({ action: z.literal('favorite.set'), foodId: id, favorite: z.boolean() }),
  z.object({ action: z.literal('favorite.plan.set'), planId: id, favorite: z.boolean() }),
  z.object({ action: z.literal('progress.record'), data: progressSchema }),
  z.object({ action: z.literal('hydration.record'), data: hydrationSchema }),
  z.object({ action: z.literal('settings.save'), data: settingsSchema }),
  z.object({ action: z.literal('finance-link.create'), data: z.object({ inventoryLotId: id, confirmed: z.literal(true) }).strict() }),
]);
export type MealsAction = z.infer<typeof actionSchema>;
