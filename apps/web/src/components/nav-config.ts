import { Routes } from '@/consts/Pages';

export interface NavItem {
  href: string;
  label: string;
}

export function getNavItems(legacyRole: 'trainer' | 'client' | undefined): NavItem[] {
  if (legacyRole === 'trainer') {
    return [
      { href: Routes.DASHBOARD, label: 'Clients' },
      { href: Routes.WORKOUTS, label: 'Workouts' },
      { href: Routes.COACH_BOOKINGS, label: 'Bookings' },
    ];
  }

  return [
    { href: Routes.DASHBOARD, label: 'Dashboard' },
    { href: Routes.DISCOVER, label: 'Discover' },
    { href: Routes.BOOKINGS, label: 'My bookings' },
  ];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === Routes.DASHBOARD) {
    return pathname === Routes.DASHBOARD;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
