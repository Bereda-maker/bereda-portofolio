import { NextRequest, NextResponse } from 'next/server';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { transactionInput } from '@/lib/finance/validation';
import { validateTransactionRelations } from '@/lib/finance/persistence';

export const runtime = 'nodejs';
const snapshot = (row: unknown) => JSON.parse(JSON.stringify(row)) as Record<string, unknown>;

export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true);
  if (denied) return denied;
  const parsed = transactionInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid transaction.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const transaction = await db.transaction(async (tx) => {
      await validateTransactionRelations(tx, parsed.data);
      if (parsed.data.subcategoryId) {
        const [sub] = await tx.select().from(schema.financeSubcategories).where(eq(schema.financeSubcategories.id, parsed.data.subcategoryId)).limit(1);
        if (!sub || sub.categoryKey !== parsed.data.categoryKey) throw new Error('Choose a subcategory belonging to the selected category.');
      }
      const [created] = await tx.insert(schema.financeTransactions).values({ ...parsed.data, updatedAt: new Date() }).returning();
      await tx.insert(schema.financeTransactionHistory).values({ transactionId: created.id, action: 'CREATE', afterSnapshot: snapshot(created) });
      return created;
    });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save the transaction.' }, { status: 400 });
  }
}

import { eq } from 'drizzle-orm';
