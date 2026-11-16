import LearningWorkspace from '@/components/admin/LearningWorkspace';
export const metadata = { title: 'Learning Calendar — Admin' };
export const dynamic = 'force-dynamic';
export default function LearningPage() { return <LearningWorkspace view="calendar" />; }
