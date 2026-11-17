import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { financeAccess, financeDatabase, normalizedCurrency } from '@/lib/finance/api';
import { currentFinancialMonth } from '@/lib/finance/money';
import { summarizeFinance } from '@/lib/finance/summary';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const denied = await financeAccess();
  if (denied) return denied;
  try {
    const { db, schema } = await financeDatabase();
    const [settingsRows, categories, subcategories, plans, incomes, runs, allocations, transactions, goals, investments, adjustments, projects, learningExperiences] = await Promise.all([
      db.select().from(schema.financeSettings).limit(1),
      db.select().from(schema.financeCategories).orderBy(schema.financeCategories.sortOrder),
      db.select().from(schema.financeSubcategories).orderBy(schema.financeSubcategories.categoryKey, schema.financeSubcategories.sortOrder),
      db.select().from(schema.financeAllocationPlans).orderBy(desc(schema.financeAllocationPlans.effectiveDate)).limit(500),
      db.select().from(schema.financeIncome).orderBy(desc(schema.financeIncome.receivedAt), desc(schema.financeIncome.id)).limit(5000),
      db.select().from(schema.financeAllocationRuns).orderBy(desc(schema.financeAllocationRuns.createdAt)).limit(5000),
      db.select().from(schema.financeAllocations).orderBy(schema.financeAllocations.id).limit(35000),
      db.select().from(schema.financeTransactions).orderBy(desc(schema.financeTransactions.transactionDate), desc(schema.financeTransactions.id)).limit(10000),
      db.select().from(schema.financeGoals).orderBy(desc(schema.financeGoals.createdAt)).limit(500),
      db.select().from(schema.financeInvestments).orderBy(desc(schema.financeInvestments.createdAt)).limit(500),
      db.select().from(schema.financeBudgetAdjustments).orderBy(desc(schema.financeBudgetAdjustments.effectiveDate)).limit(5000),
      db.select({ id: schema.projects.id, title: schema.projects.title }).from(schema.projects).orderBy(schema.projects.title),
      db.select({ id: schema.learningExperiences.id, title: schema.learningExperiences.title }).from(schema.learningExperiences).orderBy(schema.learningExperiences.title),
    ]);
    const settings = settingsRows[0] ?? { primaryCurrency: 'ETB', monthStartDay: 1, aiEnabled: false };
    let requestedCurrency: string;
    try { requestedCurrency = normalizedCurrency(request.nextUrl.searchParams.get('currency'), settings.primaryCurrency); } catch { return NextResponse.json({ error: 'Choose a supported ISO 4217 currency code.' }, { status: 400 }); }
    const month = request.nextUrl.searchParams.get('month') ?? currentFinancialMonth(new Date(), settings.monthStartDay);
    const summary = summarizeFinance({ incomes, runs, allocations, transactions, adjustments, goals, investments, categories }, requestedCurrency, month, settings.monthStartDay);
    return NextResponse.json({ settings, categories, subcategories, plans, incomes, runs, allocations, transactions: transactions.filter((row) => !row.deletedAt), goals, investments, adjustments, projects, learningExperiences, summary });
  } catch (error) {
    console.error('[finance.snapshot] Failed to load finance records.');
    return NextResponse.json({ error: 'Finance records could not be loaded. Confirm the finance migration and database configuration are available.' }, { status: 503 });
  }
}
