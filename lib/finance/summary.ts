import { CATEGORY_ORDER, monthRange } from './money';

type Row = Record<string, any>;
type Snapshot = { incomes: Row[]; runs: Row[]; allocations: Row[]; transactions: Row[]; adjustments: Row[]; goals: Row[]; investments: Row[]; categories: Row[] };
const ZERO = '0';
const amount = (value: unknown) => BigInt(value == null ? ZERO : String(value));
const add = (left: bigint, right: bigint) => left + right;
const inRange = (value: string, start: string, end: string) => value >= start && value < end;
const sumRows = (rows: Row[], select: (row: Row) => boolean) => rows.filter(select).reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));

export function summarizeFinance(data: Snapshot, currency: string, month: string, monthStartDay: number) {
  const { start, endExclusive } = monthRange(month, monthStartDay);
  const incomes = data.incomes.filter((row) => row.currency === currency && row.status === 'RECEIVED');
  const currentRunByIncome = new Map(incomes.filter((row) => row.allocationRevision != null).map((row) => [row.id, Number(row.allocationRevision)]));
  const activeRuns = data.runs.filter((run) => run.currency === currency && currentRunByIncome.get(run.incomeId) === Number(run.revision));
  const activeRunIds = new Set(activeRuns.map((run) => run.id));
  const periodIncomeIds = new Set(incomes.filter((row) => inRange(row.receivedAt, start, endExclusive)).map((row) => row.id));
  const periodRunIds = new Set(activeRuns.filter((run) => periodIncomeIds.has(run.incomeId)).map((run) => run.id));
  const currentAllocations = data.allocations.filter((row) => activeRunIds.has(row.runId));
  const periodAllocations = currentAllocations.filter((row) => periodRunIds.has(row.runId));
  const txCurrency = data.transactions.filter((row) => row.currency === currency && !row.deletedAt);
  const allTx = txCurrency;
  const periodTx = txCurrency.filter((row) => inRange(row.transactionDate, start, endExclusive));
  const adjustments = data.adjustments.filter((row) => row.currency === currency);
  const periodAdjustments = adjustments.filter((row) => inRange(row.effectiveDate, start, endExclusive));
  const activeCategories = data.categories.filter((row) => row.isActive);
  const keys = [...new Set([...CATEGORY_ORDER, ...activeCategories.map((row) => row.key), ...periodAllocations.map((row) => row.categoryKey), ...periodAdjustments.map((row) => row.categoryKey), ...periodTx.flatMap((row) => [row.categoryKey, row.transferToCategoryKey].filter(Boolean))])];
  const budgetRows = keys.map((key) => {
    const allocatedMinor = periodAllocations.filter((row) => row.categoryKey === key).reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0)) + periodAdjustments.filter((row) => row.categoryKey === key).reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));
    const expensesMinor = sumRows(periodTx, (row) => row.transactionType === 'EXPENSE' && row.categoryKey === key);
    const givingMinor = sumRows(periodTx, (row) => row.transactionType === 'GIVING' && row.categoryKey === key);
    const savingsMinor = sumRows(periodTx, (row) => row.transactionType === 'SAVINGS_CONTRIBUTION' && row.categoryKey === key);
    const investmentMinor = sumRows(periodTx, (row) => row.transactionType === 'INVESTMENT_CONTRIBUTION' && row.categoryKey === key);
    const transferOut = sumRows(periodTx, (row) => row.transactionType === 'TRANSFER' && row.categoryKey === key);
    const transferIn = sumRows(periodTx, (row) => row.transactionType === 'TRANSFER' && row.transferToCategoryKey === key);
    const usedMinor = expensesMinor + givingMinor + savingsMinor + investmentMinor + transferOut - transferIn;
    const remainingMinor = allocatedMinor - usedMinor;
    return { categoryKey: key, name: data.categories.find((category) => category.key === key)?.name ?? key, allocatedMinor: allocatedMinor.toString(), spentMinor: expensesMinor.toString(), givingMinor: givingMinor.toString(), committedMinor: (givingMinor + savingsMinor + investmentMinor + transferOut - transferIn).toString(), remainingMinor: remainingMinor.toString(), utilizedBp: allocatedMinor > BigInt(0) ? Number((usedMinor * BigInt(10000)) / allocatedMinor) : 0, overBudget: remainingMinor < BigInt(0) };
  });
  const incomeThisPeriod = incomes.filter((row) => inRange(row.receivedAt, start, endExclusive)).reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));
  const totalAllocated = periodAllocations.reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));
  const totalExpenses = sumRows(periodTx, (row) => row.transactionType === 'EXPENSE');
  const amountGiven = sumRows(periodTx, (row) => row.transactionType === 'GIVING');
  const givingAllocated = periodAllocations.filter((row) => row.categoryKey === 'GIVING').reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));
  const allReceived = incomes.reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));
  const allExpenses = sumRows(allTx, (row) => row.transactionType === 'EXPENSE');
  const allGiving = sumRows(allTx, (row) => row.transactionType === 'GIVING');
  const savingsContributions = sumRows(allTx, (row) => row.transactionType === 'SAVINGS_CONTRIBUTION');
  const savingsWithdrawals = sumRows(allTx, (row) => row.transactionType === 'SAVINGS_WITHDRAWAL');
  const investmentContributions = sumRows(allTx, (row) => row.transactionType === 'INVESTMENT_CONTRIBUTION');
  const investmentWithdrawals = sumRows(allTx, (row) => row.transactionType === 'INVESTMENT_WITHDRAWAL');
  const availableBalance = allReceived - allExpenses - allGiving - savingsContributions - investmentContributions + savingsWithdrawals + investmentWithdrawals;
  const savingsBalanceByGoal = new Map<number, bigint>();
  for (const row of allTx) {
    if (!row.goalId || !['SAVINGS_CONTRIBUTION', 'SAVINGS_WITHDRAWAL'].includes(row.transactionType)) continue;
    const previous = savingsBalanceByGoal.get(row.goalId) ?? BigInt(0);
    savingsBalanceByGoal.set(row.goalId, previous + (row.transactionType === 'SAVINGS_CONTRIBUTION' ? amount(row.amountMinor) : -amount(row.amountMinor)));
  }
  const goalProgress = data.goals.filter((goal) => goal.currency === currency && goal.isActive).map((goal) => {
    const currentMinor = savingsBalanceByGoal.get(goal.id) ?? BigInt(0);
    const targetMinor = amount(goal.targetMinor);
    return { ...goal, currentMinor: currentMinor.toString(), progressBp: targetMinor > BigInt(0) ? Math.min(10000, Number((currentMinor * BigInt(10000)) / targetMinor)) : 0 };
  });
  const investmentContributed = new Map<number, bigint>();
  for (const row of allTx) {
    if (!row.investmentId || !['INVESTMENT_CONTRIBUTION', 'INVESTMENT_WITHDRAWAL'].includes(row.transactionType)) continue;
    const previous = investmentContributed.get(row.investmentId) ?? BigInt(0);
    investmentContributed.set(row.investmentId, previous + (row.transactionType === 'INVESTMENT_CONTRIBUTION' ? amount(row.amountMinor) : -amount(row.amountMinor)));
  }
  const investmentRows = data.investments.filter((item) => item.currency === currency && item.isActive).map((item) => ({ ...item, netContributedMinor: (investmentContributed.get(item.id) ?? BigInt(0)).toString(), trackedValueMinor: item.currentValueMinor ?? (investmentContributed.get(item.id) ?? BigInt(0)).toString() }));
  const category = (key: string) => budgetRows.find((row) => row.categoryKey === key)?.remainingMinor ?? ZERO;
  const summary = {
    currency, month, start, endExclusive,
    incomeReceivedMinor: incomeThisPeriod.toString(), totalAllocatedMinor: totalAllocated.toString(), totalExpensesMinor: totalExpenses.toString(), amountGivenMinor: amountGiven.toString(), givingAllocatedMinor: givingAllocated.toString(), availableBalanceMinor: availableBalance.toString(),
    businessReinvestmentBalanceMinor: category('BUSINESS'), emergencySavingsBalanceMinor: goalProgress.filter((goal) => (goal as Row).goalType === 'EMERGENCY').reduce((sum, goal) => sum + amount(goal.currentMinor), BigInt(0)).toString(), longTermInvestmentBalanceMinor: investmentRows.reduce((sum, investment) => sum + amount(investment.trackedValueMinor), BigInt(0)).toString(), learningBudgetBalanceMinor: category('LEARNING'), personalEnjoymentBalanceMinor: category('ENJOYMENT'),
  };
  const monthStart = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1));
  const trends = Array.from({ length: 6 }, (_, offset) => {
    const monthDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 5 + offset, 1));
    const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const range = monthRange(key, monthStartDay);
    const monthlyIncome = incomes.filter((row) => inRange(row.receivedAt, range.start, range.endExclusive)).reduce((sum, row) => sum + amount(row.amountMinor), BigInt(0));
    const monthlyExpenses = sumRows(txCurrency.filter((row) => inRange(row.transactionDate, range.start, range.endExclusive)), (row) => row.transactionType === 'EXPENSE');
    return { month: key, incomeMinor: monthlyIncome.toString(), expensesMinor: monthlyExpenses.toString() };
  });
  const recentTransactions = [...txCurrency].sort((left, right) => right.transactionDate.localeCompare(left.transactionDate) || right.id - left.id).slice(0, 12);
  return { summary, budgets: budgetRows, goals: goalProgress, investments: investmentRows, trends, recentTransactions };
}
