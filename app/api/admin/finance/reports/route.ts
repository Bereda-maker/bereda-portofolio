import { NextRequest, NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { financeAccess, financeDatabase, normalizedCurrency } from '@/lib/finance/api';
import { currentFinancialMonth, monthRange } from '@/lib/finance/money';
import { summarizeFinanceRange } from '@/lib/finance/report';

export const runtime = 'nodejs';
const csvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
const minorSum = (rows: Record<string, any>[]) => rows.reduce((sum, row) => sum + BigInt(row.amountMinor ?? '0'), BigInt(0)).toString();

export async function GET(request: NextRequest) {
  const denied = await financeAccess();
  if (denied) return denied;
  try {
    const { db, schema } = await financeDatabase();
    const [settingRows, categories, subcategories, incomes, runs, allocations, transactions, adjustments] = await Promise.all([
      db.select().from(schema.financeSettings).limit(1),
      db.select().from(schema.financeCategories),
      db.select().from(schema.financeSubcategories),
      db.select().from(schema.financeIncome),
      db.select().from(schema.financeAllocationRuns),
      db.select().from(schema.financeAllocations),
      db.select().from(schema.financeTransactions).orderBy(asc(schema.financeTransactions.transactionDate)),
      db.select().from(schema.financeBudgetAdjustments),
    ]);
    const settings = settingRows[0] ?? { primaryCurrency: 'ETB', monthStartDay: 1, allowCsvExport: true };
    const format = request.nextUrl.searchParams.get('format') ?? 'json';
    if (!['json','csv'].includes(format)) return NextResponse.json({ error: 'Choose JSON or CSV report format.' }, { status: 400 });
    if (format === 'csv' && !settings.allowCsvExport) return NextResponse.json({ error: 'CSV export is disabled in Finance Settings.' }, { status: 403 });
    let currency: string;
    try { currency = normalizedCurrency(request.nextUrl.searchParams.get('currency'), settings.primaryCurrency); } catch { return NextResponse.json({ error: 'Choose a supported ISO 4217 currency code.' }, { status: 400 }); }
    const period = request.nextUrl.searchParams.get('period') ?? 'monthly';
    let start: string;
    let endExclusive: string;
    let label: string;
    if (period === 'monthly') {
      const month = request.nextUrl.searchParams.get('month') ?? currentFinancialMonth(new Date(), settings.monthStartDay);
      ({ start, endExclusive } = monthRange(month, settings.monthStartDay));
      label = month;
    } else if (period === 'quarterly') {
      const quarter = request.nextUrl.searchParams.get('quarter') ?? `${new Date().getUTCFullYear()}-Q${Math.ceil((new Date().getUTCMonth()+1)/3)}`;
      const match = quarter.match(/^(\d{4})-Q([1-4])$/);
      if (!match) return NextResponse.json({ error: 'Choose a quarter such as 2026-Q4.' }, { status: 400 });
      const year = Number(match[1]);
      if (year < 1900 || year > 9997) return NextResponse.json({ error: 'Choose a report year between 1900 and 9997.' }, { status: 400 });
      const month = (Number(match[2])-1)*3;
      start = new Date(Date.UTC(year,month,settings.monthStartDay)).toISOString().slice(0,10);
      endExclusive = new Date(Date.UTC(year,month+3,settings.monthStartDay)).toISOString().slice(0,10);
      label = quarter;
    } else if (period === 'annual') {
      const year = request.nextUrl.searchParams.get('year') ?? String(new Date().getUTCFullYear());
      if (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 9997) return NextResponse.json({ error: 'Choose a report year between 1900 and 9997.' }, { status: 400 });
      start = `${year}-01-01`;
      endExclusive = `${Number(year)+1}-01-01`;
      label = year;
    } else return NextResponse.json({ error: 'Choose monthly, quarterly or annual reporting.' }, { status: 400 });

    const report = summarizeFinanceRange({ incomes, runs, allocations, transactions: transactions.filter((row) => !row.deletedAt), adjustments, categories }, currency, start, endExclusive);
    if (format === 'json') return NextResponse.json({ ...report, period, label }, { headers: { 'Cache-Control': 'private, no-store' } });
    const inPeriodIncomes = incomes.filter((row) => row.currency === currency && row.status === 'RECEIVED' && row.receivedAt >= start && row.receivedAt < endExclusive);
    const inPeriodTransactions = transactions.filter((row) => row.currency === currency && !row.deletedAt && row.transactionDate >= start && row.transactionDate < endExclusive && row.transactionType !== 'INCOME');
    const subcategoryById = new Map(subcategories.map((row) => [row.id, row.name]));
    const rows: unknown[][] = [
      ['Personal Finance Report',label,currency],[],['Period start',start],['Period end (exclusive)',endExclusive],
      ['Received income (minor units)',report.totals.incomeMinor],['Allocated (minor units)',report.totals.allocatedMinor],['Expenses (minor units)',report.totals.expensesMinor],['Giving (minor units)',report.totals.givingMinor],['Available cash flow (minor units)',report.totals.availableCashFlowMinor],[],
      ['Category','Name','Allocated minor units','Spent minor units','Remaining minor units','Utilized basis points','Budget status'],
      ...report.categories.map((row) => [row.categoryKey,row.name,row.allocatedMinor,row.spentMinor,row.remainingMinor,row.utilizedBp,row.overBudget?'OVER BUDGET':'Within budget']),[],
      ['Date','Type','Title','Amount minor units','Currency','Category','Subcategory','Payment method','Description'],
    ];
    for (const row of inPeriodIncomes) rows.push([row.receivedAt,'INCOME',row.title,row.amountMinor,row.currency,'','',row.paymentMethod,row.description]);
    for (const row of inPeriodTransactions) rows.push([row.transactionDate,row.transactionType,row.title,row.amountMinor,row.currency,row.categoryKey,row.subcategoryId?subcategoryById.get(row.subcategoryId):'',row.paymentMethod,row.description]);
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="finance-${period}-${label}.csv"`, 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not build a report from the stored finance records.' }, { status: 503 });
  }
}
