import { supabase } from '@/lib/supabase';
import { RestaurantRow } from '@/types/database';
import { Restaurant } from '@/constants/mockData';
import { apifyService } from '../../server/services/apifyService';

/**
 * Transform Supabase RestaurantRow database format into frontend Restaurant object.
 */
export function mapRowToRestaurant(row: RestaurantRow, isSaved: boolean = false): Restaurant {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Dining & Restaurant',
    priority: 'normal',
    priceLevel: '$$',
    distance: 'Lahore',
    distanceKm: 1.0,
    address: row.address || 'Lahore, Pakistan',
    image: row.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    saved: isSaved,
    visited: false,
    description: `${row.name} is a top spot in ${row.address || 'Lahore'} offering ${row.category || 'delicious dining'}.`,
    openingStatus: 'Open now',
    latitude: row.latitude || 31.5204,
    longitude: row.longitude || 74.3587,
    tags: [row.category ? row.category.split(' ')[0] : 'Dining', 'Spot'],
  };
}

/**
 * Service for fetching and querying restaurant records from Supabase 'restaurants' table,
 * with server-side Apify Google Maps fallback.
 */
let restaurantCache: RestaurantRow[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

export const restaurantService = {
  /**
   * Fetch all restaurants from Supabase database (with instant in-memory cache).
   */
  async getRestaurants(forceRefresh = false): Promise<RestaurantRow[]> {
    if (!forceRefresh && restaurantCache && Date.now() - lastFetchTime < CACHE_TTL_MS) {
      return restaurantCache;
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[restaurantService] Error fetching restaurants:', error.message);
        return restaurantCache || [];
      }

      restaurantCache = (data as RestaurantRow[]) || [];
      lastFetchTime = Date.now();
      return restaurantCache;
    } catch (err) {
      console.error('[restaurantService] Unexpected error in getRestaurants:', err);
      return restaurantCache || [];
    }
  },

  /**
   * Fetch a single restaurant by ID from Supabase.
   */
  async getRestaurantById(id: string): Promise<RestaurantRow | null> {
    if (!id) return null;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[restaurantService] Error fetching restaurant by ID:', error.message);
        return null;
      }

      return (data as RestaurantRow) || null;
    } catch (err) {
      console.error('[restaurantService] Unexpected error in getRestaurantById:', err);
      return null;
    }
  },

  /**
   * Step 1 & 2: Search local Supabase database first.
   */
  async searchLocalRestaurants(query: string): Promise<RestaurantRow[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.getRestaurants();

    try {
      console.log(`[RestaurantSearch] Searching Supabase for: "${trimmed}"`);

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .or(`name.ilike.%${trimmed}%,category.ilike.%${trimmed}%,address.ilike.%${trimmed}%`)
        .order('name', { ascending: true })
        .limit(50);

      if (error) {
        console.error('[RestaurantSearch] Supabase search error:', error.message);
        return [];
      }

      return (data as RestaurantRow[]) || [];
    } catch (err) {
      console.error('[RestaurantSearch] Error in searchLocalRestaurants:', err);
      return [];
    }
  },

  /**
   * Step 4: Fallback search via server-side Apify service when Supabase returns 0 results.
   */
  async searchRestaurantWithFallback(query: string): Promise<RestaurantRow[]> {
    console.log(`[RestaurantSearch] Calling Apify fallback for: "${query}"`);
    const apifyResult = await apifyService.searchGoogleMaps(query);

    if (apifyResult) {
      console.log(`[RestaurantSearch] Apify result found: "${apifyResult.name}"`);
      console.log(`[RestaurantSearch] Returning result`);
      return [apifyResult as RestaurantRow];
    }

    return [];
  },

  /**
   * Primary Search Flow:
   * 1. Search Supabase first.
   * 2. If matching results found, return them (Apify NOT called).
   * 3. If no result found in Supabase, run Apify fallback, insert new record to Supabase, and return it.
   */
  async searchRestaurants(query: string): Promise<{ records: RestaurantRow[]; fallbackUsed: boolean }> {
    const trimmed = query.trim();
    if (!trimmed) {
      const records = await this.getRestaurants();
      return { records, fallbackUsed: false };
    }

    // Step 2: Search Supabase first
    const localMatches = await this.searchLocalRestaurants(trimmed);

    if (localMatches.length > 0) {
      console.log(`[RestaurantSearch] Local result found: ${localMatches.length} spots`);
      return { records: localMatches, fallbackUsed: false };
    }

    // Step 4: No local results found in Supabase -> Apify Fallback
    console.log('[RestaurantSearch] No local result');
    const fallbackMatches = await this.searchRestaurantWithFallback(trimmed);

    return { records: fallbackMatches, fallbackUsed: true };
  },
};
