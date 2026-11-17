import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Transactions — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceTransactionsPage() { return <PersonalFinanceWorkspace section="transactions" />; }
