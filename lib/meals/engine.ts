/* Pure nutrition, costing, and meal-selection primitives. Decimal inputs are strings; values are fixed to 6 decimal places internally. */
export const SCALE = BigInt(1000000);
export type DecimalInput = string;
export type Decimal = string;

function parse(value: DecimalInput): bigint {
  if (typeof value !== 'string' || !/^-?(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) throw new Error(`Invalid decimal: ${value}`);
  const negative = value[0] === '-';
  const raw = negative ? value.slice(1) : value;
  const [whole, fraction = ''] = raw.split('.');
  const result = BigInt(whole) * SCALE + BigInt((fraction + '000000').slice(0, 6));
  return negative ? -result : result;
}
function fmt(value: bigint): Decimal {
  const neg = value < BigInt(0); const n = neg ? -value : value;
  const whole = n / SCALE; const frac = (n % SCALE).toString().padStart(6, '0').replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
}
function mul(a: bigint, b: bigint): bigint { return a * b / SCALE; }
function div(a: bigint, b: bigint): bigint { if (b === BigInt(0)) throw new Error('Division by zero'); return a * SCALE / b; }
export const decimal = { parse, format: fmt, add: (a: DecimalInput,b: DecimalInput) => fmt(parse(a)+parse(b)), subtract: (a: DecimalInput,b: DecimalInput) => fmt(parse(a)-parse(b)), multiply: (a: DecimalInput,b: DecimalInput) => fmt(mul(parse(a),parse(b))), divide: (a: DecimalInput,b: DecimalInput) => fmt(div(parse(a),parse(b))), compare: (a: DecimalInput,b: DecimalInput) => parse(a)<parse(b)?-1:parse(a)>parse(b)?1:0 };

export type Basis = { kind: 'per-100g'; values: Partial<Record<Nutrient, DecimalInput>> } | { kind: 'per-100ml'; values: Partial<Record<Nutrient, DecimalInput>> } | { kind:'per-serving'; servingName:string; servingGrams?:DecimalInput; servingMillilitres?:DecimalInput; servingQuantity?:DecimalInput; servingUnit?:Unit; values:Partial<Record<Nutrient,DecimalInput>> };
export type Nutrient = string;
export interface FoodProfile { id:string; name:string; basis:Basis; allergens?:string[]; tags?:string[]; restrictions?:string[]; confirmed:boolean }
export type Unit = 'g'|'kg'|'ml'|'l'|'piece'|'serving';
export interface ConversionFactors { gramsPerMillilitre?:DecimalInput; gramsPerPiece?:DecimalInput; millilitresPerPiece?:DecimalInput; gramsPerServing?:DecimalInput; millilitresPerServing?:DecimalInput }
export interface Measurement { amount:DecimalInput; unit:Unit; factors?:ConversionFactors }
export function factorsFromFoodMeasurements(totalWeight:DecimalInput|undefined|null,totalWeightUnit:string|undefined|null,pieceCount:DecimalInput|undefined|null):ConversionFactors|undefined {
  if(totalWeight==null||totalWeightUnit==null||pieceCount==null)return undefined;
  if(!['g','kg'].includes(totalWeightUnit)||parse(totalWeight)<=BigInt(0)||parse(pieceCount)<=BigInt(0))return undefined;
  const grams=totalWeightUnit==='kg'?mul(parse(totalWeight),parse('1000')):parse(totalWeight);
  return {gramsPerPiece:fmt(div(grams,parse(pieceCount)))};
}
export type MeasurementBasis='g'|'ml'|'piece'|'serving';
export function measurementInBasis(measurement:Measurement):{basis: MeasurementBasis; quantity:Decimal}|null {
  const a=parse(measurement.amount); if(a<=BigInt(0)) return null;
  const f=measurement.factors||{}; let grams:bigint|undefined, ml:bigint|undefined;
  switch(measurement.unit){case'g':grams=a;break;case'kg':grams=mul(a,parse('1000'));break;case'ml':ml=a;break;case'l':ml=mul(a,parse('1000'));break;case'piece':if(f.gramsPerPiece)grams=mul(a,parse(f.gramsPerPiece));else if(f.millilitresPerPiece)ml=mul(a,parse(f.millilitresPerPiece));else return {basis:'piece',quantity:fmt(a)};break;case'serving':if(f.gramsPerServing)grams=mul(a,parse(f.gramsPerServing));else if(f.millilitresPerServing)ml=mul(a,parse(f.millilitresPerServing));else return {basis:'serving',quantity:fmt(a)};}
  if(grams!==undefined&&ml===undefined&&f.gramsPerMillilitre) ml=div(grams,parse(f.gramsPerMillilitre));
  if(ml!==undefined&&grams===undefined&&f.gramsPerMillilitre) grams=mul(ml,parse(f.gramsPerMillilitre));
  return grams!==undefined?{basis:'g',quantity:fmt(grams)}:ml!==undefined?{basis:'ml',quantity:fmt(ml)}:null;
}
export function calculateNutrition(profile:FoodProfile, amount:Measurement):Partial<Record<Nutrient,Decimal>>|null {
  if(!profile.confirmed) return null;
  const measured=measurementInBasis(amount); if(!measured)return null;
  if(profile.basis.kind==='per-serving'&&profile.basis.servingUnit===amount.unit&&profile.basis.servingQuantity!==undefined){
    const ratio=div(parse(amount.amount),parse(profile.basis.servingQuantity)); const out:Partial<Record<Nutrient,Decimal>>={};
    for(const key of Object.keys(profile.basis.values) as Nutrient[]){const value=profile.basis.values[key];if(value!==undefined)out[key]=fmt(mul(parse(value),ratio));}return out;
  }
  const base=profile.basis.kind==='per-100g'?'g':profile.basis.kind==='per-100ml'?'ml':profile.basis.servingGrams?'g':profile.basis.servingMillilitres?'ml':null;
  if(!base||measured.basis!==base)return null;
  const basisAmount=profile.basis.kind==='per-100g'||profile.basis.kind==='per-100ml'?parse('100'):parse(base==='g'?profile.basis.servingGrams!:profile.basis.servingMillilitres!);
  const ratio=div(parse(measured.quantity),basisAmount); const out:Partial<Record<Nutrient,Decimal>>={};
  for(const key of Object.keys(profile.basis.values) as Nutrient[]){const value=profile.basis.values[key];if(value!==undefined)out[key]=fmt(mul(parse(value),ratio));}
  return out;
}
export function costForMeasurement(unitPrice:DecimalInput, packageQuantity:Measurement, requested:Measurement):Decimal|null {
  if(parse(unitPrice)<BigInt(0))return null;
  const pkg=measurementInBasis(packageQuantity), req=measurementInBasis(requested);
  if(!pkg||!req||pkg.basis!==req.basis||parse(pkg.quantity)<parse(req.quantity))return null;
  return fmt(parse(unitPrice)*parse(req.quantity)/parse(pkg.quantity));
}


export function prorateMinorUnits(totalMinorInput:string|bigint,partInput:DecimalInput,wholeInput:DecimalInput):string {
  const total=BigInt(totalMinorInput),part=parse(partInput),whole=parse(wholeInput);
  if(total<BigInt(0)||part<BigInt(0)||whole<=BigInt(0)||part>whole)throw new Error('Invalid amount or quantity for cost proration.');
  const numerator=total*part;let quotient=numerator/whole;const remainder=numerator%whole;if(remainder*BigInt(2)>=whole)quotient+=BigInt(1);return quotient.toString();
}

export interface StockItem { foodId:string; quantity:Measurement; expiresOn?:string|null; available?:boolean }
export interface MealCandidate { id:string; name:string; items:{foodId:string; amount:Measurement}[]; servings?:number; mealType?:string; explanation?:string }
export interface SelectionInput { foods:FoodProfile[]; stock:StockItem[]; candidates:MealCandidate[]; budget:DecimalInput; prices:Record<string,{amount:DecimalInput; package:Measurement}>; date:string; allergens?:string[]; restrictions?:string[]; preferences?:string[]; proteinTargetGPerDay?:DecimalInput; limit?:number }
export interface SelectedMeal { candidate:MealCandidate; cost:Decimal; nutrition:Partial<Record<Nutrient,Decimal>>; preferenceScore?:number }
export interface SelectionResult { meals:SelectedMeal[]; alternatives:SelectedMeal[]; shortfall:Decimal; proteinTargetGPerDay?:Decimal; plannedProteinG:Decimal; proteinShortfallG:Decimal|null; reason:string|null }
export function selectAffordableMeals(input:SelectionInput):SelectionResult {
  const foods=new Map(input.foods.map(f=>[f.id,f])); const stock=new Map(input.stock.map(s=>[s.foodId,s])); const excluded=new Set([...(input.allergens||[]),...(input.restrictions||[])].map(x=>x.toLowerCase()));
  const ranked:SelectedMeal[]=[]; const limit=Math.max(0,Math.min(100,input.limit??20));
  for(const candidate of input.candidates.slice(0,500)){
    if(candidate.items.length===0)continue; let cost=BigInt(0); const totals:Partial<Record<Nutrient,bigint>>={}; let valid=true;
    for(const item of candidate.items){const food=foods.get(item.foodId), s=stock.get(item.foodId), p=input.prices[item.foodId]; if(!food?.confirmed||!s||s.available===false||(s.expiresOn&&s.expiresOn<input.date)||!p||food.allergens?.some(a=>excluded.has(a.toLowerCase()))||food.restrictions?.some(t=>excluded.has(t.toLowerCase()))){valid=false;break;}
      const have=measurementInBasis(s.quantity), need=measurementInBasis(item.amount); if(!have||!need||have.basis!==need.basis||parse(have.quantity)<parse(need.quantity)){valid=false;break;}
      const c=costForMeasurement(p.amount,p.package,item.amount); const n=calculateNutrition(food,item.amount); if(c===null||!n){valid=false;break;} cost+=parse(c); for(const k of Object.keys(n) as Nutrient[])totals[k]=(totals[k]||BigInt(0))+parse(n[k]!);
    }
    if(valid){const prefs=new Set((input.preferences||[]).map(x=>x.toLowerCase()));const preferenceScore=candidate.items.reduce((score,line)=>score+(foods.get(line.foodId)?.tags||[]).filter(tag=>prefs.has(tag.toLowerCase())).length,0);ranked.push({candidate,cost:fmt(cost),preferenceScore,nutrition:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,fmt(v as bigint)])) as Partial<Record<Nutrient,Decimal>>});}
  }
  // Preferences are soft signals; exact user-entered restrictions/allergies are hard filters. Only an explicit user-entered protein goal changes protein ranking.
  ranked.sort((a,b)=>{const ap=parse(a.nutrition.proteinG||'0'),bp=parse(b.nutrition.proteinG||'0'),ac=parse(a.cost),bc=parse(b.cost);if(input.proteinTargetGPerDay!==undefined){if((ac===BigInt(0))!==(bc===BigInt(0)))return ac===BigInt(0)?-1:1;const left=ap*bc,right=bp*ac;if(left!==right)return left>right?-1:1;if(ap!==bp)return ap>bp?-1:1;}if((a.preferenceScore||0)!==(b.preferenceScore||0))return (b.preferenceScore||0)-(a.preferenceScore||0);const aCoverage=Object.keys(a.nutrition).length,bCoverage=Object.keys(b.nutrition).length;if(aCoverage!==bCoverage)return bCoverage-aCoverage;if((ac===BigInt(0))!==(bc===BigInt(0)))return ac===BigInt(0)?-1:1;const left=ap*bc,right=bp*ac;if(left!==right)return left>right?-1:1;const c=ac-bc;return c<BigInt(0)?-1:c>BigInt(0)?1:a.candidate.id.localeCompare(b.candidate.id);});
  const chosen:SelectedMeal[]=[];let spent=BigInt(0);const remainingStock=new Map<string,{basis:MeasurementBasis;quantity:bigint}>();
  for(const row of input.stock){const m=measurementInBasis(row.quantity);if(m)remainingStock.set(row.foodId,{basis:m.basis,quantity:parse(m.quantity)});}
  const foodUseCount=new Map<string,number>();
  for(const item of ranked){if(chosen.length>=limit)break;if(chosen.some((x)=>x.candidate.id===item.candidate.id)||item.candidate.items.some((line)=> (foodUseCount.get(line.foodId)||0)>=2))continue;const c=parse(item.cost);if(spent+c>parse(input.budget))continue;
    const needed=new Map<string,{basis:MeasurementBasis;quantity:bigint}>();let available=true;
    for(const line of item.candidate.items){const measure=measurementInBasis(line.amount);const left=remainingStock.get(line.foodId);if(!measure||!left||left.basis!==measure.basis){available=false;break;}const prev=needed.get(line.foodId);needed.set(line.foodId,{basis:measure.basis,quantity:(prev?.quantity??BigInt(0))+parse(measure.quantity)});}
    if(!available)continue;for(const [foodId,need] of needed){const left=remainingStock.get(foodId)!;if(left.quantity<need.quantity){available=false;break;}}
    if(!available)continue;for(const [foodId,need] of needed){const left=remainingStock.get(foodId)!;remainingStock.set(foodId,{basis:left.basis,quantity:left.quantity-need.quantity});}
    chosen.push(item);for(const line of item.candidate.items)foodUseCount.set(line.foodId,(foodUseCount.get(line.foodId)||0)+1);spent+=c;
  }
  const alternatives=ranked.filter(x=>!chosen.some(c=>c.candidate.id===x.candidate.id)); const remaining=parse(input.budget)-spent;
  const plannedProtein=chosen.reduce((sum,meal)=>sum+parse(meal.nutrition.proteinG||'0'),BigInt(0));
  const proteinTarget=input.proteinTargetGPerDay===undefined?undefined:parse(input.proteinTargetGPerDay);
  return {meals:chosen,alternatives,shortfall:fmt(remaining>BigInt(0)?remaining:BigInt(0)),...(proteinTarget===undefined?{}:{proteinTargetGPerDay:fmt(proteinTarget)}),plannedProteinG:fmt(plannedProtein),proteinShortfallG:proteinTarget===undefined?null:fmt(plannedProtein<proteinTarget?proteinTarget-plannedProtein:BigInt(0)),reason:chosen.length?null:'No candidates met stock, safety, measurement and budget rules.'};
}

export function adultBmi(weightKg:DecimalInput,heightMetres:DecimalInput,ageYears:number):{bmi:Decimal; informationalOnly:true; limitation:string}|null {
  if(!Number.isInteger(ageYears)||ageYears<18||parse(weightKg)<=BigInt(0)||parse(heightMetres)<=BigInt(0))return null;
  const height=parse(heightMetres);return {bmi:fmt(div(parse(weightKg),mul(height,height))),informationalOnly:true,limitation:'BMI is a screening measure, not a diagnosis; it does not describe body composition or individual health.'};
}
export type SafetyContext={ageYears:number; pregnantOrLactating?:boolean; eatingDisorderConcern?:boolean; medicalCondition?:boolean};
export function nutritionSafety(context:SafetyContext):{personalizedTargetsAllowed:false; reasons:string[]; adultBmiAllowed:boolean} {
 const reasons:string[]=[];if(context.ageYears<18)reasons.push('minor');if(context.pregnantOrLactating)reasons.push('pregnancy-or-lactation');if(context.eatingDisorderConcern)reasons.push('eating-disorder-concern');if(context.medicalCondition)reasons.push('medical-condition');return {personalizedTargetsAllowed:false,reasons,adultBmiAllowed:context.ageYears>=18};
}
