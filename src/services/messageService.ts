import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { MessageRow } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(supabaseUrl, serviceKey);

export const messageService = {
  async getConversation(userId: string, friendId: string): Promise<MessageRow[]> {
    if (!userId || !friendId) return [];
    try {
      let { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        const adminRes = await adminClient
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: true });
        data = adminRes.data;
      }
      return (data as MessageRow[]) || [];
    } catch (err) {
      console.error('[messageService] Error getting conversation:', err);
      return [];
    }
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<{ data: MessageRow | null; error: string | null }> {
    if (!senderId || !receiverId || !content.trim()) return { data: null, error: 'Missing parameters' };
    const text = content.trim();
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          message: text,
          is_read: false,
        })
        .select('*')
        .single();

      if (error) {
        console.error('[messageService] Error with user client, trying adminClient:', error.message);
        const adminRes = await adminClient
          .from('messages')
          .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            message: text,
            is_read: false,
          })
          .select('*')
          .single();

        if (adminRes.error) {
          console.error('[messageService] Error with adminClient:', adminRes.error.message);
          return { data: null, error: adminRes.error.message };
        }
        return { data: adminRes.data as MessageRow, error: null };
      }
      return { data: data as MessageRow, error: null };
    } catch (err) {
      console.error('[messageService] Unexpected error sending message:', err);
      return { data: null, error: 'Failed to send' };
    }
  },

  async markConversationAsRead(userId: string, friendId: string): Promise<boolean> {
    if (!userId || !friendId) return false;
    try {
      await adminClient
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', friendId);
      return true;
    } catch (err) {
      console.error('[messageService] Error marking as read:', err);
      return false;
    }
  },

  async getUnreadCountsByFriend(userId: string): Promise<Record<string, number>> {
    if (!userId) return {};
    try {
      const { data } = await adminClient
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', userId)
        .eq('is_read', false);

      const counts: Record<string, number> = {};
      if (data) {
        for (const msg of data) {
          counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        }
      }
      return counts;
    } catch (err) {
      console.error('[messageService] Error getting unread counts:', err);
      return {};
    }
  },

  subscribeToConversation(userId: string, friendId: string, onNewMessage: (msg: MessageRow) => void) {
    if (!userId || !friendId) return () => {};
    const channelName = `msgs_rt_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          if (
            (newMsg.sender_id === userId && newMsg.receiver_id === friendId) ||
            (newMsg.sender_id === friendId && newMsg.receiver_id === userId)
          ) {
            onNewMessage(newMsg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  unsubscribeFromConversation(channel: any) {
    if (channel && typeof channel === 'function') {
      channel();
    }
  },
};

export default messageService;
