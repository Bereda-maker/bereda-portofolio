import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Savings & Investments — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceSavingsPage() { return <PersonalFinanceWorkspace section="savings" />; }
