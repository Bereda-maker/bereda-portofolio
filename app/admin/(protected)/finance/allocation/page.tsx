import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Allocation — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceAllocationPage() { return <PersonalFinanceWorkspace section="allocation" />; }
