import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Personal Finance — Admin' };
export const dynamic = 'force-dynamic';
export default function FinanceOverviewPage() { return <PersonalFinanceWorkspace section="overview" />; }
