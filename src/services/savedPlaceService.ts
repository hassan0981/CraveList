import { supabase } from '@/lib/supabase';
import { SavedPlaceRow } from '@/types/database';

/**
 * Service for managing user's saved places in Supabase 'saved_places' table.
 */
export const savedPlaceService = {
  /**
   * Check if a restaurant is already saved by the user to prevent duplicate records.
   */
  async isPlaceSaved(userId: string, restaurantId: string): Promise<boolean> {
    if (!userId || !restaurantId) return false;

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
   * Fetch all saved places for the authenticated user along with linked restaurant metadata.
   */
  async getMySavedPlaces(userId: string): Promise<SavedPlaceRow[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*, restaurant:restaurants(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[savedPlaceService] Fetch error:', error.message);
        return [];
      }

      return (data as SavedPlaceRow[]) || [];
    } catch (err) {
      console.error('[savedPlaceService] Unexpected error in getMySavedPlaces:', err);
      return [];
    }
  },
};
