import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Reports — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceReportsPage() { return <PersonalFinanceWorkspace section="reports" />; }
