import { desc, eq, lte, sql } from 'drizzle-orm';
import { allocateReceivedIncome } from './money';
import { financeAllocationPlans, financeAllocationRuns, financeAllocations, financeCategories, financeIncome, financeIncomeHistory, financeTransactions, financeTransactionHistory } from '@/lib/schema';

const jsonSnapshot = (row: Record<string, unknown>) => JSON.parse(JSON.stringify(row)) as Record<string, unknown>;

export async function createAllocationRevision(tx: any, income: Record<string, any>, reason: string) {
  await tx.execute(sql`SELECT id FROM finance_income WHERE id = ${income.id} FOR UPDATE`);
  const [locked] = await tx.select().from(financeIncome).where(eq(financeIncome.id, income.id)).limit(1);
  if (!locked || locked.status !== 'RECEIVED') return null;
  const [plan] = await tx.select().from(financeAllocationPlans).where(lte(financeAllocationPlans.effectiveDate, locked.receivedAt)).orderBy(desc(financeAllocationPlans.effectiveDate)).limit(1);
  if (!plan) throw new Error('No allocation plan is effective for this income date.');
  const allocation = allocateReceivedIncome(locked.amountMinor, plan);
  const revision = Number(locked.allocationRevision ?? 0) + 1;
  const policySnapshot = { id: plan.id, effectiveDate: plan.effectiveDate, givingBp: plan.givingBp, essentialBp: plan.essentialBp, businessBp: plan.businessBp, emergencyBp: plan.emergencyBp, investmentBp: plan.investmentBp, learningBp: plan.learningBp, enjoymentBp: plan.enjoymentBp };
  const [run] = await tx.insert(financeAllocationRuns).values({ incomeId: locked.id, revision, planId: plan.id, currency: locked.currency, incomeAmountMinor: locked.amountMinor, givingAmountMinor: allocation.givingMinor, policySnapshot, reason }).returning();
  const amounts: Record<string, string> = { GIVING: allocation.givingMinor, ...allocation.categories };
  const weights: Record<string, number> = { GIVING: plan.givingBp, ESSENTIAL: plan.essentialBp, BUSINESS: plan.businessBp, EMERGENCY: plan.emergencyBp, LONG_TERM_INVESTMENT: plan.investmentBp, LEARNING: plan.learningBp, ENJOYMENT: plan.enjoymentBp };
  await tx.insert(financeAllocations).values(Object.entries(amounts).map(([categoryKey, amountMinor]) => ({ runId: run.id, categoryKey, amountMinor, shareBp: weights[categoryKey] })));
  const [updated] = await tx.update(financeIncome).set({ allocationRevision: revision, updatedAt: new Date() }).where(eq(financeIncome.id, locked.id)).returning();
  return { run, income: updated };
}

export async function syncIncomeTransaction(tx: any, income: Record<string, any>) {
  const [existing] = await tx.select().from(financeTransactions).where(eq(financeTransactions.sourceIncomeId, income.id)).limit(1);
  if (income.status !== 'RECEIVED') {
    if (existing && !existing.deletedAt) {
      const [updated] = await tx.update(financeTransactions).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(financeTransactions.id, existing.id)).returning();
      await tx.insert(financeTransactionHistory).values({ transactionId: existing.id, action: 'DELETE', beforeSnapshot: jsonSnapshot(existing), afterSnapshot: jsonSnapshot(updated) });
      return updated;
    }
    return existing ?? null;
  }
  const values = { title: income.title, amountMinor: income.amountMinor, currency: income.currency, transactionType: 'INCOME', categoryKey: null, transferToCategoryKey: null, subcategoryId: null, transactionDate: income.receivedAt, paymentMethod: income.paymentMethod, description: income.description, attachmentLabel: income.attachmentLabel, attachmentUrl: income.attachmentUrl, sourceIncomeId: income.id, deletedAt: null, updatedAt: new Date() };
  if (existing) {
    const [updated] = await tx.update(financeTransactions).set(values).where(eq(financeTransactions.id, existing.id)).returning();
    await tx.insert(financeTransactionHistory).values({ transactionId: existing.id, action: 'UPDATE', beforeSnapshot: jsonSnapshot(existing), afterSnapshot: jsonSnapshot(updated) });
    return updated;
  }
  const [created] = await tx.insert(financeTransactions).values({ ...values, createdAt: new Date() }).returning();
  await tx.insert(financeTransactionHistory).values({ transactionId: created.id, action: 'CREATE', afterSnapshot: jsonSnapshot(created) });
  return created;
}

export async function recordIncomeHistory(tx: any, incomeId: number, action: 'CREATE'|'UPDATE'|'STATUS_CHANGE', before: Record<string, unknown>|null, after: Record<string, unknown>, note?: string|null) {
  await tx.insert(financeIncomeHistory).values({ incomeId, action, beforeSnapshot: before ? jsonSnapshot(before) : null, afterSnapshot: jsonSnapshot(after), note: note ?? null });
}

export async function validateTransactionRelations(tx: any, input: Record<string, any>) {
  const [category] = input.categoryKey ? await tx.select().from(financeCategories).where(eq(financeCategories.key, input.categoryKey)).limit(1) : [];
  if (input.categoryKey && (!category || !category.isActive)) throw new Error('The selected category does not exist or is inactive.');
  if (input.transactionType === 'GIVING' && input.categoryKey !== 'GIVING') throw new Error('Giving transactions must use the Giving category.');
  if (input.transferToCategoryKey) {
    const [destination] = await tx.select().from(financeCategories).where(eq(financeCategories.key, input.transferToCategoryKey)).limit(1);
    if (!destination || !destination.isActive) throw new Error('The transfer destination category does not exist or is inactive.');
  }
  if (input.goalId) {
    const [goal] = await tx.select().from((await import('@/lib/schema')).financeGoals).where(eq((await import('@/lib/schema')).financeGoals.id, input.goalId)).limit(1);
    if (!goal || !goal.isActive || goal.currency !== input.currency) throw new Error('Choose an active savings goal using the same currency as this transaction.');
  }
  if (input.investmentId) {
    const schema = await import('@/lib/schema');
    const [investment] = await tx.select().from(schema.financeInvestments).where(eq(schema.financeInvestments.id, input.investmentId)).limit(1);
    if (!investment || !investment.isActive || investment.currency !== input.currency) throw new Error('Choose an active investment using the same currency as this transaction.');
  }
}
