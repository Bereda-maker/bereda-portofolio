import assert from 'node:assert/strict';
import test from 'node:test';
import { allocationPlanInput, currencyCode, financeSettingsInput, incomeInput, investmentInput, transactionInput } from '../lib/finance/validation';

const income={title:'Client milestone',amountMinor:'100500',currency:'etb',source:'Freelance development',receivedAt:'2026-11-17',status:'EXPECTED'};

test('income accepts expected and received records with safe optional storage references',()=>{
 assert.equal(incomeInput.safeParse(income).success,true);
 assert.equal(incomeInput.safeParse({...income,status:'RECEIVED',attachmentLabel:'Receipt',attachmentUrl:'/manus-storage/receipts/2026/one.pdf'}).success,true);
 assert.equal(incomeInput.safeParse({...income,currency:'CLF',amountMinor:'12345'}).success,true);
 assert.equal(currencyCode.safeParse('ZZZ').success,false);
 assert.equal(incomeInput.safeParse({...income,attachmentUrl:'https://example.com/receipt.pdf'}).success,true);
});

test('income rejects unsafe attachment references and unrecognized payload properties',()=>{
 assert.equal(incomeInput.safeParse({...income,attachmentUrl:'http://example.com/receipt.pdf'}).success,false);
 assert.equal(incomeInput.safeParse({...income,attachmentUrl:'/manus-storage/../private.pdf'}).success,false);
 assert.equal(incomeInput.safeParse({...income,fee:'100'}).success,false);
 assert.equal(incomeInput.safeParse({...income,transferToCategoryKey:'BUSINESS'}).success,false);
});

test('transaction schema requires correct transfer and savings/investment link fields',()=>{
 const base={title:'Laptop course',amountMinor:'1000',currency:'ETB',transactionType:'EXPENSE',categoryKey:'LEARNING',transactionDate:'2026-11-17'};
 assert.equal(transactionInput.safeParse(base).success,true);
 assert.equal(transactionInput.safeParse({...base,transactionType:'TRANSFER',transferToCategoryKey:'LEARNING'}).success,false);
 assert.equal(transactionInput.safeParse({...base,transactionType:'SAVINGS_CONTRIBUTION'}).success,false);
 assert.equal(transactionInput.safeParse({...base,transactionType:'SAVINGS_CONTRIBUTION',goalId:2}).success,true);
 assert.equal(transactionInput.safeParse({...base,transactionType:'INVESTMENT_CONTRIBUTION',investmentId:4}).success,true);
});

test('plans preserve six exact post-giving shares and settings remain strict',()=>{
 const plan={effectiveDate:'2026-11-18',givingBp:1000,essentialBp:3000,businessBp:3000,emergencyBp:1500,investmentBp:1000,learningBp:1000,enjoymentBp:500,explanation:'Future policy'};
 assert.equal(allocationPlanInput.safeParse(plan).success,true);
 assert.equal(allocationPlanInput.safeParse({...plan,enjoymentBp:400}).success,false);
 assert.equal(financeSettingsInput.safeParse({primaryCurrency:'usd',monthStartDay:15,aiEnabled:false,allowCsvExport:true}).success,true);
 assert.equal(financeSettingsInput.safeParse({primaryCurrency:'USD',providerKey:'secret'}).success,false);
});

test('a manually recorded investment value may be zero but never negative',()=>{
 const input={name:'Account value check',investmentCategory:'Retirement savings',currency:'USD',currentValueMinor:'0',valueAsOf:'2026-11-17'};
 assert.equal(investmentInput.safeParse(input).success,true);
 assert.equal(investmentInput.safeParse({...input,currentValueMinor:'-1'}).success,false);
});
