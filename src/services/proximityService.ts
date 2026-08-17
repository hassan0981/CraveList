import { RestaurantRow, SavedPlaceRow } from '@/types/database';
import { normalizeBrand } from '@/services/brandService';

export const PROXIMITY_RADIUS_METERS = 500;

/**
 * Calculate distance in meters between two GPS coordinates using Haversine formula.
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculate distance in kilometers between two GPS coordinates.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

/**
 * Format distance in meters or kilometers for display.
 */
export function formatDistance(distanceKm: number): string {
  const meters = distanceKm * 1000;
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function extractBrandName(name: string): string {
  return normalizeBrand(name).brandName;
}

export interface ProximityMatch {
  savedPlaceId: string;
  savedBrandName: string;
  matchedBranch: RestaurantRow;
  distanceKm: number;
  distanceFormatted: string;
  isExactSavedPlace: boolean;
}

export const proximityService = {
  /**
   * Check if user is within 500 meters (0.5 km) of ANY branch belonging to a saved restaurant brand in Lahore.
   * Default user position fallback: 31.5204, 74.3587 (Lahore Center).
   */
  findNearbySavedCravings(
    userLat: number,
    userLng: number,
    savedPlaces: SavedPlaceRow[],
    allRestaurants: RestaurantRow[],
    radiusKm: number = 0.5 // 500 meters default range
  ): ProximityMatch[] {
    if (!savedPlaces || savedPlaces.length === 0) return [];

    const matches: ProximityMatch[] = [];

    // Collect all saved brand identifiers
    const savedBrandIds = new Set<string>();
    const savedBrandDisplayNames = new Map<string, string>();
    const savedRestaurantIds = new Set<string>();

    for (const sp of savedPlaces) {
      if (sp.restaurant) {
        savedRestaurantIds.add(sp.restaurant.id);
        const { brandId, brandName } = normalizeBrand(sp.restaurant.name);
        savedBrandIds.add(brandId);
        savedBrandDisplayNames.set(brandId, brandName);
      }
    }

    // Check all physical branch records in database against user location
    for (const rest of allRestaurants) {
      const restLat = rest.latitude || 31.5204;
      const restLng = rest.longitude || 74.3587;

      const distance = calculateDistanceKm(userLat, userLng, restLat, restLng);

      // Check if within 500 meters radius
      if (distance <= radiusKm) {
        const { brandId, brandName } = normalizeBrand(rest.name);
        const isExactMatch = savedRestaurantIds.has(rest.id);
        const isBrandMatch = savedBrandIds.has(brandId);

        if (isExactMatch || isBrandMatch) {
          const displayBrandName = savedBrandDisplayNames.get(brandId) || brandName;
          const matchedSavedPlace = savedPlaces.find(
            (sp) => sp.restaurant_id === rest.id || normalizeBrand(sp.restaurant?.name || '').brandId === brandId
          );

          matches.push({
            savedPlaceId: matchedSavedPlace?.id || rest.id,
            savedBrandName: displayBrandName,
            matchedBranch: rest,
            distanceKm: distance,
            distanceFormatted: formatDistance(distance),
            isExactSavedPlace: isExactMatch,
          });
        }
      }
    }

    // Sort closest branch first
    return matches.sort((a, b) => a.distanceKm - b.distanceKm);
  },
};
