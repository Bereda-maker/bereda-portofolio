import MealsNutritionWorkspace from '@/components/admin/MealsNutritionWorkspace';
export const metadata = { title: 'Foods — Meals & Nutrition' };
export const dynamic = 'force-dynamic';
export default function MealsPage() { return <MealsNutritionWorkspace view="foods" />; }
