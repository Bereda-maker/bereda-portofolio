import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { incomeInput } from '@/lib/finance/validation';
import { createAllocationRevision, recordIncomeHistory, syncIncomeTransaction } from '@/lib/finance/persistence';

export const runtime = 'nodejs';
const updateInput = incomeInput.partial().extend({ changeNote: z.string().trim().max(500).nullable().optional() }).strict();

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await financeAccess(request, true);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid income id.' }, { status: 400 });
  const parsed = updateInput.safeParse(await requestJson(request));
  if (!parsed.success || Object.keys(parsed.data ?? {}).filter((key) => key !== 'changeNote').length === 0) return NextResponse.json({ error: parsed.success ? 'No income changes were supplied.' : parsed.error.issues[0]?.message ?? 'Invalid income update.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const income = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM finance_income WHERE id = ${id} FOR UPDATE`);
      const [before] = await tx.select().from(schema.financeIncome).where(eq(schema.financeIncome.id, id)).limit(1);
      if (!before) throw new Error('Income record not found.');
      const changes = parsed.data;
      const financialEdit = ['amountMinor','currency','receivedAt'].some((key) => key in changes && changes[key as keyof typeof changes] !== before[key as keyof typeof before]);
      if (before.status === 'RECEIVED' && changes.currency && changes.currency !== before.currency) throw new Error('Received income currency cannot be changed in place. Cancel it with a reason and create a corrected income record so both currencies remain auditable.');
      const nextStatus = changes.status ?? before.status;
      const leavingReceived = before.status === 'RECEIVED' && nextStatus !== 'RECEIVED';
      if ((financialEdit || leavingReceived) && !changes.changeNote?.trim()) throw new Error('Add a short change note when changing or cancelling received income.');
      const { changeNote, ...fields } = changes;
      const [updated] = await tx.update(schema.financeIncome).set({ ...fields, updatedAt: new Date() }).where(eq(schema.financeIncome.id, id)).returning();
      let saved = updated;
      const needsRevision = updated.status === 'RECEIVED' && (before.status !== 'RECEIVED' || financialEdit);
      if (needsRevision) {
        const revision = await createAllocationRevision(tx, updated, before.status === 'RECEIVED' ? (changeNote ?? 'Received income corrected') : 'Income received');
        if (!revision) throw new Error('Could not create an allocation revision.');
        saved = revision.income;
      }
      await syncIncomeTransaction(tx, saved);
      await recordIncomeHistory(tx, id, before.status !== saved.status ? 'STATUS_CHANGE' : 'UPDATE', before as unknown as Record<string, unknown>, saved as unknown as Record<string, unknown>, changeNote ?? null);
      return saved;
    });
    return NextResponse.json({ income });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update income.' }, { status: 400 });
  }
}
