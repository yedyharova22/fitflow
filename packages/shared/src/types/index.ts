export enum UserRole {
  COACH = 'COACH',
  CLIENT = 'CLIENT',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CANCELED = 'CANCELED',
}

export enum WorkoutInstanceStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
}

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CANCELED = 'BOOKING_CANCELED',
  SCHEDULE_CHANGED = 'SCHEDULE_CHANGED',
  WORKOUT_CANCELED = 'WORKOUT_CANCELED',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserProfile {
  name: string;
  avatarUrl: string | null;
  age: number | null;
  description: string | null;
}

export interface UserProfile extends AuthUserProfile {
  id: string;
  email: string | null;
  role: UserRole;
  legacyRole: 'trainer' | 'client';
  latitude: number | null;
  longitude: number | null;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string | null;
  profile: AuthUserProfile | null;
  /** Legacy trainer-subscriptions UI compatibility */
  legacyRole?: 'trainer' | 'client';
}

export interface DeviceAuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
