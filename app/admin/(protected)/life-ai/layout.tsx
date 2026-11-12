import LifeAISectionNav from '@/components/admin/LifeAISectionNav';

export default function LifeAILayout({ children }: { children: React.ReactNode }) {
  return <div className="life-ai-route">
    <LifeAISectionNav />
    {children}
  </div>;
}
