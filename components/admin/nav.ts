import { BookOpen, Briefcase, CalendarDays, FileText, FolderKanban, GraduationCap, LayoutDashboard, Mail, ScrollText, Settings, Video, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: 'unread'; keywords?: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, keywords: 'home overview stats' }] },
  {
    label: 'Content',
    items: [
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban, keywords: 'portfolio work case studies' },
      { href: '/admin/books', label: 'Books', icon: BookOpen, keywords: 'publishing products' },
      { href: '/admin/videos', label: 'Videos', icon: Video, keywords: 'media publishing' },
      { href: '/admin/content', label: 'Content', icon: FileText, keywords: 'articles writing drafts' },
    ],
  },
  {
    label: 'People & scheduling',
    items: [
      { href: '/admin/messages', label: 'Messages', icon: Mail, badge: 'unread', keywords: 'inbox contact email' },
      { href: '/admin/appointments', label: 'Appointments', icon: CalendarDays, keywords: 'calendar bookings availability' },
      { href: '/admin/mentorship', label: 'Mentorship', icon: GraduationCap, keywords: 'students sessions' },
      { href: '/admin/opportunities', label: 'Opportunities', icon: Briefcase, keywords: 'jobs companies applications' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings, keywords: 'integrations environment config' },
      { href: '/admin/audit', label: 'Audit log', icon: ScrollText, keywords: 'activity history' },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
