import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, gte, inArray, like } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { currencyExponent } from '@/lib/finance/money';
import { decimal, calculateNutrition, costForMeasurement, selectAffordableMeals, prorateMinorUnits, factorsFromFoodMeasurements, measurementInBasis, type FoodProfile, type MealCandidate, type Measurement, type Nutrient } from '@/lib/meals/engine';
import { actionSchema, type MealsAction } from '@/lib/meals/validation';
import { estimateAdultEer, poundsToKilograms } from '@/lib/meals/targets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
async function authorize(request?: NextRequest, mutation = false) {
  try {
    if (!(await isAdminRequest())) return response({ error: 'Unauthorized' }, 401);
  } catch { return response({ error: 'Admin authorization is unavailable.' }, 401); }
  if (mutation && request && !isSameOrigin(request)) return response({ error: 'Forbidden' }, 403);
  return null;
}
function dateNow() { return new Date().toISOString().slice(0, 10); }
function exponents(code: string) { try { return currencyExponent(code); } catch { return null; } }
function minorToMajor(value: string | number, code: string) {
  const exponent = exponents(code); if (exponent === null) throw new Error('Unsupported currency.');
  const s = String(value); const n = BigInt(s); const negative = n < BigInt(0); const abs = negative ? -n : n; const power = BigInt(10) ** BigInt(exponent);
  if (!exponent) return `${negative ? '-' : ''}${abs}`;
  const whole = abs / power; const fraction = (abs % power).toString().padStart(exponent, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}
function majorToMinor(value: string, code: string) {
  const exponent = exponents(code); if (exponent === null) throw new Error('Unsupported currency.');
  const match = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value); if (!match) throw new Error('Invalid money amount.');
  const frac = match[3] ?? ''; if (frac.length > exponent && /[^0]/.test(frac.slice(exponent + 1))) throw new Error('Money precision exceeds the currency minor unit.');
  const base = BigInt(match[2]) * (BigInt(10) ** BigInt(exponent));
  const cut = (frac.slice(0, exponent) + '0'.repeat(exponent)).slice(0, exponent);
  let amount = base + BigInt(cut || '0');
  if (frac.length > exponent && Number(frac[exponent]) >= 5) amount += BigInt(1);
  return `${match[1] === '-' ? '-' : ''}${amount}`;
}
function safeDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed=new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===value; }
function mapNutrients(values: Record<string, unknown>): Partial<Record<Nutrient, string>> {
  const output: Partial<Record<Nutrient, string>> = {};
  for (const [key, value] of Object.entries(values)) if (/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/.test(key) && typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) output[key] = value;
  return output;
}
function calculateAge(age?: number | null, asOf?: Date | string | null) { if(!Number.isInteger(age)||age!<0||age!>120)return null;if(!asOf)return age!;const saved=asOf instanceof Date?asOf:new Date(asOf);if(Number.isNaN(saved.getTime())||saved.getTime()>Date.now())return age!;const now=new Date();let elapsed=now.getUTCFullYear()-saved.getUTCFullYear();if(now.getUTCMonth()<saved.getUTCMonth()||(now.getUTCMonth()===saved.getUTCMonth()&&now.getUTCDate()<saved.getUTCDate()))elapsed--;return Math.min(120,age!+Math.max(0,elapsed)); }

function sumSnapshotNutrients(events: Array<{nutritionSnapshot:unknown}>) { const totals:Record<string,string>={}; for(const event of events){const data=event.nutritionSnapshot as Record<string,unknown>;for(const [key,value] of Object.entries(data??{})){if(key==='quantity'||key==='unit'||key==='source'||key==='profileVersion'||key==='confidence'||key==='provenance'||key==='unknown')continue;if(typeof value==='string'&&/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value))totals[key]=decimal.add(totals[key]??'0',value);}}return totals; }
function frequentFoods(events:Array<{foodId:number;idempotencyKey?:string|null}>,foods:Array<{id:number;name:string}>) { const counts=new Map<number,Set<string>>(); for(const e of events){const set=counts.get(e.foodId)??new Set<string>();set.add((e.idempotencyKey??String(e.foodId)).split(':')[0]);counts.set(e.foodId,set);} return Array.from(counts,([id,keys])=>({foodId:id,name:foods.find((f)=>f.id===id)?.name??'Unknown food',count:keys.size})).sort((a,b)=>b.count-a.count).slice(0,8); }
function scaleNutritionSnapshot(snapshot:Record<string,unknown>,amount:string,baseAmount:string) { const ratio=decimal.divide(amount,baseAmount); const out:Record<string,unknown>={...snapshot};for(const key of ['energyKcal','proteinG','carbohydrateG','fatG','saturatedFatG','fibreG','fiberG','sugarG','sodiumMg','potassiumMg','calciumMg','ironMg']){const value=snapshot[key];if(typeof value==='string'&&/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value))out[key]=decimal.multiply(value,ratio);}return out; }

export async function GET(request: NextRequest) {
  const denied = await authorize(request); if (denied) return denied;
  try {
    const [{ db }, s] = await Promise.all([import('@/lib/db'), import('@/lib/schema')]);
    const owner = 'admin';
    const [foods, nutritionProfiles, inventoryLots, profileRows, budgets, plans, planItems, consumptionEvents, favorites, progressRecords, settingsRows, hydrationEvents] = await Promise.all([
      db.select().from(s.mealsFoods).where(eq(s.mealsFoods.ownerKey, owner)).orderBy(asc(s.mealsFoods.name)),
      db.select().from(s.mealsNutritionProfiles).orderBy(desc(s.mealsNutritionProfiles.version)),
      db.select().from(s.mealsInventoryLots).where(eq(s.mealsInventoryLots.ownerKey, owner)).orderBy(asc(s.mealsInventoryLots.expiresAt)),
      db.select().from(s.mealsBodyProfiles).where(eq(s.mealsBodyProfiles.ownerKey, owner)).limit(1),
      db.select().from(s.mealsDailyBudgets).where(eq(s.mealsDailyBudgets.ownerKey, owner)).orderBy(desc(s.mealsDailyBudgets.budgetDate)).limit(120),
      db.select().from(s.mealsPlans).where(eq(s.mealsPlans.ownerKey, owner)).orderBy(desc(s.mealsPlans.planDate),desc(s.mealsPlans.updatedAt),desc(s.mealsPlans.id)).limit(120),
      db.select().from(s.mealsPlanItems).orderBy(asc(s.mealsPlanItems.itemOrder)),
      db.select().from(s.mealsConsumptionEvents).where(eq(s.mealsConsumptionEvents.ownerKey, owner)).orderBy(desc(s.mealsConsumptionEvents.consumedAt)).limit(500),
      db.select().from(s.mealsFavorites).where(eq(s.mealsFavorites.ownerKey, owner)),
      db.select().from(s.mealsWeightProgress).where(eq(s.mealsWeightProgress.ownerKey, owner)).orderBy(desc(s.mealsWeightProgress.recordedAt)).limit(500),
      db.select().from(s.mealsSettings).where(eq(s.mealsSettings.id, true)).limit(1),
      db.select().from(s.mealsHydrationEvents).where(eq(s.mealsHydrationEvents.ownerKey, owner)).orderBy(desc(s.mealsHydrationEvents.recordedAt)).limit(500),
    ]);
    const ownedFoodIds=new Set(foods.map((food)=>food.id)); const byFood = new Map<number, typeof nutritionProfiles[number]>();
    for (const item of nutritionProfiles) if (ownedFoodIds.has(item.foodId) && !byFood.has(item.foodId)) byFood.set(item.foodId, item);
    const today = dateNow(); const weekStart = new Date(`${today}T00:00:00Z`); weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const monthStart = `${today.slice(0, 7)}-01`;
    const spend = (from: string, to: string) => consumptionEvents.filter((e) => e.consumedAt.toISOString().slice(0, 10) >= from && e.consumedAt.toISOString().slice(0, 10) <= to).reduce((acc, e) => {
      if (e.costMinor == null || !e.currency) return acc; acc[e.currency] = (BigInt(acc[e.currency] ?? '0') + BigInt(e.costMinor)).toString(); return acc;
    }, {} as Record<string, string>);
    const actualPlanItems=planItems.map((item)=>({...item,foodName:foods.find((food)=>food.id===item.foodId)?.name??'Unknown food',foodCategory:foods.find((food)=>food.id===item.foodId)?.category??'Unknown'}));
    const monthEvents=consumptionEvents.filter((event)=>event.consumedAt.toISOString().slice(0,7)===today.slice(0,7));
    const hydrationToday=hydrationEvents.filter((event)=>event.recordedAt.toISOString().slice(0,10)===today).reduce((total,event)=>decimal.add(total,String(event.amountMl)),'0');const spendByCurrency=spend(monthStart,today);const monthNutrientsByCurrency:Record<string,Record<string,string>>={},nutrientCostsByCurrency:Record<string,Record<string,string>>={};const mealKeysByCurrency:Record<string,Set<string>>={};
    for(const event of monthEvents){if(!event.currency)continue;const currency=event.currency;mealKeysByCurrency[currency]??=new Set();mealKeysByCurrency[currency].add((event.idempotencyKey??String(event.id)).split(':')[0]);monthNutrientsByCurrency[currency]??={};const snapshot=event.nutritionSnapshot as Record<string,unknown>;for(const key of ['energyKcal','proteinG']){const value=snapshot?.[key];if(typeof value==='string'&&/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)){monthNutrientsByCurrency[currency][key]=decimal.add(monthNutrientsByCurrency[currency][key]??'0',value);if(event.costMinor!=null&&decimal.compare(value,'0')>0){nutrientCostsByCurrency[currency]??={};nutrientCostsByCurrency[currency][key]=(BigInt(nutrientCostsByCurrency[currency][key]??'0')+BigInt(event.costMinor)).toString();}}}}
    const efficiency=Object.entries(spendByCurrency).map(([currency,amountMinor])=>{const nutrients=monthNutrientsByCurrency[currency]??{};const meals=Math.max(1,mealKeysByCurrency[currency]?.size??0);const days=Math.max(1,Number(today.slice(8,10)));const averageDailyMinor=((BigInt(amountMinor)+BigInt(Math.floor(days/2)))/BigInt(days)).toString();const averageMealMinor=((BigInt(amountMinor)+BigInt(Math.floor(meals/2)))/BigInt(meals)).toString();return {currency,averageDailyMinor,averageMealMinor,costPerKcal:nutrients.energyKcal&&decimal.compare(nutrients.energyKcal,'0')>0&&nutrientCostsByCurrency[currency]?.energyKcal?decimal.divide(minorToMajor(nutrientCostsByCurrency[currency].energyKcal,currency),nutrients.energyKcal):null,costPerProteinGram:nutrients.proteinG&&decimal.compare(nutrients.proteinG,'0')>0&&nutrientCostsByCurrency[currency]?.proteinG?decimal.divide(minorToMajor(nutrientCostsByCurrency[currency].proteinG,currency),nutrients.proteinG):null,actualNutrients:nutrients};});
    const days7=Array.from({length:7},(_,index)=>{const d=new Date(`${today}T00:00:00Z`);d.setUTCDate(d.getUTCDate()-(6-index));const day=d.toISOString().slice(0,10);return {date:day,spend:spend(day,day)};});
    const latestPlanByDate=new Map<string,typeof plans[number]>();for(const plan of plans)if(plan.status!=='SUPERSEDED'&&!latestPlanByDate.has(plan.planDate))latestPlanByDate.set(plan.planDate,plan);const plannedMonth=Array.from(latestPlanByDate.values()).filter((plan)=>plan.planDate.slice(0,7)===today.slice(0,7)).reduce((acc,plan)=>{if(plan.costMinor!=null&&plan.currency)acc[plan.currency]=(BigInt(acc[plan.currency]??'0')+BigInt(plan.costMinor)).toString();return acc;},{} as Record<string,string>);
    const settings = settingsRows[0] ?? { financeIntegrationEnabled: false, aiEnabled: false, sensitiveAiConsent: false };let financeLinks:typeof s.mealsFinanceLinks.$inferSelect[]=[];const linkedFinanceMonth:Record<string,string>={};if(settings.financeIntegrationEnabled){const links=await db.select().from(s.mealsFinanceLinks).where(eq(s.mealsFinanceLinks.ownerKey,owner));financeLinks=links;const ids=links.map((link)=>link.financeTransactionId);if(ids.length){const linkedTransactions=await db.select().from(s.financeTransactions).where(inArray(s.financeTransactions.id,ids));for(const transaction of linkedTransactions)if(!transaction.deletedAt&&transaction.transactionDate.slice(0,7)===today.slice(0,7)){linkedFinanceMonth[transaction.currency]=(BigInt(linkedFinanceMonth[transaction.currency]??'0')+BigInt(transaction.amountMinor)).toString();}}}
    const savedProfile=profileRows[0];const profilePrefs=(savedProfile?.preferences??{}) as Record<string,unknown>;const excluded=new Set([...(Array.isArray(profilePrefs.allergies)?profilePrefs.allergies.map(String):[]),...(Array.isArray(savedProfile?.restrictions)?savedProfile.restrictions.map(String):[])].map((x)=>x.toLowerCase()));const proteinSourceMap=new Map<string,{foodId:number;name:string;currency:string;costPerProteinGram:string;unit:string}>();
    for(const food of foods){if(food.availability!=='AVAILABLE'||food.allergens.some((a)=>excluded.has(a.toLowerCase()))||food.restrictions.some((a)=>excluded.has(a.toLowerCase())))continue;const nutrition=byFood.get(food.id);if(!nutrition||nutrition.provenance?.manuallyReviewed!==true)continue;const values=mapNutrients(nutrition.nutrients as Record<string,unknown>);const basis=nutrition.basisType==='100g'?{kind:'per-100g' as const,values}:nutrition.basisType==='100ml'?{kind:'per-100ml' as const,values}:{kind:'per-serving' as const,servingName:nutrition.servingName??'serving',servingQuantity:nutrition.servingQuantity??undefined,servingUnit:(nutrition.servingUnit as Measurement['unit']|null)??undefined,servingGrams:['g','kg'].includes(nutrition.servingUnit??'')?nutrition.servingQuantity??undefined:undefined,servingMillilitres:['ml','l'].includes(nutrition.servingUnit??'')?nutrition.servingQuantity??undefined:undefined,values};const factors=factorsFromFoodMeasurements(food.totalWeight??undefined,food.totalWeightUnit??undefined,food.pieceCount??undefined);
      for(const lot of inventoryLots.filter((item)=>item.foodId===food.id&&decimal.compare(item.availableQuantity,'0')>0&&(!item.expiresAt||item.expiresAt>=today))){const portion:Measurement={amount:lot.purchasedQuantity,unit:lot.quantityUnit as Measurement['unit'],factors};const amount=calculateNutrition({id:String(food.id),name:food.name,basis,confirmed:true},portion);const protein=amount?.proteinG;if(!protein||decimal.compare(protein,'0')<=0)continue;const cost=decimal.divide(minorToMajor(lot.priceMinor,lot.currency),protein);const key=`${lot.currency}:${food.id}`;const prior=proteinSourceMap.get(key);if(!prior||decimal.compare(cost,prior.costPerProteinGram)<0)proteinSourceMap.set(key,{foodId:food.id,name:food.name,currency:lot.currency,costPerProteinGram:cost,unit:lot.quantityUnit});}}
    const affordableProteinSources=Array.from(proteinSourceMap.values()).sort((a,b)=>a.currency.localeCompare(b.currency)||decimal.compare(a.costPerProteinGram,b.costPerProteinGram)).slice(0,20);
    const latestWeight=progressRecords[0];const rawProfile=profileRows[0];const ageYears=calculateAge(rawProfile?.ageYears,rawProfile?.ageAsOf);const heightValue=rawProfile?.height==null?null:String(rawProfile.height);const heightCm=heightValue?(rawProfile?.heightUnit==='cm'?heightValue:rawProfile?.heightUnit==='in'?decimal.multiply(heightValue,'2.54'):null):null;const weightValue=latestWeight?.weight==null?null:String(latestWeight.weight);const weightKg=weightValue?(latestWeight?.weightUnit==='kg'?weightValue:latestWeight?.weightUnit==='lb'?poundsToKilograms(weightValue):null):null;const heightMetres=heightCm?decimal.divide(heightCm,'100'):'0';const bmi=ageYears!==null&&ageYears>=18&&latestWeight&&weightKg&&heightMetres!=='0'?(await import('@/lib/meals/engine')).adultBmi(weightKg,heightMetres,ageYears):null;const preferences=(rawProfile?.preferences??{}) as Record<string,unknown>;const energyEstimate={...estimateAdultEer({ageYears,heightCm,weightKg,weightRecordedAt:latestWeight?.recordedAt??null,biologicalSex:rawProfile?.sex??null,activityLevel:rawProfile?.activityLevel??null,pregnantOrLactating:typeof preferences.pregnantOrLactating==='boolean'?preferences.pregnantOrLactating:null,eatingDisorderConcern:typeof preferences.eatingDisorderConcern==='boolean'?preferences.eatingDisorderConcern:null,medicalCondition:typeof preferences.medicalCondition==='string'?preferences.medicalCondition:null}),weightRecordedAt:latestWeight?.recordedAt??null};const protectedProfile=rawProfile?{...rawProfile,privateNotes:undefined,ageYears,bmi}:null;
    return response({ foods, nutritionProfiles: Array.from(byFood.values()), inventoryLots, financeLinks:settings.financeIntegrationEnabled?financeLinks:[], profile: protectedProfile, energyEstimate, budgets, plans, planItems:actualPlanItems, consumptionEvents, favorites, progressRecords, hydrationEvents, settings, analytics: { hydrationTodayMl:hydrationToday, today: spend(today, today), week: spend(weekStart.toISOString().slice(0, 10), today), month: spend(monthStart, today), plannedMonth, linkedFinanceMonth:settings.financeIntegrationEnabled?linkedFinanceMonth:null, affordableProteinSources, efficiency, days7, plannedCount: plans.filter((p) => p.planDate === today).length, consumedCount: consumptionEvents.filter((e) => e.consumedAt.toISOString().slice(0, 10) === today).length, actualNutrients: sumSnapshotNutrients(consumptionEvents.filter((e)=>e.consumedAt.toISOString().slice(0,10)===today)), actualNutrientUnits:Object.assign({},...consumptionEvents.filter((e)=>e.consumedAt.toISOString().slice(0,10)===today).map((e)=>{const snap=e.nutritionSnapshot as Record<string,unknown>;return snap?.units&&typeof snap.units==='object'?snap.units as Record<string,string>:{}})), frequentFoods: frequentFoods(consumptionEvents,foods) } });
  } catch {
    return response({ error: 'Meals records could not be loaded. Confirm the Meals migration is available, then retry.' }, 503);
  }
}

export async function POST(request: NextRequest) {
  const denied = await authorize(request, true); if (denied) return denied;
  let raw: unknown; try { raw = await request.json(); } catch { return response({ error: 'Request body must be valid JSON.' }, 400); }
  try { if (JSON.stringify(raw).length > 100_000) return response({ error:'Request payload is too large.' },413); } catch { return response({ error:'Request body is invalid.' },400); }
  const normalized = normalizeAction(raw); const parsed = actionSchema.safeParse(normalized);
  if (!parsed.success) return response({ error: parsed.error.issues[0]?.message ?? 'Invalid Meals request.' }, 400);
  try {
    const [{ db }, s] = await Promise.all([import('@/lib/db'), import('@/lib/schema')]);
    const action = parsed.data;
    const result = await handleAction(db, s, action);
    return response({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Meals action failed.';
    return response({ error: message.slice(0, 300) }, 400);
  }
}
function normalizeAction(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const value = body as Record<string, unknown>; const { action, ...rest } = value;
  if (typeof action !== 'string' || 'data' in value) return value;
  if (action === 'plan.generate') return { action, date: rest.date };
  if (action === 'plan.accept') return { action, planId: rest.planId };
  if (action === 'favorite.set') return { action, foodId: rest.foodId, favorite: rest.favorite };
  if (action === 'favorite.plan.set') return { action, planId: rest.planId, favorite: rest.favorite };
  return { action, data: rest };
}

async function handleAction(db: typeof import('@/lib/db').db, s: typeof import('@/lib/schema'), action: MealsAction): Promise<Record<string, unknown>> {
  const owner = 'admin';
  switch (action.action) {
    case 'food.create': {
      const d = action.data;
      const [food] = await db.insert(s.mealsFoods).values({ ownerKey: owner, name: d.name, category: d.category || 'Other', unit: d.unit, pieceCount: d.pieceCount, totalWeight: d.totalWeight, totalWeightUnit: d.totalWeightUnit, priceMinor: d.priceMinor, currency: d.currency, priceUnit: d.priceUnit, preparation: d.preparation, availability: d.availability, expiresAt: d.expiresAt, imageRef: d.imageRef, notes: d.notes, allergens: d.allergens, dietTags:d.dietTags, restrictions: d.restrictions }).returning();
      return { food };
    }
    case 'nutrition-profile.save': {
      const d = action.data; const exists = await db.select({ id: s.mealsFoods.id }).from(s.mealsFoods).where(and(eq(s.mealsFoods.id, d.foodId), eq(s.mealsFoods.ownerKey, owner))).limit(1);
      if (!exists.length) throw new Error('Food record was not found.');
      const [last] = await db.select({ version: s.mealsNutritionProfiles.version }).from(s.mealsNutritionProfiles).where(eq(s.mealsNutritionProfiles.foodId, d.foodId)).orderBy(desc(s.mealsNutritionProfiles.version)).limit(1);
      const provenance = { ...(d.provenance ?? {}), sourceDate: d.sourceDate ?? null, sourceVersion: d.sourceVersion ?? null, sourceUrl: d.sourceUrl ?? null, manuallyReviewed: true, suggestedServingQuantity: d.suggestedServingQuantity ?? null, suggestedServingUnit: d.suggestedServingUnit ?? null };
      const [profile] = await db.insert(s.mealsNutritionProfiles).values({ foodId: d.foodId, version: (last?.version ?? 0) + 1, basisType: d.basisType, servingName: d.servingName, servingQuantity: d.servingQuantity == null ? null : String(d.servingQuantity), servingUnit: d.servingUnit, nutrients: d.nutrients, nutrientUnits: d.nutrientUnits ?? {}, source: d.source, provenance, confidence: d.confidence == null ? null : String(d.confidence) }).returning();
      return { nutritionProfile: profile };
    }
    case 'inventory.purchase': {
      const d = action.data;
      const food = await db.select().from(s.mealsFoods).where(and(eq(s.mealsFoods.id, d.foodId), eq(s.mealsFoods.ownerKey, owner))).limit(1);
      if (!food.length) throw new Error('Food record was not found.');
      const [lot] = await db.transaction(async (tx) => {
        const inserted = await tx.insert(s.mealsInventoryLots).values({ ownerKey: owner, foodId: d.foodId, purchasedQuantity: d.quantity, availableQuantity: d.quantity, quantityUnit: d.unit, purchasedPieces: d.pieces ?? '0', availablePieces: d.pieces ?? '0', purchasedWeight: d.weight ?? null, availableWeight: d.weight ?? null, consumedWeight: '0', weightUnit: d.weightUnit ?? null, priceMinor: d.priceMinor, currency: d.currency, expiresAt: d.expiresAt, notes: d.notes }).returning();
        const row = inserted[0];
        await tx.insert(s.mealsInventoryEvents).values({ ownerKey: owner, lotId: row.id, eventType: 'PURCHASE', quantityDelta: d.quantity, quantityUnit: d.unit, piecesDelta: d.pieces ?? '0', weightDelta: d.weight ?? null, weightUnit: d.weightUnit ?? null, details: { currency: d.currency, priceMinor: d.priceMinor } });
        return inserted;
      });
      return { inventoryLot: lot };
    }
    case 'inventory.adjust': {
      const d = action.data;
      const result = await db.transaction(async (tx) => {
        const [locked] = await tx.select().from(s.mealsInventoryLots).where(and(eq(s.mealsInventoryLots.id, d.lotId), eq(s.mealsInventoryLots.ownerKey, owner))).for('update').limit(1);
        if (!locked) throw new Error('Inventory lot was not found.');
        const [prior]=await tx.select({id:s.mealsInventoryEvents.id}).from(s.mealsInventoryEvents).where(and(eq(s.mealsInventoryEvents.ownerKey,owner),eq(s.mealsInventoryEvents.idempotencyKey,d.idempotencyKey))).limit(1); if(prior)return locked;
        if (locked.quantityUnit !== d.unit) throw new Error('Adjustment unit must match this inventory lot.');
        const available = decimal.add(locked.availableQuantity, d.quantityDelta);
        const pieces = decimal.add(locked.availablePieces, d.piecesDelta ?? '0');
        if (decimal.compare(available, '0') < 0 || decimal.compare(pieces, '0') < 0) throw new Error('Adjustment cannot make available stock negative.');
        const [updated] = await tx.update(s.mealsInventoryLots).set({ availableQuantity: available, availablePieces: pieces, availableWeight: locked.availableWeight && d.weightDelta ? decimal.add(locked.availableWeight, d.weightDelta) : locked.availableWeight } as Partial<typeof s.mealsInventoryLots.$inferInsert>).where(eq(s.mealsInventoryLots.id, d.lotId)).returning();
        await tx.insert(s.mealsInventoryEvents).values({ ownerKey: owner, lotId: d.lotId, eventType: 'ADJUSTMENT', quantityDelta: d.quantityDelta, quantityUnit: d.unit, piecesDelta: d.piecesDelta ?? '0', weightDelta: d.weightDelta ?? null, weightUnit: d.weightUnit ?? null, idempotencyKey: d.idempotencyKey, details: { reason: d.reason } });
        return updated;
      });
      return { inventoryLot: result };
    }
    case 'profile.save': {
      const d = action.data;
      const preferences = { fitnessGoal: d.fitnessGoal ?? null, preferences: d.preferences, allergies: d.allergies, mealFrequency: d.mealFrequency ?? null, proteinTargetGPerDay: d.proteinTargetGPerDay ?? null, pregnantOrLactating: d.pregnantOrLactating ?? null, eatingDisorderConcern: d.eatingDisorderConcern ?? null, medicalCondition: d.medicalCondition ?? null };
      const [profile] = await db.insert(s.mealsBodyProfiles).values({ ownerKey: owner, height: d.height, heightUnit: d.heightUnit, ageYears: d.ageYears, ageAsOf: d.ageYears == null ? null : dateNow(), birthDate: d.birthDate, sex: d.sex, activityLevel: d.activityLevel, preferences, restrictions: d.restrictions }).onConflictDoUpdate({ target: s.mealsBodyProfiles.ownerKey, set: { height: d.height, heightUnit: d.heightUnit, ageYears: d.ageYears, ageAsOf: d.ageYears == null ? null : dateNow(), birthDate: d.birthDate, sex: d.sex, activityLevel: d.activityLevel, preferences, restrictions: d.restrictions, updatedAt: new Date() } }).returning();
      return { profile: { ...profile, privateNotes: undefined } };
    }
    case 'budget.save': {
      const d = action.data; if (!safeDate(d.date)) throw new Error('Choose a valid date.');
      const [budget] = await db.insert(s.mealsDailyBudgets).values({ ownerKey: owner, budgetDate: d.date, amountMinor: d.amountMinor, currency: d.currency, mealsCount: d.mealsCount, notes: d.notes }).onConflictDoUpdate({ target: [s.mealsDailyBudgets.ownerKey, s.mealsDailyBudgets.budgetDate], set: { amountMinor: d.amountMinor, currency: d.currency, mealsCount: d.mealsCount, notes: d.notes } }).returning();
      return { budget };
    }
    case 'plan.generate': return generatePlan(db, s, owner, action.date);
    case 'plan.item.revise': return revisePlanItem(db,s,owner,action.data);
    case 'plan.accept': return acceptPlan(db, s, owner, action.planId);
    case 'consumption.record': return recordConsumption(db, s, owner, action.data);
    case 'favorite.plan.set': {
      const [plan]=await db.select().from(s.mealsPlans).where(and(eq(s.mealsPlans.id,action.planId),eq(s.mealsPlans.ownerKey,owner))).limit(1); if(!plan)throw new Error('Meal plan was not found.');
      if(action.favorite){const planItems=await db.select().from(s.mealsPlanItems).where(eq(s.mealsPlanItems.planId,plan.id)).orderBy(asc(s.mealsPlanItems.itemOrder));const snapshot={planId:plan.id,planDate:plan.planDate,items:planItems};await db.insert(s.mealsFavorites).values({ownerKey:owner,planId:plan.id,planSnapshot:snapshot}).onConflictDoNothing();}
      else await db.delete(s.mealsFavorites).where(and(eq(s.mealsFavorites.ownerKey,owner),eq(s.mealsFavorites.planId,action.planId)));
      return { favorite:action.favorite,planId:action.planId };
    }
    case 'favorite.set': {
      const food = await db.select({ id: s.mealsFoods.id }).from(s.mealsFoods).where(and(eq(s.mealsFoods.id, action.foodId), eq(s.mealsFoods.ownerKey, owner))).limit(1); if (!food.length) throw new Error('Food record was not found.');
      if (action.favorite) await db.insert(s.mealsFavorites).values({ ownerKey: owner, foodId: action.foodId }).onConflictDoNothing();
      else await db.delete(s.mealsFavorites).where(and(eq(s.mealsFavorites.ownerKey, owner), eq(s.mealsFavorites.foodId, action.foodId)));
      return { favorite: action.favorite };
    }
    case 'hydration.record': { const d=action.data;const [record]=await db.insert(s.mealsHydrationEvents).values({ownerKey:owner,amountMl:d.amountMl,recordedAt:d.recordedAt?new Date(d.recordedAt):new Date(),idempotencyKey:d.idempotencyKey,notes:d.notes}).onConflictDoNothing().returning();return {hydrationEvent:record??null,duplicate:!record}; }
    case 'progress.record': {
      const d = action.data;
      const [record] = await db.insert(s.mealsWeightProgress).values({ ownerKey: owner, weight: d.weight, weightUnit: d.weightUnit, bodyFatPercent: d.bodyFatPercent ?? null, measurements: d.measurements ?? {}, notes: d.notes, recordedAt: d.recordedAt ? new Date(d.recordedAt) : new Date() }).returning();
      return { progressRecord: record };
    }
    case 'settings.save': {
      const [settings] = await db.insert(s.mealsSettings).values({ id: true, financeIntegrationEnabled: action.data.financeIntegrationEnabled, aiEnabled: action.data.aiEnabled, sensitiveAiConsent: action.data.sensitiveAiConsent, updatedAt: new Date() }).onConflictDoUpdate({ target: s.mealsSettings.id, set: { financeIntegrationEnabled: action.data.financeIntegrationEnabled, aiEnabled: action.data.aiEnabled, sensitiveAiConsent: action.data.sensitiveAiConsent, updatedAt: new Date() } }).returning();
      return { settings };
    }
    case 'finance-link.create': return createFinanceLink(db, s, owner, action.data.inventoryLotId);
    default: throw new Error('This Meals action is not supported.');
  }
}


async function revisePlanItem(db:typeof import('@/lib/db').db,s:typeof import('@/lib/schema'),owner:string,d:Extract<MealsAction,{action:'plan.item.revise'}>['data']){
 return db.transaction(async(tx)=>{
  const [oldPlan]=await tx.select().from(s.mealsPlans).where(and(eq(s.mealsPlans.id,d.planId),eq(s.mealsPlans.ownerKey,owner))).for('update').limit(1);if(!oldPlan)throw new Error('Plan was not found.');if(!oldPlan.currency)throw new Error('Plan currency is missing.');const currencyCode=oldPlan.currency;if(oldPlan.status!=='DRAFT')throw new Error('Only an unaccepted draft can be revised; accepted plans remain unchanged for history.');
  const oldItems=await tx.select().from(s.mealsPlanItems).where(eq(s.mealsPlanItems.planId,d.planId)).orderBy(asc(s.mealsPlanItems.itemOrder));const target=d.itemId?oldItems.find((item)=>item.id===d.itemId):undefined;if(d.itemId&&!target)throw new Error('Plan item was not found in this draft.');if(d.operation==='remove'&&!target)throw new Error('Choose an item to remove.');
  let revised:typeof s.mealsPlanItems.$inferInsert|null=null;
  if(d.operation==='adjust'||d.operation==='replace'||d.operation==='add'){
   const foodId=d.operation==='adjust'?target!.foodId:d.foodId!;const [food]=await tx.select().from(s.mealsFoods).where(and(eq(s.mealsFoods.id,foodId),eq(s.mealsFoods.ownerKey,owner))).limit(1);if(!food||food.availability!=='AVAILABLE')throw new Error('Choose an available food.');
   const [profile]=await tx.select().from(s.mealsNutritionProfiles).where(eq(s.mealsNutritionProfiles.foodId,foodId)).orderBy(desc(s.mealsNutritionProfiles.version)).limit(1);if(!profile||profile.provenance?.manuallyReviewed!==true)throw new Error('This food has no manually reviewed nutrition profile.');
   const quantity=d.quantity!,unit=d.unit!;const factor=factorsFromFoodMeasurements(food.totalWeight??undefined,food.totalWeightUnit??undefined,food.pieceCount??undefined);const requested:Measurement={amount:quantity,unit:unit as Measurement['unit'],factors:factor};const needed=measurementInBasis(requested);if(!needed)throw new Error('Enter a valid serving quantity.');
   const basisValues=mapNutrients(profile.nutrients as Record<string,unknown>);const basis=profile.basisType==='100g'?{kind:'per-100g' as const,values:basisValues}:profile.basisType==='100ml'?{kind:'per-100ml' as const,values:basisValues}:{kind:'per-serving' as const,servingName:profile.servingName??'serving',servingQuantity:profile.servingQuantity??undefined,servingUnit:(profile.servingUnit as Measurement['unit']|null)??undefined,servingGrams:['g','kg'].includes(profile.servingUnit??'')?profile.servingQuantity??undefined:undefined,servingMillilitres:['ml','l'].includes(profile.servingUnit??'')?profile.servingQuantity??undefined:undefined,values:basisValues};const nutrition=calculateNutrition({id:String(food.id),name:food.name,basis,allergens:food.allergens,tags:food.dietTags,restrictions:food.restrictions,confirmed:true},requested);if(!nutrition)throw new Error('This serving unit cannot be converted to the saved nutrition basis. Enter a matching unit or explicit piece weight.');
   const reserved=oldItems.filter((item)=>item.foodId===foodId&&item.id!==target?.id).reduce((sum,item)=>{const m=measurementInBasis({amount:item.servingQuantity,unit:item.servingUnit as Measurement['unit'],factors:factor});if(!m||m.basis!==needed.basis)throw new Error('Existing plan item units cannot be reconciled safely.');return decimal.add(sum,m.quantity);},'0');
   const lots=await tx.select().from(s.mealsInventoryLots).where(and(eq(s.mealsInventoryLots.ownerKey,owner),eq(s.mealsInventoryLots.foodId,foodId),eq(s.mealsInventoryLots.currency,currencyCode))).orderBy(asc(s.mealsInventoryLots.expiresAt),asc(s.mealsInventoryLots.purchasedAt));const planDate=oldPlan.planDate;const eligible=lots.filter((lot)=>decimal.compare(lot.availableQuantity,'0')>0&&(!lot.expiresAt||lot.expiresAt>=planDate));let stock=decimal.subtract('0',reserved);for(const lot of eligible){const measured=measurementInBasis({amount:lot.availableQuantity,unit:lot.quantityUnit as Measurement['unit'],factors:factor});if(!measured||measured.basis!==needed.basis)continue;stock=decimal.add(stock,measured.quantity);}if(decimal.compare(stock,needed.quantity)<0)throw new Error('The replacement serving exceeds unexpired stock after other planned portions.');
   let remaining=needed.quantity,cost='0';for(const lot of eligible){if(decimal.compare(remaining,'0')<=0)break;const measured=measurementInBasis({amount:lot.availableQuantity,unit:lot.quantityUnit as Measurement['unit'],factors:factor});if(!measured||measured.basis!==needed.basis)continue;const take=decimal.compare(measured.quantity,remaining)<0?measured.quantity:remaining;const part=decimal.multiply(quantity,decimal.divide(take,needed.quantity));const major=costForMeasurement(minorToMajor(lot.priceMinor,lot.currency),{amount:lot.purchasedQuantity,unit:lot.quantityUnit as Measurement['unit'],factors:factor},{amount:part,unit:unit as Measurement['unit'],factors:factor});if(major===null)throw new Error('A purchase lot cannot price this serving unit.');cost=decimal.add(cost,major);remaining=decimal.subtract(remaining,take);}if(decimal.compare(remaining,'0')>0)throw new Error('Insufficient priced stock for this serving.');
   revised={planId:d.planId,foodId,nutritionProfileId:profile.id,mealType:d.mealType??target?.mealType??'SNACK',servingQuantity:quantity,servingUnit:unit,servingPieces:null,servingWeight:null,servingWeightUnit:null,costMinor:majorToMinor(cost,currencyCode),currency:currencyCode,calculatedNutrients:{...nutrition,source:profile.source,profileVersion:profile.version,confidence:profile.confidence,provenance:profile.provenance,units:profile.nutrientUnits},itemOrder:target?.itemOrder??oldItems.length,notes:'Revised draft; estimate recalculated from the selected reviewed profile and current unexpired stock.'};
  }
  const rows:typeof s.mealsPlanItems.$inferInsert[]=oldItems.flatMap((item)=>{if(item.id===target?.id)return d.operation==='remove'?[]:[revised!];const{ id:ignore,createdAt:created,...copy}=item;void ignore;void created;return [{planId:d.planId,foodId:copy.foodId,nutritionProfileId:copy.nutritionProfileId,mealType:copy.mealType,servingQuantity:copy.servingQuantity,servingUnit:copy.servingUnit,servingPieces:copy.servingPieces,servingWeight:copy.servingWeight,servingWeightUnit:copy.servingWeightUnit,costMinor:copy.costMinor,currency:copy.currency,calculatedNutrients:copy.calculatedNutrients,itemOrder:copy.itemOrder,notes:copy.notes}];});if(d.operation==='add')rows.push(revised!);if(d.operation==='remove'&&!target)throw new Error('Plan item not found.');
  if(rows.some((item)=>item.costMinor==null))throw new Error('Every plan item needs a stored price.');const totalMinor=rows.reduce((sum,item)=>sum+BigInt(item.costMinor!),BigInt(0));const [budget]=await tx.select().from(s.mealsDailyBudgets).where(and(eq(s.mealsDailyBudgets.ownerKey,owner),eq(s.mealsDailyBudgets.budgetDate,oldPlan.planDate))).limit(1);if(budget&&totalMinor>BigInt(budget.amountMinor))throw new Error('This revision exceeds the saved daily budget. Choose a less expensive item or portion.');
  const totals:Record<string,string>={},units:Record<string,string>={};for(const item of rows){const snapshot=item.calculatedNutrients as Record<string,unknown>;for(const [key,value] of Object.entries(snapshot)){if(['source','profileVersion','confidence','provenance','units','unknown','quantity','unit'].includes(key)||typeof value!=='string'||!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value))continue;totals[key]=decimal.add(totals[key]??'0',value);}if(snapshot.units&&typeof snapshot.units==='object')Object.assign(units,snapshot.units);}
  const inputSnapshot={...(oldPlan.inputSnapshot as Record<string,unknown>),revisionOf:oldPlan.id,revisionReason:d.operation};const priorNutrition=oldPlan.nutritionSnapshot as Record<string,unknown>;const priorGoal=priorNutrition?.proteinGoal as Record<string,unknown>|undefined;const goalTarget=typeof priorGoal?.targetGPerDay==='string'?priorGoal.targetGPerDay:null;const proteinGoal=goalTarget?{...priorGoal,targetGPerDay:goalTarget,plannedKnownG:totals.proteinG??'0',remainingKnownG:decimal.compare(goalTarget,totals.proteinG??'0')>0?decimal.subtract(goalTarget,totals.proteinG??'0'):'0',status:decimal.compare(goalTarget,totals.proteinG??'0')>0?'SHORTFALL':'TARGET_REACHED_BY_ESTIMATE'}:null;const [newPlan]=await tx.insert(s.mealsPlans).values({ownerKey:owner,planDate:oldPlan.planDate,status:'DRAFT',inputSnapshot,nutritionSnapshot:{reason:'Revised draft; totals recomputed from confirmed stored nutrition profiles.',totalNutrients:totals,units,proteinGoal,unspentBudget:budget?(BigInt(budget.amountMinor)-totalMinor).toString():undefined,method:'Revised portions use stored nutrition estimates and stock; the protein goal remains user-set and is not a medical prescription.'},costMinor:'0',currency:currencyCode}).returning();
  await tx.update(s.mealsPlans).set({status:'SUPERSEDED',updatedAt:new Date()}).where(eq(s.mealsPlans.id,oldPlan.id));const inserted=[];for(const [index,item]of rows.entries()){const [saved]=await tx.insert(s.mealsPlanItems).values({...item,planId:newPlan.id,itemOrder:index}).returning();inserted.push(saved);}const [savedPlan]=await tx.update(s.mealsPlans).set({costMinor:totalMinor.toString(),updatedAt:new Date()}).where(eq(s.mealsPlans.id,newPlan.id)).returning();return {plan:savedPlan,planItems:inserted,revisionOf:oldPlan.id};
 });
}

function costFromLots(lots:Array<{availableQuantity:string;quantityUnit:string;purchasedQuantity:string;priceMinor:string;currency:string}>,requested:Measurement,currency:string,factors?:ReturnType<typeof factorsFromFoodMeasurements>):string|null {const need=measurementInBasis(requested);if(!need)return null;let left=need.quantity,total='0';for(const lot of lots){if(lot.currency!==currency||decimal.compare(left,'0')<=0)continue;const available=measurementInBasis({amount:lot.availableQuantity,unit:lot.quantityUnit as Measurement['unit'],factors});if(!available||available.basis!==need.basis)continue;const take=decimal.compare(available.quantity,left)<0?available.quantity:left;const portion=decimal.multiply(requested.amount,decimal.divide(take,need.quantity));const cost=costForMeasurement(minorToMajor(lot.priceMinor,currency),{amount:lot.purchasedQuantity,unit:lot.quantityUnit as Measurement['unit'],factors},{amount:portion,unit:requested.unit,factors});if(cost===null)return null;total=decimal.add(total,cost);left=decimal.subtract(left,take);}return decimal.compare(left,'0')===0?total:null;}

async function generatePlan(db: typeof import('@/lib/db').db, s: typeof import('@/lib/schema'), owner: string, planDate: string) {
  if (!safeDate(planDate)) throw new Error('Choose a valid plan date.');
  const [budget] = await db.select().from(s.mealsDailyBudgets).where(and(eq(s.mealsDailyBudgets.ownerKey, owner), eq(s.mealsDailyBudgets.budgetDate, planDate))).limit(1);
  if (!budget) throw new Error('Save a daily budget before generating a plan.');
  const [profile] = await db.select().from(s.mealsBodyProfiles).where(eq(s.mealsBodyProfiles.ownerKey, owner)).limit(1);
  const [latestProgress] = await db.select().from(s.mealsWeightProgress).where(eq(s.mealsWeightProgress.ownerKey, owner)).orderBy(desc(s.mealsWeightProgress.recordedAt)).limit(1);
  const foods = await db.select().from(s.mealsFoods).where(and(eq(s.mealsFoods.ownerKey, owner), eq(s.mealsFoods.availability, 'AVAILABLE')));
  const allProfiles = await db.select().from(s.mealsNutritionProfiles).orderBy(desc(s.mealsNutritionProfiles.version));
  const latest = new Map<number, typeof allProfiles[number]>(); for (const row of allProfiles) if (!latest.has(row.foodId)) latest.set(row.foodId, row);
  const lots = await db.select().from(s.mealsInventoryLots).where(and(eq(s.mealsInventoryLots.ownerKey, owner), gte(s.mealsInventoryLots.availableQuantity, '0'))).orderBy(asc(s.mealsInventoryLots.expiresAt));
  const preferences = (profile?.preferences ?? {}) as Record<string, unknown>;
  const estimateHeight=profile?.height==null?null:profile.heightUnit==='cm'?String(profile.height):profile.heightUnit==='in'?decimal.multiply(String(profile.height),'2.54'):null;const progressWeight=latestProgress?.weight==null?null:latestProgress.weightUnit==='kg'?String(latestProgress.weight):latestProgress.weightUnit==='lb'?poundsToKilograms(String(latestProgress.weight)):null;const profileEnergyEstimate=estimateAdultEer({ageYears:calculateAge(profile?.ageYears,profile?.ageAsOf),heightCm:estimateHeight,weightKg:progressWeight,weightRecordedAt:latestProgress?.recordedAt??null,biologicalSex:profile?.sex??null,activityLevel:profile?.activityLevel??null,pregnantOrLactating:typeof preferences.pregnantOrLactating==='boolean'?preferences.pregnantOrLactating:null,eatingDisorderConcern:typeof preferences.eatingDisorderConcern==='boolean'?preferences.eatingDisorderConcern:null,medicalCondition:typeof preferences.medicalCondition==='string'?preferences.medicalCondition:null});
  const allergens = Array.isArray(preferences.allergies) ? preferences.allergies.map(String) : [];
  const restrictions = Array.isArray(profile?.restrictions) ? profile.restrictions.map(String) : []; const dietaryPreferences=Array.isArray(preferences.preferences)?preferences.preferences.map(String):[];
  const stockRows = foods.map((food) => {
    if(!['AVAILABLE','LOW_STOCK'].includes(food.availability)|| (food.expiresAt&&food.expiresAt<planDate))return null;
    const factor=factorsFromFoodMeasurements(food.totalWeight??undefined,food.totalWeightUnit??undefined,food.pieceCount??undefined);
    const availableLots=lots.filter((lot)=>lot.foodId===food.id&&(!lot.expiresAt||lot.expiresAt>=planDate)&&lot.currency===budget.currency&&decimal.compare(lot.availableQuantity,'0')>0).sort((a,b)=>String(a.expiresAt||'9999-12-31').localeCompare(String(b.expiresAt||'9999-12-31'))||a.purchasedAt.getTime()-b.purchasedAt.getTime());if(!availableLots.length)return null;
    const prof=latest.get(food.id);if(!prof||prof.provenance?.manuallyReviewed!==true)return null;const prov=prof.provenance as Record<string,unknown>;const servingQuantity=typeof prov.suggestedServingQuantity==='string'?prov.suggestedServingQuantity:(prof.servingQuantity??undefined);const servingUnit=typeof prov.suggestedServingUnit==='string'?prov.suggestedServingUnit:(prof.servingUnit??undefined);if(!servingQuantity||!servingUnit||!['g','kg','ml','l','piece','serving'].includes(servingUnit))return null;
    const amount:Measurement={amount:servingQuantity,unit:servingUnit as Measurement['unit'],factors:factor};const basisValues=mapNutrients(prof.nutrients as Record<string,unknown>);const basis=prof.basisType==='100g'?{kind:'per-100g' as const,values:basisValues}:prof.basisType==='100ml'?{kind:'per-100ml' as const,values:basisValues}:{kind:'per-serving' as const,servingName:prof.servingName??'serving',servingQuantity:prof.servingQuantity??undefined,servingUnit:(prof.servingUnit as Measurement['unit']|null)??undefined,servingGrams:['g','kg'].includes(prof.servingUnit??'')?prof.servingQuantity??undefined:undefined,servingMillilitres:['ml','l'].includes(prof.servingUnit??'')?prof.servingQuantity??undefined:undefined,values:basisValues};const foodProfile:FoodProfile={id:String(food.id),name:food.name,basis,allergens:food.allergens,tags:food.dietTags,restrictions:food.restrictions,confirmed:true};
    const measuredAvailable:Array<{lot:typeof availableLots[number];amount:NonNullable<ReturnType<typeof measurementInBasis>>}>=[];for(const lot of availableLots){const measured=measurementInBasis({amount:lot.availableQuantity,unit:lot.quantityUnit as Measurement['unit'],factors:factor});if(measured)measuredAvailable.push({lot,amount:measured});}const basisKind=measuredAvailable[0]?.amount.basis;if(!basisKind)return null;const compatible=measuredAvailable.filter((x)=>x.amount.basis===basisKind);if(!compatible.length)return null;const quantity=compatible.reduce((sum,x)=>decimal.add(sum,x.amount.quantity),'0');const unit=basisKind as Measurement['unit'];const purchased:Array<{lot:typeof availableLots[number];amount:NonNullable<ReturnType<typeof measurementInBasis>>}>=[];for(const lot of availableLots){const measured=measurementInBasis({amount:lot.purchasedQuantity,unit:lot.quantityUnit as Measurement['unit'],factors:factor});if(measured&&measured.basis===basisKind)purchased.push({lot,amount:measured});}if(!purchased.length)return null;const totalPurchased=purchased.reduce((sum,x)=>decimal.add(sum,x.amount.quantity),'0');const totalPrice=purchased.reduce((sum,x)=>sum+BigInt(x.lot.priceMinor),BigInt(0));const priceMajor=decimal.divide(minorToMajor(totalPrice.toString(),budget.currency),totalPurchased);const picked=compatible[0].lot;
    return {food,prof,picked,lots:compatible.map((x)=>x.lot),quantity,amount,factor,unit,foodProfile,price:{amount:priceMajor,package:{amount:totalPurchased,unit}}};
  }).filter((x):x is NonNullable<typeof x>=>x!==null);
  const stock=stockRows.map((x)=>({foodId:String(x.food.id),quantity:{amount:x.quantity,unit:x.unit},expiresOn:null,available:true}));const prices:Record<string,{amount:string;package:Measurement}>={};for(const x of stockRows)prices[String(x.food.id)]=x.price;
  const candidates: MealCandidate[] = [];
  const mealTypes = ['BREAKFAST','LUNCH','DINNER','SNACK'];
  const maxFoods = Math.min(stockRows.length, 24);
  for (let i=0; i<maxFoods && candidates.length<500; i++) {
    candidates.push({ id:`single-${stockRows[i].food.id}`, name:stockRows[i].food.name, mealType:mealTypes[candidates.length % mealTypes.length], items:[{ foodId:String(stockRows[i].food.id), amount:stockRows[i].amount }] });
    for (let j=i+1; j<maxFoods && candidates.length<500; j++) candidates.push({ id:`combo-${stockRows[i].food.id}-${stockRows[j].food.id}`, name:`${stockRows[i].food.name} + ${stockRows[j].food.name}`, mealType:mealTypes[candidates.length % mealTypes.length], items:[{foodId:String(stockRows[i].food.id),amount:stockRows[i].amount},{foodId:String(stockRows[j].food.id),amount:stockRows[j].amount}] });
  }
  const proteinTarget=typeof preferences.proteinTargetGPerDay==='string'&&decimal.compare(preferences.proteinTargetGPerDay,'0')>0?preferences.proteinTargetGPerDay:undefined;
  const selected = selectAffordableMeals({ foods:stockRows.map((x)=>x.foodProfile), stock, candidates, prices, budget:minorToMajor(budget.amountMinor,budget.currency), date:planDate, allergens, restrictions, preferences:dietaryPreferences, proteinTargetGPerDay:proteinTarget, limit:budget.mealsCount });
  if(!selected.meals.length)return {plan:null,planItems:[],alternatives:selected.alternatives.slice(0,10).map((a)=>({name:a.candidate.name,cost:a.cost,nutrition:a.nutrition,foodIds:a.candidate.items.map((item)=>Number(item.foodId)),items:a.candidate.items.map((item)=>({foodId:Number(item.foodId),quantity:item.amount.amount,unit:item.amount.unit}))})),reason:selected.reason,eligibleFoodCount:stockRows.length,proteinGoal:proteinTarget?{targetGPerDay:proteinTarget,plannedKnownG:selected.plannedProteinG,remainingKnownG:selected.proteinShortfallG??proteinTarget,status:'SHORTFALL',meaning:'No eligible meal was generated from currently recorded stock and saved budget; this does not prove all possible combinations are infeasible.'}:null};
  const planResult = await db.transaction(async (tx) => {
    const totalNutrients:Record<string,string>={},totalUnits:Record<string,string>={};for(const meal of selected.meals){for(const [key,value] of Object.entries(meal.nutrition))if(value!==undefined)totalNutrients[key]=decimal.add(totalNutrients[key]??'0',value);for(const line of meal.candidate.items){const row=stockRows.find((x)=>String(x.food.id)===line.foodId);if(row?.prof.nutrientUnits)Object.assign(totalUnits,row.prof.nutrientUnits);}}
    const estimate=profileEnergyEstimate.estimate;const plannedEnergy=totalNutrients.energyKcal??null;const proteinGoal=proteinTarget?{targetGPerDay:proteinTarget,plannedKnownG:totalNutrients.proteinG??'0',remainingKnownG:decimal.compare(proteinTarget,totalNutrients.proteinG??'0')>0?decimal.subtract(proteinTarget,totalNutrients.proteinG??'0'):'0',status:decimal.compare(proteinTarget,totalNutrients.proteinG??'0')>0?'SHORTFALL':'TARGET_REACHED_BY_ESTIMATE',meaning:'User-set comparison only; estimated, recorded nutrition may be incomplete and is not a medically validated prescription.'}:null;const energyComparison=estimate?{estimateKcalPerDay:estimate.kcalPerDay,plannedEnergyKcal:plannedEnergy,differenceKcal:plannedEnergy?decimal.subtract(plannedEnergy,estimate.kcalPerDay):null,meaning:'Informational comparison only. These selected plan entries are not verified full-day intake, and the difference is not an adequacy or deficit finding.'}:null;const planSnapshot={reason:selected.reason,unspentBudget:selected.shortfall,totalNutrients,units:totalUnits,proteinGoal,energyEstimate:estimate?{kcalPerDay:estimate.kcalPerDay,sexModel:estimate.sexModel,activityCategory:estimate.activityCategory,equation:estimate.equation,source:estimate.source,standardErrorContext:estimate.standardErrorContext,interpretation:estimate.interpretation,weightRecordedAt:latestProgress?.recordedAt??null}:null,energyEstimateUnavailableReasons:estimate?[]:profileEnergyEstimate.reasons,energyComparison,method:'Deterministic selection prioritizes protein per recorded cost when a personal goal is saved, using confirmed food profiles and unexpired stock within the saved budget. Protein values remain estimates from saved records; this user-set comparison is not a medical prescription.'};
    const [plan] = await tx.insert(s.mealsPlans).values({ ownerKey:owner, planDate, status:'DRAFT', inputSnapshot:{ budgetId:budget.id, amountMinor:budget.amountMinor, currency:budget.currency, mealsCount:budget.mealsCount, profileSafety:{ ageYears:calculateAge(profile?.ageYears,profile?.ageAsOf), pregnantOrLactating:preferences.pregnantOrLactating ?? null, eatingDisorderConcern:preferences.eatingDisorderConcern ?? null, medicalConditionPresent:Boolean(preferences.medicalCondition) }, sourceFoodCount:stockRows.length, specialInstructions:budget.notes??null, bodyProfileUsed:{fitnessGoal:preferences.fitnessGoal??null,activityLevel:profile?.activityLevel??null,mealFrequency:preferences.mealFrequency??null,weightRecordedAt:latestProgress?.recordedAt??null} }, nutritionSnapshot:planSnapshot, costMinor:'0', currency:budget.currency }).returning();
    let totalMinor = BigInt(0); const items: typeof s.mealsPlanItems.$inferSelect[] = [];
    let itemOrder=0;
    for (const [mealIndex, meal] of selected.meals.entries()) {
      const rows=meal.candidate.items.map((chosen)=>({chosen,row:stockRows.find((x)=>String(x.food.id)===chosen.foodId)})).filter((x):x is {chosen:typeof meal.candidate.items[number];row:typeof stockRows[number]}=>Boolean(x.row));
      const exactCosts=rows.map(({chosen,row})=>costFromLots(row.lots,chosen.amount,budget.currency,row.factor)??'0');
      const exponent=currencyExponent(budget.currency), scale=BigInt(1000000), currencyScale=BigInt(10)**BigInt(exponent);
      const costNumerators=exactCosts.map((value)=>{const [whole,fraction='']=value.split('.');return (BigInt(whole)*scale+BigInt((fraction+'000000').slice(0,6)))*currencyScale;});
      const lineBase=costNumerators.map((num)=>num/scale), lineRemainders=costNumerators.map((num)=>num%scale);
      const exactTotal=exactCosts.reduce((sum,value)=>decimal.add(sum,value),'0');const totalMealMinor=BigInt(majorToMinor(exactTotal,budget.currency));
      let centsLeft=totalMealMinor-lineBase.reduce((sum,value)=>sum+value,BigInt(0));const priority=lineRemainders.map((value,index)=>({value,index})).sort((a,b)=>a.value===b.value?a.index-b.index:a.value>b.value?-1:1);for(let i=0;centsLeft>BigInt(0);i++,centsLeft--)lineBase[priority[i%priority.length].index]+=BigInt(1);
      for (const [lineIndex,{chosen,row}] of rows.entries()) {
        const nutrition=calculateNutrition(row.foodProfile,chosen.amount) ?? {};const costMinor=lineBase[lineIndex].toString();totalMinor+=BigInt(costMinor);
        const [item]=await tx.insert(s.mealsPlanItems).values({planId:plan.id,foodId:row.food.id,nutritionProfileId:row.prof.id,mealType:mealTypes[Math.min(mealIndex,mealTypes.length-1)],servingQuantity:chosen.amount.amount,servingUnit:chosen.amount.unit,costMinor,currency:budget.currency,calculatedNutrients:{...nutrition,source:row.prof.source,profileVersion:row.prof.version,confidence:row.prof.confidence,provenance:row.prof.provenance,units:row.prof.nutrientUnits},itemOrder:itemOrder++,notes:meal.preferenceScore&&meal.preferenceScore>0?'Preference tag matched; portion, nutrient values and cost are estimates from confirmed records.':'Selected from eligible in-stock options using recorded nutrient coverage, estimated cost and food variety; not a medical prescription.'}).returning(); items.push(item);
      }
    }
    if(totalMinor>BigInt(budget.amountMinor))throw new Error('Current lot prices make this plan exceed the saved daily budget. Reduce the serving or update the budget, then regenerate.');const [updated]=await tx.update(s.mealsPlans).set({costMinor:totalMinor.toString(),nutritionSnapshot:planSnapshot,updatedAt:new Date()}).where(eq(s.mealsPlans.id,plan.id)).returning();
    return {plan:updated,planItems:items,alternatives:selected.alternatives.slice(0,10).map((a)=>({name:a.candidate.name,cost:a.cost,nutrition:a.nutrition,foodIds:a.candidate.items.map((item)=>Number(item.foodId)),items:a.candidate.items.map((item)=>({foodId:Number(item.foodId),quantity:item.amount.amount,unit:item.amount.unit}))})),reason:selected.reason};
  });
  return planResult;
}

async function acceptPlan(db:typeof import('@/lib/db').db,s:typeof import('@/lib/schema'),owner:string,planId:number){return db.transaction(async(tx)=>{await tx.insert(s.mealsSettings).values({id:true}).onConflictDoNothing();await tx.select({id:s.mealsSettings.id}).from(s.mealsSettings).where(eq(s.mealsSettings.id,true)).for('update');const [plan]=await tx.select().from(s.mealsPlans).where(and(eq(s.mealsPlans.id,planId),eq(s.mealsPlans.ownerKey,owner))).for('update').limit(1);if(!plan)throw new Error('Meal plan was not found.');if(plan.status==='ACCEPTED')return {plan,duplicate:true};if(plan.status!=='DRAFT')throw new Error('Only a current draft plan can be accepted.');if(!plan.currency)throw new Error('The plan has no verified currency.');const items=await tx.select().from(s.mealsPlanItems).where(eq(s.mealsPlanItems.planId,planId)).orderBy(asc(s.mealsPlanItems.itemOrder));if(!items.length)throw new Error('An empty plan cannot be accepted.');const profileRows=await tx.select().from(s.mealsBodyProfiles).where(eq(s.mealsBodyProfiles.ownerKey,owner)).limit(1);const prefs=(profileRows[0]?.preferences??{}) as Record<string,unknown>;const allergies=Array.isArray(prefs.allergies)?prefs.allergies.map(String):[];const restrictions=Array.isArray(profileRows[0]?.restrictions)?profileRows[0]!.restrictions.map(String):[];const grouped=new Map<number,typeof items>();for(const item of items)grouped.set(item.foodId,[...(grouped.get(item.foodId)??[]),item]);
 for(const [foodId,foodItems]of grouped){const [food]=await tx.select().from(s.mealsFoods).where(and(eq(s.mealsFoods.id,foodId),eq(s.mealsFoods.ownerKey,owner))).limit(1);if(!food||!['AVAILABLE','LOW_STOCK'].includes(food.availability)||(food.expiresAt&&food.expiresAt<plan.planDate))throw new Error('A planned food is unavailable or past its catalog expiry. Generate a fresh plan.');if(food.allergens.some((x)=>allergies.some((a)=>a.toLowerCase()===x.toLowerCase()))||food.restrictions.some((x)=>restrictions.some((a)=>a.toLowerCase()===x.toLowerCase())))throw new Error('A planned food now conflicts with a saved allergy or restriction.');const factor=factorsFromFoodMeasurements(food.totalWeight??undefined,food.totalWeightUnit??undefined,food.pieceCount??undefined);let need='0',basis:string|undefined;for(const item of foodItems){const value=measurementInBasis({amount:item.servingQuantity,unit:item.servingUnit as Measurement['unit'],factors:factor});if(!value)throw new Error('A planned serving unit cannot be reconciled safely.');if(basis&&basis!==value.basis)throw new Error('Planned serving measures cannot be reconciled safely.');basis=value.basis;need=decimal.add(need,value.quantity);}const lots=await tx.select().from(s.mealsInventoryLots).where(and(eq(s.mealsInventoryLots.ownerKey,owner),eq(s.mealsInventoryLots.foodId,foodId),eq(s.mealsInventoryLots.currency,plan.currency))).for('update');let available='0';for(const lot of lots){if(lot.expiresAt&&lot.expiresAt<plan.planDate)continue;const value=measurementInBasis({amount:lot.availableQuantity,unit:lot.quantityUnit as Measurement['unit'],factors:factor});if(value&&value.basis===basis)available=decimal.add(available,value.quantity);}if(decimal.compare(available,need)<0)throw new Error(`Current stock for ${food.name} is insufficient. Refresh or revise the draft before accepting.`);}
 const active=await tx.select().from(s.mealsPlans).where(and(eq(s.mealsPlans.ownerKey,owner),eq(s.mealsPlans.planDate,plan.planDate),eq(s.mealsPlans.status,'ACCEPTED'))).for('update');for(const prior of active)await tx.update(s.mealsPlans).set({status:'SUPERSEDED',updatedAt:new Date()}).where(eq(s.mealsPlans.id,prior.id));const [accepted]=await tx.update(s.mealsPlans).set({status:'ACCEPTED',updatedAt:new Date()}).where(and(eq(s.mealsPlans.id,planId),eq(s.mealsPlans.ownerKey,owner))).returning();return {plan:accepted,supersededPlanIds:active.map((p)=>p.id)};});}

async function recordConsumption(db: typeof import('@/lib/db').db, s: typeof import('@/lib/schema'), owner: string, d: Extract<MealsAction,{action:'consumption.record'}>['data']) {
  return db.transaction(async (tx) => {
    const already=await tx.select().from(s.mealsConsumptionEvents).where(and(eq(s.mealsConsumptionEvents.ownerKey,owner),like(s.mealsConsumptionEvents.idempotencyKey,`${d.idempotencyKey}%`))).limit(1);
    if(already.length)return {consumptionEvents:already,duplicate:true};
    const [food]=await tx.select().from(s.mealsFoods).where(and(eq(s.mealsFoods.id,d.foodId),eq(s.mealsFoods.ownerKey,owner))).limit(1); if(!food)throw new Error('Food record was not found.');
    const [planItem]=d.planItemId?await tx.select().from(s.mealsPlanItems).where(and(eq(s.mealsPlanItems.id,d.planItemId),eq(s.mealsPlanItems.foodId,d.foodId))).limit(1):[];
    if(d.planItemId&&!planItem)throw new Error('Plan item was not found for this food.');
    if(planItem){const [plan]=await tx.select().from(s.mealsPlans).where(and(eq(s.mealsPlans.id,planItem.planId),eq(s.mealsPlans.ownerKey,owner))).limit(1);if(!plan||plan.status!=='ACCEPTED')throw new Error('Accept this meal plan before recording its items as consumed.');if(planItem.servingUnit!==d.unit)throw new Error('Consumed unit must match the selected plan item.');}
    const lots=await tx.select().from(s.mealsInventoryLots).where(and(eq(s.mealsInventoryLots.ownerKey,owner),eq(s.mealsInventoryLots.foodId,d.foodId),eq(s.mealsInventoryLots.quantityUnit,d.unit))).orderBy(asc(s.mealsInventoryLots.expiresAt),asc(s.mealsInventoryLots.purchasedAt)).for('update');
    let remaining=d.quantity; let consumedCost=BigInt(0); const created:(typeof s.mealsConsumptionEvents.$inferSelect)[]=[]; const eligible=lots.filter((l)=>decimal.compare(l.availableQuantity,'0')>0);
    for(const lot of eligible){if(decimal.compare(remaining,'0')<=0)break;const take=decimal.compare(lot.availableQuantity,remaining)<0?lot.availableQuantity:remaining;const cost=BigInt(prorateMinorUnits(lot.priceMinor,take,lot.purchasedQuantity));
      const ratio=decimal.divide(take,d.quantity); const pieceTake=d.pieces ? decimal.multiply(d.pieces,ratio) : '0'; const weightTake=d.weight ? decimal.multiply(d.weight,ratio) : null;
      const availablePieces=decimal.compare(pieceTake,'0')>0?decimal.subtract(lot.availablePieces,pieceTake):lot.availablePieces; if(decimal.compare(availablePieces,'0')<0)throw new Error('Available piece count is insufficient.');
      const availableWeight=weightTake&&lot.availableWeight?decimal.subtract(lot.availableWeight,weightTake):lot.availableWeight; if(availableWeight&&decimal.compare(availableWeight,'0')<0)throw new Error('Available weight is insufficient.');
      await tx.update(s.mealsInventoryLots).set({availableQuantity:decimal.subtract(lot.availableQuantity,take),consumedQuantity:decimal.add(lot.consumedQuantity,take),availablePieces,consumedPieces:decimal.add(lot.consumedPieces,pieceTake),availableWeight,consumedWeight:weightTake?decimal.add(lot.consumedWeight,weightTake):lot.consumedWeight}).where(eq(s.mealsInventoryLots.id,lot.id));
      let nutritionSnapshot:Record<string,unknown>={unknown:'No reviewed nutrition profile exists for this food and serving unit.'};
      if(planItem)nutritionSnapshot=scaleNutritionSnapshot(planItem.calculatedNutrients as Record<string,unknown>,take,planItem.servingQuantity);
      else {const [profile]=await tx.select().from(s.mealsNutritionProfiles).where(eq(s.mealsNutritionProfiles.foodId,d.foodId)).orderBy(desc(s.mealsNutritionProfiles.version)).limit(1);if(profile?.provenance?.manuallyReviewed===true){const values=mapNutrients(profile.nutrients as Record<string,unknown>);const basis=profile.basisType==='100g'?{kind:'per-100g' as const,values}:profile.basisType==='100ml'?{kind:'per-100ml' as const,values}:{kind:'per-serving' as const,servingName:profile.servingName??'serving',servingQuantity:profile.servingQuantity??undefined,servingUnit:(profile.servingUnit as Measurement['unit']|null)??undefined,servingGrams:['g','kg'].includes(profile.servingUnit??'')?profile.servingQuantity??undefined:undefined,servingMillilitres:['ml','l'].includes(profile.servingUnit??'')?profile.servingQuantity??undefined:undefined,values};const amount=calculateNutrition({id:String(food.id),name:food.name,basis,allergens:food.allergens,tags:food.dietTags,restrictions:food.restrictions,confirmed:true},{amount:take,unit:d.unit,factors:factorsFromFoodMeasurements(food.totalWeight??undefined,food.totalWeightUnit??undefined,food.pieceCount??undefined)});if(amount)nutritionSnapshot={...amount,source:profile.source,profileVersion:profile.version,confidence:profile.confidence,units:profile.nutrientUnits};}}
      const idem:string=created.length===0?d.idempotencyKey:`${d.idempotencyKey}:${lot.id}`;
      const insertedEvents:(typeof s.mealsConsumptionEvents.$inferSelect)[]=await tx.insert(s.mealsConsumptionEvents).values({ownerKey:owner,planItemId:d.planItemId,foodId:d.foodId,lotId:lot.id,mealType:d.mealType,quantity:take,quantityUnit:d.unit,pieces:pieceTake==='0'?null:pieceTake,weight:weightTake,weightUnit:weightTake?d.weightUnit:null,costMinor:cost.toString(),currency:lot.currency,nutritionSnapshot:{...nutritionSnapshot,quantity:take,unit:d.unit},idempotencyKey:idem,notes:d.notes}).returning(); const consumptionEvent:typeof s.mealsConsumptionEvents.$inferSelect=insertedEvents[0];
      await tx.insert(s.mealsInventoryEvents).values({ownerKey:owner,lotId:lot.id,eventType:'CONSUMPTION',quantityDelta:`-${take}`,quantityUnit:d.unit,idempotencyKey:idem,details:{consumptionEventId:consumptionEvent.id}});
      created.push(consumptionEvent); remaining=decimal.subtract(remaining,take); consumedCost+=BigInt(cost.toString());
    }
    if(decimal.compare(remaining,'0')>0)throw new Error('Available stock is insufficient for this recorded meal.');
    return {consumptionEvents:created,costMinor:consumedCost.toString()};
  });
}

async function createFinanceLink(db: typeof import('@/lib/db').db, s: typeof import('@/lib/schema'), owner: string, lotId: number) {
  return db.transaction(async (tx) => {
    const [settings] = await tx.select().from(s.mealsSettings).where(eq(s.mealsSettings.id, true)).limit(1);
    if (!settings?.financeIntegrationEnabled) throw new Error('Enable the Finance integration in Meals settings first.');
    const [lot] = await tx.select().from(s.mealsInventoryLots).where(and(eq(s.mealsInventoryLots.id, lotId), eq(s.mealsInventoryLots.ownerKey, owner))).for('update').limit(1);
    if (!lot) throw new Error('The purchased lot was not found.');
    const [existing] = await tx.select().from(s.mealsFinanceLinks).where(and(eq(s.mealsFinanceLinks.ownerKey, owner), eq(s.mealsFinanceLinks.inventoryLotId, lotId))).limit(1);
    if (existing) return { financeLink: existing, duplicate: true };
    if (BigInt(lot.priceMinor) <= BigInt(0)) throw new Error('This purchase lot has no positive recorded purchase price to link.');
    const [food] = await tx.select().from(s.mealsFoods).where(and(eq(s.mealsFoods.id, lot.foodId), eq(s.mealsFoods.ownerKey, owner))).limit(1);
    if (!food) throw new Error('The purchased food record was not found.');
    const [category] = await tx.select().from(s.financeCategories).where(eq(s.financeCategories.key, 'ESSENTIAL')).limit(1);
    if (!category) throw new Error('Personal Finance essential category is not available.');
    const transactionDate = lot.purchasedAt.toISOString().slice(0, 10);
    const transactionRow = { title: `Food purchase: ${food.name}`.slice(0, 180), amountMinor: lot.priceMinor, currency: lot.currency, transactionType: 'EXPENSE', categoryKey: 'ESSENTIAL', transactionDate, description: `Explicitly linked from Meals & Nutrition inventory purchase lot ${lot.id}` };
    const [financeTransaction] = await tx.insert(s.financeTransactions).values(transactionRow).returning();
    await tx.insert(s.financeTransactionHistory).values({ transactionId: financeTransaction.id, action: 'CREATE', beforeSnapshot: null, afterSnapshot: financeTransaction as unknown as Record<string, unknown> });
    const [financeLink] = await tx.insert(s.mealsFinanceLinks).values({ ownerKey: owner, financeTransactionId: financeTransaction.id, inventoryLotId: lot.id }).returning();
    return { financeLink, financeTransaction };
  });
}
