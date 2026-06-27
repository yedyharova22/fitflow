export const Routes = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  WORKOUTS: '/dashboard/workouts',
  WORKOUT_NEW: '/dashboard/workouts/new',
  WORKOUT_DETAIL: (id: string) => `/dashboard/workouts/${id}`,
  BOOKINGS: '/bookings',
  COACH_BOOKINGS: '/dashboard/bookings',
  DISCOVER: '/discover',
  DISCOVER_SCAN: '/discover/scan',
  JOIN: (code: string) => `/join/${code}`,
} as const;

export type Route = typeof Routes[keyof typeof Routes];
