import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { SavedPlaceRow } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(supabaseUrl, serviceKey);

/**
 * Service for managing user's saved places in Supabase 'saved_places' table.
 */
const savedPlacesCache = new Map<string, { data: SavedPlaceRow[]; timestamp: number }>();
const SAVED_CACHE_TTL_MS = 30 * 1000;

export const savedPlaceService = {
  /**
   * Check if a restaurant is already saved by the user to prevent duplicate records.
   */
  async isPlaceSaved(userId: string, restaurantId: string): Promise<boolean> {
    if (!userId || !restaurantId) return false;

    // Check in-memory cache first if available
    const cached = savedPlacesCache.get(userId);
    if (cached) {
      const match = cached.data.some((sp) => sp.restaurant_id === restaurantId);
      if (match) return true;
    }

    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('id')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error('[savedPlaceService] Error checking saved status:', error.message);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('[savedPlaceService] Unexpected error in isPlaceSaved:', err);
      return false;
    }
  },

  /**
   * Save a restaurant to the authenticated user's CraveList saved places.
   * Includes duplicate check to prevent creating duplicate rows.
   */
  async savePlace(
    userId: string,
    restaurantId: string,
    options?: { category?: string; note?: string }
  ): Promise<{ data: SavedPlaceRow | null; error: string | null; alreadySaved?: boolean }> {
    if (!userId) return { data: null, error: 'User is not authenticated.' };
    if (!restaurantId) return { data: null, error: 'Restaurant ID is required.' };

    try {
      // Invalidate cache for user
      savedPlacesCache.delete(userId);

      // 1. Duplicate check
      const alreadyExists = await this.isPlaceSaved(userId, restaurantId);
      if (alreadyExists) {
        return { data: null, error: null, alreadySaved: true };
      }

      // 2. Insert saved_place record into Supabase
      const payload = {
        user_id: userId,
        restaurant_id: restaurantId,
        category: options?.category || 'General',
        note: options?.note || null,
      };

      const { data, error } = await supabase
        .from('saved_places')
        .insert(payload)
        .select('*, restaurant:restaurants(*)')
        .single();

      if (error) {
        console.error('[savedPlaceService] Insert error:', error.message);
        return { data: null, error: 'Unable to save place. Please try again.' };
      }

      return { data: data as SavedPlaceRow, error: null };
    } catch (err) {
      console.error('[savedPlaceService] Unexpected error in savePlace:', err);
      return { data: null, error: 'Something went wrong while saving place.' };
    }
  },

  /**
   * Remove a saved restaurant from the authenticated user's CraveList.
   */
  async unsavePlace(userId: string, restaurantId: string): Promise<{ success: boolean; error: string | null }> {
    if (!userId || !restaurantId) return { success: false, error: 'Missing parameters.' };

    try {
      // Invalidate cache for user
      savedPlacesCache.delete(userId);

      const { error } = await supabase
        .from('saved_places')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('[savedPlaceService] Delete error:', error.message);
        return { success: false, error: 'Unable to remove saved place.' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[savedPlaceService] Unexpected error in unsavePlace:', err);
      return { success: false, error: 'Something went wrong while unsaving place.' };
    }
  },

  /**
   * Fetch all saved places for the authenticated user along with linked restaurant metadata (with instant in-memory cache).
   */
  async getMySavedPlaces(userId: string, forceRefresh = false): Promise<SavedPlaceRow[]> {
    if (!userId) return [];

    const cached = savedPlacesCache.get(userId);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < SAVED_CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*, restaurant:restaurants(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[savedPlaceService] Error fetching saved places:', error.message);
        return cached?.data || [];
      }

      const result = (data as SavedPlaceRow[]) || [];
      savedPlacesCache.set(userId, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.error('[savedPlaceService] Unexpected error in getMySavedPlaces:', err);
      return cached?.data || [];
    }
  },
};
