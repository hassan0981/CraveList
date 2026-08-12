import { router } from 'expo-router';
import { Routes } from '@/navigation/routes';

/**
 * RootNavigation Helper Service
 * Cleanly handles screen-to-screen navigation across all 20 CraveList destinations.
 */
export const RootNavigation = {
  // Auth Flow
  toOnboarding: () => router.replace(Routes.AUTH.ONBOARDING as any),
  toLogin: () => router.replace(Routes.AUTH.LOGIN as any),
  toRegister: () => router.push(Routes.AUTH.REGISTER as any),
  toForgotPassword: () => router.push(Routes.AUTH.FORGOT_PASSWORD as any),

  // Main Tabs Flow
  toHome: () => router.replace(Routes.MAIN.HOME as any),
  toCravings: () => router.push(Routes.MAIN.CRAVINGS as any),
  toTrail: () => router.push(Routes.MAIN.TRAIL as any),
  toFriends: () => router.push(Routes.MAIN.FRIENDS as any),
  toProfile: () => router.push(Routes.MAIN.PROFILE as any),

  // Restaurant Flow
  toRestaurantDetails: (id: string) =>
    router.push({
      pathname: Routes.RESTAURANT.DETAILS as any,
      params: { id },
    }),

  toSavePlace: (id: string) =>
    router.push({
      pathname: Routes.RESTAURANT.SAVE_PLACE as any,
      params: { id },
    }),

  toSearchResults: (query?: string) =>
    router.push({
      pathname: Routes.RESTAURANT.SEARCH_RESULTS as any,
      params: query ? { query } : {},
    }),

  toProximityAlert: () => router.push(Routes.RESTAURANT.PROXIMITY_ALERT as any),

  // Social Flow
  toUserProfile: (id: string) =>
    router.push({
      pathname: Routes.SOCIAL.USER_PROFILE as any,
      params: { id },
    }),

  toSharedCravings: (friendName: string, friendId?: string) =>
    router.push({
      pathname: Routes.SOCIAL.SHARED_CRAVINGS as any,
      params: friendId ? { friendName, friendId } : { friendName },
    }),

  toChat: (id: string, name: string) =>
    router.push({
      pathname: Routes.SOCIAL.CHAT as any,
      params: { id, name },
    }),

  toNotifications: () => router.push(Routes.SOCIAL.NOTIFICATIONS as any),
  toPlans: () => router.push(Routes.SOCIAL.PLANS as any),

  // Memories / Check-in Flow
  toVisitCheckin: (id?: string) =>
    router.push({
      pathname: Routes.MEMORIES.VISIT_CHECKIN as any,
      params: id ? { id } : {},
    }),

  // Settings Flow
  toAppearance: () => router.push(Routes.SETTINGS.APPEARANCE as any),

  // Utility Actions
  back: () => router.back(),
};
