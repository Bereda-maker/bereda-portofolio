import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { transactionInput } from '@/lib/finance/validation';
import { validateTransactionRelations } from '@/lib/finance/persistence';

export const runtime = 'nodejs';
const snapshot = (row: unknown) => JSON.parse(JSON.stringify(row)) as Record<string, unknown>;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await financeAccess(request, true);
  if (denied) return denied;
  const id = Number(params.id);
  const parsed = transactionInput.safeParse(await requestJson(request));
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return NextResponse.json({ error: parsed.success ? 'Invalid transaction id.' : parsed.error.issues[0]?.message ?? 'Invalid transaction.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const transaction = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(schema.financeTransactions).where(eq(schema.financeTransactions.id, id)).limit(1);
      if (!before || before.deletedAt) throw new Error('Transaction was not found.');
      if (before.sourceIncomeId) throw new Error('Income transactions are edited in the Income view.');
      await validateTransactionRelations(tx, parsed.data);
      if (parsed.data.subcategoryId) {
        const [sub] = await tx.select().from(schema.financeSubcategories).where(eq(schema.financeSubcategories.id, parsed.data.subcategoryId)).limit(1);
        if (!sub || sub.categoryKey !== parsed.data.categoryKey) throw new Error('Choose a subcategory belonging to the selected category.');
      }
      const [updated] = await tx.update(schema.financeTransactions).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.financeTransactions.id, id)).returning();
      await tx.insert(schema.financeTransactionHistory).values({ transactionId: id, action: 'UPDATE', beforeSnapshot: snapshot(before), afterSnapshot: snapshot(updated) });
      return updated;
    });
    return NextResponse.json({ transaction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update transaction.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await financeAccess(request, true);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid transaction id.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const deleted = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(schema.financeTransactions).where(eq(schema.financeTransactions.id, id)).limit(1);
      if (!before || before.deletedAt || before.sourceIncomeId) throw new Error('Transaction was not found or must be edited in the Income view.');
      const [saved] = await tx.update(schema.financeTransactions).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(schema.financeTransactions.id, id)).returning();
      await tx.insert(schema.financeTransactionHistory).values({ transactionId: id, action: 'DELETE', beforeSnapshot: snapshot(before), afterSnapshot: snapshot(saved) });
      return saved;
    });
    return NextResponse.json({ transaction: deleted });
  } catch {
    return NextResponse.json({ error: 'Could not delete the transaction.' }, { status: 400 });
  }
}
