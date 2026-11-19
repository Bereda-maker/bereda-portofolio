import test from 'node:test';
import assert from 'node:assert/strict';
import { adultBmi, calculateNutrition, costForMeasurement, decimal, prorateMinorUnits, nutritionSafety, selectAffordableMeals, factorsFromFoodMeasurements, type FoodProfile } from '../lib/meals/engine';

const food:FoodProfile={id:'bean',name:'Fictional Bean',confirmed:true,basis:{kind:'per-100g',values:{proteinG:'7.25',energyKcal:'121'}}};
const price={amount:'3.01',package:{amount:'500',unit:'g' as const}};
test('decimal operations do not route through binary floating point',()=>{
 assert.equal(decimal.add('0.1','0.2'),'0.3'); assert.equal(decimal.multiply('3.01','0.5'),'1.505');
 assert.throws(()=>decimal.parse('1e3')); assert.throws(()=>decimal.parse('0.0000001'));
});
test('nutrition scales by mass and preserves unknown nutrients',()=>{
 assert.deepEqual(calculateNutrition(food,{amount:'50',unit:'g'}),{proteinG:'3.625',energyKcal:'60.5'});
 assert.equal(calculateNutrition(food,{amount:'1',unit:'piece'}),null);
 assert.equal(calculateNutrition({...food,confirmed:false},{amount:'50',unit:'g'}),null);
});
test('piece conversion is explicit and volume conversion requires a factor',()=>{
 assert.equal(calculateNutrition(food,{amount:'2',unit:'piece',factors:{gramsPerPiece:'25'}})?.proteinG,'3.625');
 assert.equal(calculateNutrition(food,{amount:'50',unit:'ml'}),null);
 assert.equal(calculateNutrition(food,{amount:'50',unit:'ml',factors:{gramsPerMillilitre:'1'}})?.proteinG,'3.625');
});
test('cost prorates only compatible measurable package amounts',()=>{
 assert.equal(costForMeasurement('3.01',{amount:'500',unit:'g'},{amount:'250',unit:'g'}),'1.505');
 assert.equal(costForMeasurement('3.01',{amount:'1',unit:'piece'},{amount:'1',unit:'piece'}),'3.01');
});
test('selector excludes unavailable, expired, insufficient and restricted foods; respects budget',()=>{
 const candidates=[{id:'a',name:'Bean bowl',items:[{foodId:'bean',amount:{amount:'100',unit:'g' as const}}]},{id:'b',name:'Large bean bowl',items:[{foodId:'bean',amount:{amount:'501',unit:'g' as const}}]}];
 const result=selectAffordableMeals({foods:[food],stock:[{foodId:'bean',quantity:{amount:'500',unit:'g'}}],candidates,prices:{bean:price},budget:'1',date:'2026-01-01',limit:10});
 assert.deepEqual(result.meals.map(m=>m.candidate.id),['a']);assert.equal(result.meals[0].cost,'0.602');assert.equal(result.shortfall,'0.398');assert.deepEqual(result.alternatives.map(m=>m.candidate.id),[]);
 const restricted=selectAffordableMeals({foods:[{...food,allergens:['fictional-soy']}],stock:[{foodId:'bean',quantity:{amount:'500',unit:'g'}}],candidates,prices:{bean:price},budget:'10',date:'2026-01-01',allergens:['fictional-soy']});assert.equal(restricted.meals.length,0);assert.ok(restricted.reason);
 const expired=selectAffordableMeals({foods:[food],stock:[{foodId:'bean',quantity:{amount:'500',unit:'g'},expiresOn:'2025-12-31'}],candidates,prices:{bean:price},budget:'10',date:'2026-01-01'});assert.equal(expired.meals.length,0);
});
test('selection applies deterministic protein preference within budget and reports bounded alternatives',()=>{
 const foods=[food,{...food,id:'rice',name:'Rice',basis:{kind:'per-100g' as const,values:{proteinG:'2'}}}];
 const candidates=[{id:'low',name:'Rice portion',items:[{foodId:'rice',amount:{amount:'100',unit:'g' as const}}]},{id:'high',name:'Bean portion',items:[{foodId:'bean',amount:{amount:'100',unit:'g' as const}}]}];
 const stock=[{foodId:'bean',quantity:{amount:'500',unit:'g' as const}},{foodId:'rice',quantity:{amount:'500',unit:'g' as const}}];const prices={bean:price,rice:price};
 const result=selectAffordableMeals({foods,stock,candidates,prices,budget:'1',date:'2026-01-01',limit:1});assert.equal(result.meals[0].candidate.id,'high');assert.equal(result.alternatives[0].candidate.id,'low');
});
test('safety helpers refuse prescriptive targets and do not apply adult BMI to minors',()=>{
 assert.deepEqual(nutritionSafety({ageYears:16,pregnantOrLactating:true}).reasons,['minor','pregnancy-or-lactation']);assert.equal(nutritionSafety({ageYears:16}).adultBmiAllowed,false);assert.equal(adultBmi('60','1.7',17),null);assert.equal(adultBmi('60','1.7',30)?.informationalOnly,true);
});
test('count-based piece and named-serving nutrition only scale against the same explicitly declared unit',()=>{
 const perPiece:FoodProfile={id:'piece',name:'Piece food',confirmed:true,basis:{kind:'per-serving',servingName:'one piece',servingQuantity:'1',servingUnit:'piece',values:{energyKcal:'62',proteinG:'1.2'}}};
 assert.deepEqual(calculateNutrition(perPiece,{amount:'2',unit:'piece'}),{energyKcal:'124',proteinG:'2.4'});
 assert.equal(calculateNutrition(perPiece,{amount:'2',unit:'g'}),null);
 assert.equal(costForMeasurement('3.00',{amount:'6',unit:'piece'},{amount:'2',unit:'piece'}),'1');
});
test('selector never recommends more count-based stock than the available pieces',()=>{
 const perPiece:FoodProfile={id:'fruit',name:'Fruit',confirmed:true,basis:{kind:'per-serving',servingName:'one piece',servingQuantity:'1',servingUnit:'piece',values:{energyKcal:'60',proteinG:'1'}}};
 const candidates=[{id:'one',name:'One fruit',items:[{foodId:'fruit',amount:{amount:'1',unit:'piece' as const}}]},{id:'two',name:'Two fruit',items:[{foodId:'fruit',amount:{amount:'2',unit:'piece' as const}}]}];
 const result=selectAffordableMeals({foods:[perPiece],stock:[{foodId:'fruit',quantity:{amount:'1',unit:'piece'}}],candidates,prices:{fruit:{amount:'2',package:{amount:'1',unit:'piece'}}},budget:'10',date:'2026-01-01',limit:2});
 assert.equal(result.meals.length,1);assert.equal(result.meals[0].candidate.id,'one');
});

test('minor-unit purchase proration rounds once on the currency quantum',()=>{
 assert.equal(prorateMinorUnits('301','1','2'),'151');
 assert.equal(prorateMinorUnits('301','2','2'),'301');
 assert.equal(prorateMinorUnits('100','1','3'),'33');
});

test('soft dietary preferences rank matching tags without weakening hard allergy filters',()=>{
 const base={confirmed:true as const,basis:{kind:'per-100g' as const,values:{proteinG:'10'}}};
 const foods:FoodProfile[]=[{...base,id:'plain',name:'Plain',tags:[]},{...base,id:'preferred',name:'Preferred',tags:['vegetarian']}];
 const candidates=[{id:'plain',name:'Plain',items:[{foodId:'plain',amount:{amount:'100',unit:'g' as const}}]},{id:'preferred',name:'Preferred',items:[{foodId:'preferred',amount:{amount:'100',unit:'g' as const}}]}];
 const result=selectAffordableMeals({foods,stock:foods.map(f=>({foodId:f.id,quantity:{amount:'200',unit:'g' as const}})),candidates,prices:{plain:{amount:'1',package:{amount:'100',unit:'g'}},preferred:{amount:'1',package:{amount:'100',unit:'g'}}},budget:'10',date:'2026-01-01',preferences:['vegetarian'],limit:1});
 assert.equal(result.meals[0]?.candidate.id,'preferred');
});


test('piece-to-weight calculations require separately recorded total weight and piece count',()=>{
 const factors=factorsFromFoodMeasurements('500','g','45');assert.equal(factors?.gramsPerPiece,'11.111111');
 const profile:FoodProfile={id:'banana',name:'Banana',confirmed:true,basis:{kind:'per-100g',values:{energyKcal:'89'}},...factors};
 assert.equal(calculateNutrition(profile,{amount:'2',unit:'piece',factors})?.energyKcal,'19.777758');
 assert.equal(factorsFromFoodMeasurements('500','g',undefined),undefined);
});
