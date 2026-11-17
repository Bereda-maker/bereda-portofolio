import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Income — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceIncomePage() { return <PersonalFinanceWorkspace section="income" />; }
