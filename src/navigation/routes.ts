/**
 * CraveList Navigation Route Definitions
 * Centralized registry of all 20 screen destination paths.
 */

export const Routes = {
  AUTH: {
    ONBOARDING: '/(auth)/onboarding',
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
  },
  MAIN: {
    HOME: '/(main)',
    CRAVINGS: '/(main)/cravings',
    TRAIL: '/(main)/trail',
    FRIENDS: '/(main)/friends',
    PROFILE: '/(main)/profile',
  },
  RESTAURANT: {
    DETAILS: '/restaurant/details',
    SAVE_PLACE: '/restaurant/save-place',
    SEARCH_RESULTS: '/restaurant/search-results',
    PROXIMITY_ALERT: '/restaurant/proximity-alert',
  },
  SOCIAL: {
    USER_PROFILE: '/social/user-profile',
    SHARED_CRAVINGS: '/social/shared-cravings',
    CHAT: '/social/chat',
    NOTIFICATIONS: '/social/notifications',
    PLANS: '/social/plans',
  },
  MEMORIES: {
    VISIT_CHECKIN: '/memories/visit-checkin',
  },
  SETTINGS: {
    APPEARANCE: '/settings/appearance',
  },
} as const;

export type AppRoute =
  | typeof Routes.AUTH[keyof typeof Routes.AUTH]
  | typeof Routes.MAIN[keyof typeof Routes.MAIN]
  | typeof Routes.RESTAURANT[keyof typeof Routes.RESTAURANT]
  | typeof Routes.SOCIAL[keyof typeof Routes.SOCIAL]
  | typeof Routes.MEMORIES[keyof typeof Routes.MEMORIES]
  | typeof Routes.SETTINGS[keyof typeof Routes.SETTINGS];
