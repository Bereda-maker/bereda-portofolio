import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { aiInsightInput } from '@/lib/finance/validation';
import { summarizeFinance } from '@/lib/finance/summary';
import { aiProvider } from '@/lib/services/providers';

export const runtime = 'nodejs';
const requestTimes: number[] = [];
function withinLimit() { const now=Date.now(); while(requestTimes.length && now-requestTimes[0]>60_000) requestTimes.shift(); if(requestTimes.length>=8)return false;requestTimes.push(now);return true; }

export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  if (!withinLimit()) return NextResponse.json({ error: 'Please wait before requesting another finance insight.' }, { status: 429 });
  const parsed = aiInsightInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid finance question.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const [settingsRows,categories,plans,incomes,runs,allocations,transactions,goals,investments,adjustments] = await Promise.all([
      db.select().from(schema.financeSettings).limit(1), db.select().from(schema.financeCategories), db.select().from(schema.financeAllocationPlans), db.select().from(schema.financeIncome).orderBy(desc(schema.financeIncome.receivedAt)).limit(5000), db.select().from(schema.financeAllocationRuns).limit(5000), db.select().from(schema.financeAllocations).limit(35000), db.select().from(schema.financeTransactions).orderBy(desc(schema.financeTransactions.transactionDate)).limit(10000), db.select().from(schema.financeGoals), db.select().from(schema.financeInvestments), db.select().from(schema.financeBudgetAdjustments),
    ]);
    const settings = settingsRows[0];
    if (!settings?.aiEnabled) return NextResponse.json({ error: 'Enable the AI Financial Assistant in Finance Settings before sending financial data for analysis.' }, { status: 403 });
    const summary = summarizeFinance({ incomes,runs,allocations,transactions,adjustments,goals,investments,categories },parsed.data.currency,parsed.data.month,settings.monthStartDay);
    const includeNotes = settings.includePrivateNotesInAi;
    const selectedTransactions = summary.recentTransactions.filter((row)=>row.transactionDate>=summary.summary.start && row.transactionDate<summary.summary.endExclusive).slice(0,80).map((row)=>({date:row.transactionDate,type:row.transactionType,title:row.title,amountMinor:row.amountMinor,currency:row.currency,category:row.categoryKey,subcategoryId:row.subcategoryId,...(includeNotes?{description:row.description}: {})}));
    const evidence = { period:{month:summary.summary.month,start:summary.summary.start,endExclusive:summary.summary.endExclusive,currency:summary.summary.currency}, totals:summary.summary, categoryBudgets:summary.budgets, sixPeriodTrend:summary.trends, storedTransactions:selectedTransactions, notesIncluded:includeNotes };
    const response = await aiProvider.complete({ system:'You are the Finance section of the owner’s existing personal assistant. Use ONLY the supplied saved financial records; do not invent or infer transactions, income, balances, category rates or motives. When data is missing or too limited, say so. Distinguish direct observations from optional suggestions. Be practical, non-judgmental and educational. Never execute an action, give guaranteed-return projections, or promise investment performance. Money amounts are integer minor units; use the supplied currency. Avoid repeating private notes unless directly relevant.', prompt:`User question: ${parsed.data.question}\n\nFinance records (JSON, owner-authorized for this request): ${JSON.stringify(evidence)}` });
    if (response.status !== 'ok') return NextResponse.json({ error: response.message }, { status: 503 });
    return NextResponse.json({ insight: response.data.text, basedOn: { currency: parsed.data.currency, month: parsed.data.month, transactionCount: selectedTransactions.length, includesPrivateNotes: includeNotes }, disclaimer: 'Educational suggestions from recorded data only; verify the underlying entries. No investment returns are promised.' });
  } catch { return NextResponse.json({ error: 'Could not generate an insight from the recorded finance data.' }, { status: 503 }); }
}
