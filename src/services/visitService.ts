import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { VisitRow } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase;

/**
 * Service for managing user check-ins and visits in Supabase 'visits' table.
 */
export const visitService = {
  /**
   * Create a new visit record for the authenticated user.
   */
  async createVisit(
    userId: string,
    restaurantId: string,
    options?: {
      note?: string;
      photoUrl?: string;
      visitedAt?: string;
    }
  ): Promise<{ data: VisitRow | null; error: string | null }> {
    if (!userId) return { data: null, error: 'User is not authenticated.' };
    if (!restaurantId) return { data: null, error: 'Restaurant ID is required.' };

    try {
      const payload = {
        user_id: userId,
        restaurant_id: restaurantId,
        note: options?.note || null,
        photo_url: options?.photoUrl || null,
        visited_at: options?.visitedAt || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('visits')
        .insert(payload)
        .select('*, restaurant:restaurants(*)')
        .single();

      if (error) {
        console.error('[visitService] Error creating visit:', error.message);
        return { data: null, error: 'Unable to save your visit. Please try again.' };
      }

      // Automatically remove place from saved_places table (My Cravings) once marked visited!
      try {
        await supabase
          .from('saved_places')
          .delete()
          .eq('user_id', userId)
          .eq('restaurant_id', restaurantId);
      } catch (unsaveErr) {
        console.warn('[visitService] Note unsaving place on visit:', unsaveErr);
      }

      return { data: data as VisitRow, error: null };
    } catch (err) {
      console.error('[visitService] Unexpected error in createVisit:', err);
      return { data: null, error: 'Something went wrong while saving visit.' };
    }
  },

  /**
   * Fetch all visits for the authenticated user sorted chronologically (newest first).
   */
  async getMyVisits(userId: string): Promise<VisitRow[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*, restaurant:restaurants(*)')
        .eq('user_id', userId)
        .order('visited_at', { ascending: false });

      if (error) {
        console.error('[visitService] Error fetching my visits:', error.message);
        return [];
      }

      return (data as VisitRow[]) || [];
    } catch (err) {
      console.error('[visitService] Unexpected error in getMyVisits:', err);
      return [];
    }
  },

  /**
   * Fetch a single visit by ID for the authenticated user.
   */
  async getVisitById(visitId: string, userId: string): Promise<VisitRow | null> {
    if (!visitId || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*, restaurant:restaurants(*)')
        .eq('id', visitId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[visitService] Error fetching visit by ID:', error.message);
        return null;
      }

      return (data as VisitRow) || null;
    } catch (err) {
      console.error('[visitService] Unexpected error in getVisitById:', err);
      return null;
    }
  },

  /**
   * Check visits recorded by the user for a specific restaurant.
   */
  async getVisitsForRestaurant(userId: string, restaurantId: string): Promise<VisitRow[]> {
    if (!userId || !restaurantId) return [];

    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*, restaurant:restaurants(*)')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .order('visited_at', { ascending: false });

      if (error) {
        console.error('[visitService] Error fetching restaurant visits:', error.message);
        return [];
      }

      return (data as VisitRow[]) || [];
    } catch (err) {
      console.error('[visitService] Unexpected error in getVisitsForRestaurant:', err);
      return [];
    }
  },

  /**
   * Get total visit count for the authenticated user.
   */
  async getVisitCount(userId: string): Promise<number> {
    if (!userId) return 0;

    try {
      let { count, error } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count === null || count === 0) {
        const adminRes = await adminClient
          .from('visits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        count = adminRes.count;
      }

      return count || 0;
    } catch (err) {
      console.error('[visitService] Unexpected error in getVisitCount:', err);
      return 0;
    }
  },

  /**
   * Update an existing visit memory/note.
   */
  async updateVisit(
    visitId: string,
    userId: string,
    updates: Partial<VisitRow>
  ): Promise<{ data: VisitRow | null; error: string | null }> {
    if (!visitId || !userId) return { data: null, error: 'Missing parameters.' };

    try {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', visitId)
        .eq('user_id', userId)
        .select('*, restaurant:restaurants(*)')
        .single();

      if (error) {
        console.error('[visitService] Error updating visit:', error.message);
        return { data: null, error: 'Unable to update visit.' };
      }

      return { data: data as VisitRow, error: null };
    } catch (err) {
      console.error('[visitService] Unexpected error in updateVisit:', err);
      return { data: null, error: 'Something went wrong while updating visit.' };
    }
  },

  /**
   * Delete a visit record.
   */
  async deleteVisit(visitId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    if (!visitId || !userId) return { success: false, error: 'Missing parameters.' };

    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId)
        .eq('user_id', userId);

      if (error) {
        console.error('[visitService] Error deleting visit:', error.message);
        return { success: false, error: 'Unable to delete visit.' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[visitService] Unexpected error in deleteVisit:', err);
      return { success: false, error: 'Something went wrong while deleting visit.' };
    }
  },
};
