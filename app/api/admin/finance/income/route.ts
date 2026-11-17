import { NextRequest, NextResponse } from 'next/server';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { incomeInput } from '@/lib/finance/validation';
import { createAllocationRevision, recordIncomeHistory, syncIncomeTransaction } from '@/lib/finance/persistence';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true);
  if (denied) return denied;
  const parsed = incomeInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid income record.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const income = await db.transaction(async (tx) => {
      const [created] = await tx.insert(schema.financeIncome).values({ ...parsed.data, allocationRevision: null, updatedAt: new Date() }).returning();
      let saved = created;
      if (created.status === 'RECEIVED') {
        const revision = await createAllocationRevision(tx, created, 'Income received');
        if (!revision) throw new Error('Could not create the income allocation.');
        saved = revision.income;
        await syncIncomeTransaction(tx, saved);
      }
      await recordIncomeHistory(tx, saved.id, 'CREATE', null, saved as unknown as Record<string, unknown>);
      return saved;
    });
    return NextResponse.json({ income }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save income and allocation atomically. Check the values and finance migration.' }, { status: 400 });
  }
}
