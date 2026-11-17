import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeFinance } from '../lib/finance/summary';
import { summarizeFinanceRange } from '../lib/finance/report';
import { CATEGORY_ORDER } from '../lib/finance/money';

const categories = CATEGORY_ORDER.map((key,index)=>({key,name:key,isActive:true,sortOrder:index}));
const income = {id:1,title:'Consulting',amountMinor:'1000000',currency:'ETB',status:'RECEIVED',receivedAt:'2026-11-03',allocationRevision:2};
const activeRun = {id:2,incomeId:1,revision:2,planId:1,currency:'ETB',incomeAmountMinor:'1000000',givingAmountMinor:'100000',createdAt:'2026-11-03'};
const allocations = [
 {runId:2,categoryKey:'GIVING',amountMinor:'100000'}, {runId:2,categoryKey:'ESSENTIAL',amountMinor:'270000'},
 {runId:2,categoryKey:'BUSINESS',amountMinor:'270000'}, {runId:2,categoryKey:'EMERGENCY',amountMinor:'135000'},
 {runId:2,categoryKey:'LONG_TERM_INVESTMENT',amountMinor:'90000'}, {runId:2,categoryKey:'LEARNING',amountMinor:'90000'},
 {runId:2,categoryKey:'ENJOYMENT',amountMinor:'45000'},
];

test('dashboard totals use the current allocation revision and exclude other currencies',()=>{
 const result=summarizeFinance({incomes:[income,{...income,id:2,currency:'USD',amountMinor:'999999',receivedAt:'2026-11-04'},{...income,id:3,status:'EXPECTED',amountMinor:'999999'}],runs:[{...activeRun,id:1,revision:1},activeRun],allocations:[...allocations,...allocations.map(row=>({...row,runId:1}))],transactions:[],adjustments:[],goals:[],investments:[],categories},'ETB','2026-11',1);
 assert.equal(result.summary.incomeReceivedMinor,'1000000');
 assert.equal(result.summary.totalAllocatedMinor,'1000000');
 assert.equal(result.budgets.find(row=>row.categoryKey==='ESSENTIAL')?.allocatedMinor,'270000');
});

test('expenses, giving, transfers and savings contributions affect only their intended balances',()=>{
 const transactions=[
  {id:1,currency:'ETB',transactionDate:'2026-11-04',transactionType:'EXPENSE',amountMinor:'12000',categoryKey:'ESSENTIAL'},
  {id:2,currency:'ETB',transactionDate:'2026-11-05',transactionType:'GIVING',amountMinor:'5000',categoryKey:'GIVING'},
  {id:3,currency:'ETB',transactionDate:'2026-11-06',transactionType:'SAVINGS_CONTRIBUTION',amountMinor:'10000',categoryKey:'EMERGENCY',goalId:10},
  {id:4,currency:'ETB',transactionDate:'2026-11-07',transactionType:'SAVINGS_WITHDRAWAL',amountMinor:'1000',categoryKey:'EMERGENCY',goalId:10},
  {id:5,currency:'ETB',transactionDate:'2026-11-08',transactionType:'INVESTMENT_CONTRIBUTION',amountMinor:'20000',categoryKey:'LONG_TERM_INVESTMENT',investmentId:20},
  {id:6,currency:'ETB',transactionDate:'2026-11-09',transactionType:'TRANSFER',amountMinor:'5000',categoryKey:'BUSINESS',transferToCategoryKey:'ESSENTIAL'},
 ];
 const result=summarizeFinance({incomes:[income],runs:[activeRun],allocations,transactions,adjustments:[],goals:[{id:10,currency:'ETB',title:'Emergency reserve',goalType:'EMERGENCY',targetMinor:'50000',isActive:true}],investments:[{id:20,currency:'ETB',name:'Retirement account',isActive:true,currentValueMinor:'25000'}],categories},'ETB','2026-11',1);
 assert.equal(result.summary.totalExpensesMinor,'12000');
 assert.equal(result.summary.amountGivenMinor,'5000');
 assert.equal(result.summary.availableBalanceMinor,'954000');
 assert.equal(result.budgets.find(row=>row.categoryKey==='ESSENTIAL')?.remainingMinor,'263000');
 assert.equal(result.budgets.find(row=>row.categoryKey==='BUSINESS')?.remainingMinor,'265000');
 assert.equal(result.budgets.find(row=>row.categoryKey==='EMERGENCY')?.remainingMinor,'125000');
 assert.equal(result.goals[0]?.currentMinor,'9000');
 assert.equal(result.goals[0]?.progressBp,1800);
 assert.equal(result.investments[0]?.netContributedMinor,'20000');
 assert.equal(result.summary.longTermInvestmentBalanceMinor,'25000');
});

test('quarter report aggregates dates across the selected quarter and keeps savings outside expenses',()=>{
 const report=summarizeFinanceRange({incomes:[{id:1,status:'RECEIVED',currency:'USD',receivedAt:'2026-10-05',amountMinor:'100000',allocationRevision:1}],runs:[{id:3,incomeId:1,revision:1,currency:'USD'}],allocations:[{runId:3,categoryKey:'ESSENTIAL',amountMinor:'30000'},{runId:3,categoryKey:'GIVING',amountMinor:'10000'}],transactions:[{id:1,currency:'USD',transactionDate:'2026-10-22',transactionType:'EXPENSE',amountMinor:'1200',categoryKey:'ESSENTIAL'},{id:2,currency:'USD',transactionDate:'2026-11-03',transactionType:'SAVINGS_CONTRIBUTION',amountMinor:'3000',categoryKey:'EMERGENCY',goalId:1}],adjustments:[{currency:'USD',effectiveDate:'2026-11-15',categoryKey:'BUSINESS',amountMinor:'500'}],categories},'USD','2026-10-01','2027-01-01');
 assert.equal(report.totals.incomeMinor,'100000');
 assert.equal(report.totals.expensesMinor,'1200');
 assert.equal(report.totals.allocatedMinor,'40000');
 assert.equal(report.categories.find(row=>row.categoryKey==='ESSENTIAL')?.remainingMinor,'28800');
 assert.equal(report.categories.find(row=>row.categoryKey==='EMERGENCY')?.remainingMinor,'-3000');
 assert.equal(report.categories.find(row=>row.categoryKey==='BUSINESS')?.allocatedMinor,'500');
});


test('retired custom categories remain visible in historical dashboard and report rows',()=>{
 const records={incomes:[],runs:[],allocations:[],transactions:[{id:3,currency:'USD',transactionDate:'2026-10-10',transactionType:'EXPENSE',amountMinor:'2500',categoryKey:'CUSTOM_OLD'}],adjustments:[],goals:[],investments:[],categories:[{key:'CUSTOM_OLD',name:'Retired category',isActive:false}]};
 const dashboard=summarizeFinance(records,'USD','2026-10',1);
 const report=summarizeFinanceRange(records,'USD','2026-10-01','2026-11-01');
 assert.equal(dashboard.budgets.find(row=>row.categoryKey==='CUSTOM_OLD')?.name,'Retired category');
 assert.equal(report.categories.find(row=>row.categoryKey==='CUSTOM_OLD')?.spentMinor,'2500');
});
