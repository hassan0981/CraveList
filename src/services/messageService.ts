import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { MessageRow } from '@/types/database';

/**
 * Service for real-time messaging between CraveList friends using Supabase database & Realtime subscriptions.
 */
export const messageService = {
  /**
   * Fetch all past messages in a conversation between two friends sorted chronologically (oldest top, newest bottom).
   */
  async getConversation(currentUserId: string, friendId: string): Promise<MessageRow[]> {
    if (!currentUserId || !friendId) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[messageService] Error fetching conversation:', error.message);
        return [];
      }

      return (data as MessageRow[]) || [];
    } catch (err) {
      console.error('[messageService] Unexpected error in getConversation:', err);
      return [];
    }
  },

  /**
   * Send a new chat message to a friend in Supabase messages table.
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string
  ): Promise<{ data: MessageRow | null; error: string | null }> {
    const trimmed = text.trim();
    if (!senderId || !receiverId) return { data: null, error: 'Missing user parameters.' };
    if (!trimmed) return { data: null, error: 'Message cannot be empty.' };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          message: trimmed,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[messageService] Send message error:', error.message);
        return { data: null, error: 'Unable to send message.' };
      }

      return { data: data as MessageRow, error: null };
    } catch (err) {
      console.error('[messageService] Unexpected error in sendMessage:', err);
      return { data: null, error: 'Something went wrong while sending message.' };
    }
  },

  /**
   * Subscribe to real-time INSERT events on messages table scoped strictly to the active conversation participants.
   */
  subscribeToConversation(
    currentUserId: string,
    friendId: string,
    onNewMessage: (msg: MessageRow) => void
  ): RealtimeChannel {
    const channelName = `chat_${[currentUserId, friendId].sort().join('_')}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;

          if (!newMsg || !newMsg.sender_id || !newMsg.receiver_id) return;

          // Verify message belongs to this active conversation
          const belongsToConv =
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === friendId) ||
            (newMsg.sender_id === friendId && newMsg.receiver_id === currentUserId);

          if (belongsToConv) {
            onNewMessage(newMsg);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[messageService] Realtime subscribed to channel ${channelName}`);
        }
      });

    return channel;
  },

  /**
   * Unsubscribe from a Realtime conversation channel.
   */
  unsubscribeFromConversation(channel: RealtimeChannel | null) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  /**
   * Mark all unread incoming messages in conversation as read.
   */
  async markConversationAsRead(currentUserId: string, friendId: string): Promise<void> {
    if (!currentUserId || !friendId) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
    } catch (err) {
      console.error('[messageService] Error marking conversation read:', err);
    }
  },
};
