import LearningWorkspace from '@/components/admin/LearningWorkspace';
export const metadata = { title: 'My Reflections — Admin' };
export const dynamic = 'force-dynamic';
export default function LearningPage() { return <LearningWorkspace view="reflections" />; }
