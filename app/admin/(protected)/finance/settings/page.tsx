import PersonalFinanceWorkspace from '@/components/admin/PersonalFinanceWorkspace';
export const metadata = { title: 'Settings — Personal Finance' };
export const dynamic = 'force-dynamic';
export default function FinanceSettingsPage() { return <PersonalFinanceWorkspace section="settings" />; }
