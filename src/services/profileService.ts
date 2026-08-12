import { supabase } from '@/lib/supabase';
import { ProfileRow } from '@/types/database';

/**
 * Service for managing user profile records in Supabase 'profiles' table.
 */
export const profileService = {
  /**
   * Fetch current authenticated user profile from Supabase.
   * If profile row doesn't exist yet, automatically initializes it.
   */
  async getCurrentProfile(userId: string, defaultData?: Partial<ProfileRow>): Promise<ProfileRow | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[profileService] Error fetching profile:', error.message);
      }

      if (data) {
        return data as ProfileRow;
      }

      // Profile does not exist yet, create initial record
      const initialProfile: ProfileRow = {
        id: userId,
        display_name: defaultData?.display_name || null,
        avatar_url: defaultData?.avatar_url || null,
        bio: defaultData?.bio || 'Food Explorer & CraveList Member',
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(initialProfile)
        .select()
        .single();

      if (createError) {
        console.error('[profileService] Error creating initial profile:', createError.message);
        return initialProfile;
      }

      return newProfile as ProfileRow;
    } catch (err) {
      console.error('[profileService] Unexpected error in getCurrentProfile:', err);
      return null;
    }
  },

  /**
   * Fetch any user profile by user ID.
   */
  async getProfileById(userId: string): Promise<ProfileRow | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[profileService] Error fetching profile by ID:', error.message);
        return null;
      }

      return data as ProfileRow;
    } catch (err) {
      console.error('[profileService] Unexpected error in getProfileById:', err);
      return null;
    }
  },

  /**
   * Update profile information for authenticated user.
   */
  async updateProfile(userId: string, updates: Partial<ProfileRow>): Promise<{ data: ProfileRow | null; error: string | null }> {
    if (!userId) return { data: null, error: 'User is not authenticated.' };

    try {
      const payload = {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.error('[profileService] Error updating profile:', error.message);
        return { data: null, error: 'Unable to update profile. Please try again.' };
      }

      return { data: data as ProfileRow, error: null };
    } catch (err) {
      console.error('[profileService] Unexpected error in updateProfile:', err);
      return { data: null, error: 'Something went wrong while updating profile.' };
    }
  },
};
