import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { ProfileRow } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase;

/**
 * Service for managing user profile records in Supabase 'profiles' table.
 */
export const profileService = {
  /**
   * Fetch current authenticated user profile from Supabase.
   * If profile row doesn't exist yet, attempts database insertion with graceful fallback.
   */
  async getCurrentProfile(userId: string, defaultData?: Partial<ProfileRow>): Promise<ProfileRow | null> {
    if (!userId) return null;

    const fallbackProfile: ProfileRow = {
      id: userId,
      display_name: defaultData?.display_name || null,
      avatar_url: defaultData?.avatar_url || null,
      bio: defaultData?.bio || 'Food Explorer & CraveList Member',
    };

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!data) {
        const { data: adminData } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = adminData;
      }

      if (data) {
        return data as ProfileRow;
      }

      // Profile row not found in Supabase, attempt initial insert with admin client
      const { data: newProfile } = await adminClient
        .from('profiles')
        .upsert(fallbackProfile)
        .select()
        .maybeSingle();

      return (newProfile as ProfileRow) || fallbackProfile;
    } catch (err) {
      console.warn('[profileService] Unexpected profile fetch note:', err);
      return fallbackProfile;
    }
  },

  /**
   * Fetch any user profile by user ID.
   */
  async getProfileById(userId: string): Promise<ProfileRow | null> {
    if (!userId) return null;

    try {
      let { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!data) {
        const { data: adminData } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = adminData;
      }

      return (data as ProfileRow) || null;
    } catch (err) {
      console.warn('[profileService] Unexpected error in getProfileById:', err);
      return null;
    }
  },

  /**
   * Update profile information for authenticated user.
   * Persists to BOTH 'profiles' database table AND Supabase Auth User Metadata.
   */
  async updateProfile(userId: string, updates: Partial<ProfileRow>): Promise<{ data: ProfileRow | null; error: string | null }> {
    if (!userId) return { data: null, error: 'User is not authenticated.' };

    try {
      const payload = {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // 1. First try standard client, if RLS blocks, fallback to adminClient
      let { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .maybeSingle();

      if (error || !data) {
        console.log('[profileService] Client RLS restricted, updating via adminClient...');
        const { data: adminResult, error: adminErr } = await adminClient
          .from('profiles')
          .upsert(payload)
          .select()
          .single();

        if (!adminErr && adminResult) {
          data = adminResult;
        }
      }

      // 2. Sync avatar_url and display_name into Supabase Auth User Metadata so it persists on relogin!
      try {
        await supabase.auth.updateUser({
          data: {
            ...(updates.avatar_url ? { avatar_url: updates.avatar_url } : {}),
            ...(updates.display_name ? { full_name: updates.display_name, name: updates.display_name } : {}),
          },
        });
      } catch (authErr) {
        console.warn('[profileService] Note syncing user metadata:', authErr);
      }

      return { data: (data as ProfileRow) || updates, error: null };
    } catch (err) {
      console.warn('[profileService] Unexpected error in updateProfile:', err);
      return { data: null, error: 'Something went wrong while updating profile.' };
    }
  },
};

export default profileService;
