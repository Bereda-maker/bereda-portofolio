import { CATEGORY_ORDER } from './money';
type Row = Record<string, any>;
const amount=(value:unknown)=>BigInt(value==null?'0':String(value));
const sum=(rows:Row[],predicate:(row:Row)=>boolean)=>rows.filter(predicate).reduce((total,row)=>total+amount(row.amountMinor),BigInt(0));
export function summarizeFinanceRange(data:{incomes:Row[];runs:Row[];allocations:Row[];transactions:Row[];adjustments:Row[];categories:Row[]},currency:string,start:string,endExclusive:string){
 const received=data.incomes.filter(row=>row.currency===currency&&row.status==='RECEIVED');
 const periodIncome=received.filter(row=>row.receivedAt>=start&&row.receivedAt<endExclusive);
 const currentRevisions=new Map(received.filter(row=>row.allocationRevision!=null).map(row=>[row.id,Number(row.allocationRevision)]));
 const periodIncomeIds=new Set(periodIncome.map(row=>row.id));
 const periodRuns=data.runs.filter(run=>run.currency===currency&&periodIncomeIds.has(run.incomeId)&&currentRevisions.get(run.incomeId)===Number(run.revision));
 const runIds=new Set(periodRuns.map(run=>run.id));
 const allocations=data.allocations.filter(row=>runIds.has(row.runId));
 const transactions=data.transactions.filter(row=>row.currency===currency&&!row.deletedAt&&row.transactionDate>=start&&row.transactionDate<endExclusive);
 const adjustments=data.adjustments.filter(row=>row.currency===currency&&row.effectiveDate>=start&&row.effectiveDate<endExclusive);
 const keys=[...new Set([...CATEGORY_ORDER,...data.categories.filter(row=>row.isActive).map(row=>row.key),...allocations.map(row=>row.categoryKey),...adjustments.map(row=>row.categoryKey),...transactions.flatMap(row=>[row.categoryKey,row.transferToCategoryKey].filter(Boolean))])];
 const categories=keys.map(key=>{
   const allocated=allocations.filter(row=>row.categoryKey===key).reduce((total,row)=>total+amount(row.amountMinor),BigInt(0))+adjustments.filter(row=>row.categoryKey===key).reduce((total,row)=>total+amount(row.amountMinor),BigInt(0));
   const expenses=sum(transactions,row=>row.transactionType==='EXPENSE'&&row.categoryKey===key);
   const giving=sum(transactions,row=>row.transactionType==='GIVING'&&row.categoryKey===key);
   const savings=sum(transactions,row=>row.transactionType==='SAVINGS_CONTRIBUTION'&&row.categoryKey===key);
   const investment=sum(transactions,row=>row.transactionType==='INVESTMENT_CONTRIBUTION'&&row.categoryKey===key);
   const transfersOut=sum(transactions,row=>row.transactionType==='TRANSFER'&&row.categoryKey===key);
   const transfersIn=sum(transactions,row=>row.transactionType==='TRANSFER'&&row.transferToCategoryKey===key);
   const used=expenses+giving+savings+investment+transfersOut-transfersIn;
   const remaining=allocated-used;
   return {categoryKey:key,name:data.categories.find(row=>row.key===key)?.name??key,allocatedMinor:allocated.toString(),spentMinor:expenses.toString(),givingMinor:giving.toString(),remainingMinor:remaining.toString(),utilizedBp:allocated>BigInt(0)?Number(used*BigInt(10000)/allocated):0,overBudget:remaining<BigInt(0)};
 });
 const incomeMinor=periodIncome.reduce((total,row)=>total+amount(row.amountMinor),BigInt(0));
 const allocatedMinor=allocations.reduce((total,row)=>total+amount(row.amountMinor),BigInt(0));
 const expensesMinor=sum(transactions,row=>row.transactionType==='EXPENSE');
 const givingMinor=sum(transactions,row=>row.transactionType==='GIVING');
 const cashOut=sum(transactions,row=>['EXPENSE','GIVING','SAVINGS_CONTRIBUTION','INVESTMENT_CONTRIBUTION'].includes(row.transactionType));
 const cashIn=sum(transactions,row=>['SAVINGS_WITHDRAWAL','INVESTMENT_WITHDRAWAL'].includes(row.transactionType));
 return {currency,start,endExclusive,totals:{incomeMinor:incomeMinor.toString(),allocatedMinor:allocatedMinor.toString(),expensesMinor:expensesMinor.toString(),givingMinor:givingMinor.toString(),availableCashFlowMinor:(incomeMinor-cashOut+cashIn).toString()},categories,transactions};
}
