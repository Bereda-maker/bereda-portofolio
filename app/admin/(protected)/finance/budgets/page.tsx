import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Budgets — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceBudgetsPage() { return <PersonalFinanceWorkspace section="budgets" />; }
