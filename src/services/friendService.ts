import { supabase } from '@/lib/supabase';
import { FriendRequestRow, FriendshipRow, ProfileRow, RestaurantRow } from '@/types/database';

export type FriendshipStatus =
  | 'self'
  | 'friends'
  | 'request_sent'
  | 'request_received'
  | 'not_connected';

/**
 * Service for managing user connections, friend requests, friendships, and shared cravings in Supabase.
 */
export const friendService = {
  /**
   * Search users by display name in Supabase profiles table.
   */
  async searchUsers(query: string, currentUserId: string): Promise<ProfileRow[]> {
    const trimmed = query.trim();
    if (!trimmed || !currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .or(`display_name.ilike.%${trimmed}%`)
        .limit(20);

      if (error) {
        console.error('[friendService] Search error:', error.message);
        return [];
      }

      return (data as ProfileRow[]) || [];
    } catch (err) {
      console.error('[friendService] Unexpected error in searchUsers:', err);
      return [];
    }
  },

  /**
   * Get any user profile by user ID.
   */
  async getUserProfile(userId: string): Promise<ProfileRow | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[friendService] Error fetching user profile:', error.message);
        return null;
      }

      return (data as ProfileRow) || null;
    } catch (err) {
      console.error('[friendService] Unexpected error in getUserProfile:', err);
      return null;
    }
  },

  /**
   * Fetch all accepted friends for the current user (checking both friendships table and accepted friend_requests).
   */
  async getMyFriends(currentUserId: string): Promise<ProfileRow[]> {
    if (!currentUserId) return [];

    try {
      // 1. Query friendships table
      const { data: fData } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', currentUserId);

      // 2. Query accepted friend_requests table
      const { data: acceptedReqs } = await supabase
        .from('friend_requests')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

      const friendIdSet = new Set<string>();

      if (fData) {
        fData.forEach((f) => friendIdSet.add(f.friend_id));
      }

      if (acceptedReqs) {
        acceptedReqs.forEach((r) => {
          if (r.requester_id === currentUserId) friendIdSet.add(r.addressee_id);
          else if (r.addressee_id === currentUserId) friendIdSet.add(r.requester_id);
        });
      }

      // Remove self if present
      friendIdSet.delete(currentUserId);

      if (friendIdSet.size === 0) return [];

      const friendIds = Array.from(friendIdSet);
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (pErr) {
        console.error('[friendService] Error fetching friend profiles:', pErr.message);
        return [];
      }

      return (profiles as ProfileRow[]) || [];
    } catch (err) {
      console.error('[friendService] Unexpected error in getMyFriends:', err);
      return [];
    }
  },

  /**
   * Fetch incoming pending friend requests for current user.
   */
  async getFriendRequests(currentUserId: string): Promise<FriendRequestRow[]> {
    if (!currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('addressee_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[friendService] Error fetching friend requests:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      const requesterIds = data.map((r) => r.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', requesterIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p as ProfileRow]));

      return data.map((r) => ({
        ...r,
        requester_profile: profileMap.get(r.requester_id),
      })) as FriendRequestRow[];
    } catch (err) {
      console.error('[friendService] Unexpected error in getFriendRequests:', err);
      return [];
    }
  },

  /**
   * Check relationship status between current user and target user.
   */
  async getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<{ status: FriendshipStatus; requestId?: string }> {
    if (!currentUserId || !targetUserId) return { status: 'not_connected' };
    if (currentUserId === targetUserId) return { status: 'self' };

    try {
      // 1. Check if accepted friendship exists in friend_requests
      const { data: acceptedReq } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)
        .maybeSingle();

      if (acceptedReq) {
        return { status: 'friends', requestId: acceptedReq.id };
      }

      // 2. Check friendships table
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('friend_id', targetUserId)
        .maybeSingle();

      if (friendship) {
        return { status: 'friends', requestId: friendship.id };
      }

      // 3. Check pending request sent by current user
      const { data: sentReq } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('requester_id', currentUserId)
        .eq('addressee_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (sentReq) {
        return { status: 'request_sent', requestId: sentReq.id };
      }

      // 4. Check pending request received from target user
      const { data: receivedReq } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('requester_id', targetUserId)
        .eq('addressee_id', currentUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (receivedReq) {
        return { status: 'request_received', requestId: receivedReq.id };
      }

      return { status: 'not_connected' };
    } catch (err) {
      console.error('[friendService] Error checking friendship status:', err);
      return { status: 'not_connected' };
    }
  },

  /**
   * Send a friend request to target user.
   */
  async sendFriendRequest(currentUserId: string, targetUserId: string): Promise<{ success: boolean; error: string | null }> {
    if (!currentUserId || !targetUserId) return { success: false, error: 'Invalid parameters.' };
    if (currentUserId === targetUserId) return { success: false, error: 'You cannot add yourself as a friend.' };

    try {
      const { status, requestId } = await this.getFriendshipStatus(currentUserId, targetUserId);

      if (status === 'friends') {
        return { success: false, error: 'You are already friends with this user.' };
      }
      if (status === 'request_sent') {
        return { success: true, error: null };
      }
      if (status === 'request_received' && requestId) {
        return this.acceptFriendRequest(requestId, currentUserId);
      }

      const { error } = await supabase.from('friend_requests').insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: 'pending',
      });

      if (error) {
        console.error('[friendService] Send request error:', error.message);
        return { success: false, error: 'Unable to send friend request.' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[friendService] Unexpected error in sendFriendRequest:', err);
      return { success: false, error: 'Something went wrong while sending friend request.' };
    }
  },

  /**
   * Accept an incoming friend request.
   */
  async acceptFriendRequest(requestId: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
    if (!requestId || !currentUserId) return { success: false, error: 'Invalid parameters.' };

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('[friendService] Accept request error:', error.message);
        return { success: false, error: 'Unable to accept friend request.' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[friendService] Unexpected error in acceptFriendRequest:', err);
      return { success: false, error: 'Something went wrong while accepting friend request.' };
    }
  },

  /**
   * Reject / decline an incoming friend request.
   */
  async rejectFriendRequest(requestId: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
    if (!requestId || !currentUserId) return { success: false, error: 'Invalid parameters.' };

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('[friendService] Reject error:', error.message);
        return { success: false, error: 'Unable to decline request.' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[friendService] Unexpected error in rejectFriendRequest:', err);
      return { success: false, error: 'Something went wrong while declining request.' };
    }
  },

  /**
   * Remove an existing friendship.
   */
  async removeFriend(currentUserId: string, friendUserId: string): Promise<{ success: boolean; error: string | null }> {
    if (!currentUserId || !friendUserId) return { success: false, error: 'Invalid parameters.' };

    try {
      // 1. Delete matching accepted friend_requests
      await supabase
        .from('friend_requests')
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},addressee_id.eq.${currentUserId})`);

      // 2. Delete matching friendships rows if any exist
      await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${currentUserId})`);

      return { success: true, error: null };
    } catch (err) {
      console.error('[friendService] Unexpected error in removeFriend:', err);
      return { success: false, error: 'Something went wrong while removing friend.' };
    }
  },

  /**
   * Compute restaurants saved by BOTH current user and friend (Shared Cravings).
   * Privacy rule: NO private notes are exposed. Only restaurant metadata is returned.
   */
  async getSharedCravings(currentUserId: string, friendUserId: string): Promise<RestaurantRow[]> {
    if (!currentUserId || !friendUserId) return [];

    try {
      // 1. Get saved place restaurant IDs for current user
      const { data: mySaved } = await supabase
        .from('saved_places')
        .select('restaurant_id')
        .eq('user_id', currentUserId);

      // 2. Get saved place restaurant IDs for friend user
      const { data: friendSaved } = await supabase
        .from('saved_places')
        .select('restaurant_id')
        .eq('user_id', friendUserId);

      if (!mySaved || !friendSaved || mySaved.length === 0 || friendSaved.length === 0) return [];

      const myRestSet = new Set(mySaved.map((s) => s.restaurant_id));
      const sharedRestIds = friendSaved
        .map((s) => s.restaurant_id)
        .filter((id) => myRestSet.has(id));

      if (sharedRestIds.length === 0) return [];

      // 3. Fetch shared restaurant records from Supabase
      const { data: restaurants, error: rErr } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', sharedRestIds);

      if (rErr) {
        console.error('[friendService] Error fetching shared restaurants:', rErr.message);
        return [];
      }

      return (restaurants as RestaurantRow[]) || [];
    } catch (err) {
      console.error('[friendService] Unexpected error in getSharedCravings:', err);
      return [];
    }
  },
};
