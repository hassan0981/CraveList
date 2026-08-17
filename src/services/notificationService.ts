import { supabase } from '@/lib/supabase';
import { NotificationRow } from '@/types/database';
import { createClient } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase;

const lastMarkedAllReadTimeMap: Record<string, number> = {};
const notificationListeners: Record<string, Set<() => void>> = {};

function notifyUserListeners(userId: string) {
  if (notificationListeners[userId]) {
    notificationListeners[userId].forEach((cb) => cb());
  }
}

/**
 * Service for managing notification records and real-time social notifications in Supabase 'notifications' table.
 */
export const notificationService = {
  /**
   * Fetch all notifications for authenticated user, ordered by creation timestamp.
   */
  async getMyNotifications(userId: string): Promise<NotificationRow[]> {
    if (!userId) return [];

    try {
      let { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        const adminRes = await adminClient
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        data = adminRes.data;
      }

      const rows = (data as NotificationRow[]) || [];
      const cutoff = lastMarkedAllReadTimeMap[userId];
      if (cutoff) {
        return rows.map((r) => {
          const createdAtTime = new Date(r.created_at || 0).getTime();
          if (createdAtTime <= cutoff) {
            return { ...r, is_read: true };
          }
          return r;
        });
      }

      return rows;
    } catch (err) {
      console.error('[notificationService] Unexpected error in getMyNotifications:', err);
      return [];
    }
  },

  /**
   * Fetch total count of unread items (notifications + pending friend requests) for user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;

    try {
      const cutoff = lastMarkedAllReadTimeMap[userId];

      // 1. Unread rows in notifications table
      let notifQuery = adminClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (cutoff) {
        notifQuery = notifQuery.gt('created_at', new Date(cutoff).toISOString());
      }

      const { count: notifCount } = await notifQuery;

      // 2. Pending incoming friend requests
      let friendReqQuery = adminClient
        .from('friend_requests')
        .select('id', { count: 'exact', head: true })
        .eq('addressee_id', userId)
        .eq('status', 'pending');

      if (cutoff) {
        friendReqQuery = friendReqQuery.gt('created_at', new Date(cutoff).toISOString());
      }

      const { count: friendReqCount } = await friendReqQuery;

      // 3. Pending dining plan invitations
      let planInviteQuery = adminClient
        .from('plan_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('rsvp_status', 'pending');

      if (cutoff) {
        planInviteQuery = planInviteQuery.gt('created_at', new Date(cutoff).toISOString());
      }

      const { count: planInviteCount } = await planInviteQuery;

      // 4. Unread chat messages
      const { count: msgCount } = await adminClient
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      const totalUnread = (notifCount || 0) + (friendReqCount || 0) + (planInviteCount || 0) + (msgCount || 0);
      return totalUnread;
    } catch (err) {
      console.error('[notificationService] Unexpected error in getUnreadCount:', err);
      return 0;
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    if (!notificationId) return false;

    // Synthesized IDs (e.g. freq_... or pinv_...) are managed in local state
    if (notificationId.startsWith('freq_') || notificationId.startsWith('pinv_')) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.warn('[notificationService] Note marking notification as read:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[notificationService] Unexpected note in markNotificationAsRead:', err);
      return false;
    }
  },

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Set cutoff timestamp to ignore existing unread items
    lastMarkedAllReadTimeMap[userId] = Date.now();
    notifyUserListeners(userId);

    try {
      await adminClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      return true;
    } catch (err) {
      console.warn('[notificationService] Note in markAllNotificationsAsRead:', err);
      return true;
    }
  },

  /**
   * Create a new social notification for a target user.
   */
  async createNotification(payload: {
    user_id: string;
    type: 'friend_request' | 'plan_invite' | 'plan_update' | 'proximity' | 'friend_save';
    title: string;
    body?: string | null;
    reference_id?: string | null;
  }): Promise<NotificationRow | null> {
    if (!payload.user_id || !payload.title) return null;

    try {
      const { data, error } = await adminClient
        .from('notifications')
        .insert({
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          body: payload.body || null,
          reference_id: payload.reference_id || null,
          is_read: false,
        })
        .select()
        .maybeSingle();

      // Trigger immediate local push notification ping on phone
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body || 'You have a new social update on CraveList.',
            data: { type: payload.type, reference_id: payload.reference_id },
          },
          trigger: null,
        });
      } catch (pErr) {
        // Notification permission fallback
      }

      if (error) {
        console.warn('[notificationService] Notification insert notice:', error.message);
        return null;
      }

      return data as NotificationRow;
    } catch (err) {
      console.warn('[notificationService] Unexpected notification note:', err);
      return null;
    }
  },

  /**
   * Subscribe to real-time incoming notifications and friend requests for authenticated user via Supabase Realtime.
   */
  subscribeToNotifications(userId: string, onNotification: (notification: NotificationRow) => void) {
    if (!userId) return () => { };

    if (!notificationListeners[userId]) {
      notificationListeners[userId] = new Set();
    }
    const listenerCallback = () => {
      onNotification({
        id: `local_refresh_${Date.now()}`,
        user_id: userId,
        type: 'friend_request',
        title: 'Notifications Updated',
        is_read: true,
        created_at: new Date().toISOString(),
      } as NotificationRow);
    };

    notificationListeners[userId].add(listenerCallback);

    const channelName = `notifications_realtime_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            onNotification(payload.new as NotificationRow);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `addressee_id=eq.${userId}`,
        },
        () => {
          onNotification({
            id: `freq_${Date.now()}`,
            user_id: userId,
            type: 'friend_request',
            title: 'New Friend Request',
            body: 'You have a new friend request on CraveList.',
            is_read: false,
            created_at: new Date().toISOString(),
          } as NotificationRow);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_members',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onNotification({
            id: `pinv_${Date.now()}`,
            user_id: userId,
            type: 'plan_invite',
            title: 'Dining Plan Invitation 🍽️',
            body: 'You have been invited to a group dining plan!',
            is_read: false,
            created_at: new Date().toISOString(),
          } as NotificationRow);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          onNotification({
            id: `msg_${Date.now()}`,
            user_id: userId,
            type: 'friend_request',
            title: 'New Message 💬',
            body: 'You have a new message from a friend.',
            is_read: false,
            created_at: new Date().toISOString(),
          } as NotificationRow);
        }
      )
      .subscribe();

    return () => {
      if (notificationListeners[userId]) {
        notificationListeners[userId].delete(listenerCallback);
      }
      supabase.removeChannel(channel);
    };
  },
};
