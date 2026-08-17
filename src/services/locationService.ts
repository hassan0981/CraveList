import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savedPlaceService } from '@/services/savedPlaceService';
import { restaurantService } from '@/services/restaurantService';
import { proximityService, ProximityMatch } from '@/services/proximityService';

export const PROXIMITY_RADIUS_METERS = 500;
const ASYNC_STORAGE_COOLDOWN_KEY = '@cravelist_proximity_cooldowns';
const NOTIFICATION_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown per restaurant

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface LocationPermissionState {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  notificationsGranted: boolean;
  canAskAgain: boolean;
}

// Configure local notification display behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let locationSubscription: Location.LocationSubscription | null = null;

export const locationService = {
  /**
   * Calculate exact distance in meters between two GPS coordinates using Haversine formula.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  /**
   * Reusable distance display formatter.
   * Returns meters (< 1000m) or kilometers (>= 1000m).
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  },

  /**
   * Check and request location permissions with friendly explanation.
   */
  async requestLocationPermissions(): Promise<LocationPermissionState> {
    try {
      const { status: fgStatus, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      const foregroundGranted = fgStatus === 'granted';

      let notificationsGranted = false;
      try {
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        notificationsGranted = notifStatus === 'granted';
      } catch (e) {
        console.warn('[locationService] Notification permission notice:', e);
      }

      let backgroundGranted = false;
      if (foregroundGranted) {
        try {
          const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
          backgroundGranted = bgStatus === 'granted';
        } catch (e) {
          // Background location check notice
        }
      }

      return {
        foregroundGranted,
        backgroundGranted,
        notificationsGranted,
        canAskAgain,
      };
    } catch (err) {
      console.error('[locationService] Error requesting permissions:', err);
      return {
        foregroundGranted: false,
        backgroundGranted: false,
        notificationsGranted: false,
        canAskAgain: true,
      };
    }
  },

  /**
   * Request background location permission if supported.
   */
  async requestBackgroundPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.warn('[locationService] Background location notice:', err);
      return false;
    }
  },

  /**
   * Get current real device GPS location.
   */
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      // 1. Check fast cached position first for instant UI response (0ms)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy,
        };
      }

      // 2. Fallback to fresh position query
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (err) {
      console.warn('[locationService] Could not retrieve current position:', err);
      return null;
    }
  },

  /**
   * Fetch nearby restaurants saved ONLY by the current authenticated user within 500 meters.
   */
  async getNearbySavedPlaces(
    userLat: number,
    userLng: number,
    userId: string
  ): Promise<ProximityMatch[]> {
    if (!userId) return [];

    try {
      const [savedPlaces, allRestaurants] = await Promise.all([
        savedPlaceService.getMySavedPlaces(userId),
        restaurantService.getRestaurants(),
      ]);

      if (!savedPlaces || savedPlaces.length === 0) return [];

      // 500 meters = 0.5 km
      return proximityService.findNearbySavedCravings(userLat, userLng, savedPlaces, allRestaurants, 0.5);
    } catch (err) {
      console.error('[locationService] Error finding nearby saved places:', err);
      return [];
    }
  },

  /**
   * Evaluate proximity and trigger local push notification if not on cooldown.
   */
  async checkProximityAndNotify(
    userLat: number,
    userLng: number,
    userId: string
  ): Promise<ProximityMatch | null> {
    if (!userId) return null;

    try {
      const nearbyMatches = await this.getNearbySavedPlaces(userLat, userLng, userId);
      if (nearbyMatches.length === 0) return null;

      const topMatch = nearbyMatches[0];
      const brandKey = topMatch.savedBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      // Deduplication / Cooldown logic using AsyncStorage by Brand Key
      const cooldownData = await AsyncStorage.getItem(ASYNC_STORAGE_COOLDOWN_KEY);
      const cooldownMap: Record<string, number> = cooldownData ? JSON.parse(cooldownData) : {};

      const lastNotifiedTime = cooldownMap[brandKey] || 0;
      const now = Date.now();

      if (now - lastNotifiedTime < NOTIFICATION_COOLDOWN_MS) {
        // Recently notified for this brand, avoid notification spam
        return topMatch;
      }

      // Record notification timestamp in cooldown map for this brand
      cooldownMap[brandKey] = now;
      await AsyncStorage.setItem(ASYNC_STORAGE_COOLDOWN_KEY, JSON.stringify(cooldownMap));

      // Count nearby branches of the same brand
      const sameBrandCount = nearbyMatches.filter(
        (m) => m.savedBrandName.toLowerCase() === topMatch.savedBrandName.toLowerCase()
      ).length;

      const bodyText =
        sameBrandCount > 1
          ? `Still craving ${topMatch.savedBrandName}? There are ${sameBrandCount} nearby locations (closest: ${topMatch.matchedBranch.name}, ${topMatch.distanceFormatted}).`
          : `Still craving ${topMatch.savedBrandName}? ${topMatch.matchedBranch.name} is just ${topMatch.distanceFormatted} away!`;

      // Trigger local push notification via Expo Notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `You're near ${topMatch.savedBrandName} 🍗`,
          body: bodyText,
          data: {
            restaurantId: topMatch.matchedBranch.id,
            savedPlaceId: topMatch.savedPlaceId,
            brandName: topMatch.savedBrandName,
          },
        },
        trigger: null, // Send immediately
      });

      return topMatch;
    } catch (err) {
      console.error('[locationService] Error during proximity notification check:', err);
      return null;
    }
  },

  /**
   * Start battery-optimized foreground location tracking.
   * Uses 15 second time interval and 50 meter distance threshold to prevent unnecessary battery drain.
   */
  async startLocationTracking(
    userId: string,
    onLocationUpdate: (coords: LocationCoordinates, matches: ProximityMatch[]) => void
  ): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return false;

      if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000, // Update every 15 seconds
          distanceInterval: 50, // Update every 50 meters threshold
        },
        async (location) => {
          const coords: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          };

          const matches = await this.getNearbySavedPlaces(coords.latitude, coords.longitude, userId);
          if (matches.length > 0) {
            await this.checkProximityAndNotify(coords.latitude, coords.longitude, userId);
          }

          onLocationUpdate(coords, matches);
        }
      );

      return true;
    } catch (err) {
      console.error('[locationService] Error starting location tracking:', err);
      return false;
    }
  },

  /**
   * Stop active location tracking.
   */
  stopLocationTracking(): void {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
  },
};
