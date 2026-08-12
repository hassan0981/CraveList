import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { CraveText } from '@/components/CraveText';
import { IconButton } from '@/components/IconButton';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { friendService } from '@/services/friendService';
import { messageService } from '@/services/messageService';
import { MessageRow, ProfileRow } from '@/types/database';

interface DisplayMessage extends MessageRow {
  isOptimistic?: boolean;
  hasError?: boolean;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const friendId = params.id;
  const [friendProfile, setFriendProfile] = useState<ProfileRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const sendBtnScale = useRef(new Animated.Value(1)).current;

  // Load conversation & friend profile
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      if (!user || !friendId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [prof, convMessages] = await Promise.all([
          friendService.getUserProfile(friendId),
          messageService.getConversation(user.id, friendId),
        ]);

        if (isMounted) {
          setFriendProfile(prof);
          setMessages(convMessages);
          // Mark unread messages as read
          messageService.markConversationAsRead(user.id, friendId);
        }
      } catch (err) {
        console.error('[ChatScreen] Error initializing chat:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
        }
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [user, friendId]);

  // Subscribe to Supabase Realtime for incoming messages
  useEffect(() => {
    if (!user || !friendId) return;

    const channel = messageService.subscribeToConversation(user.id, friendId, (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        const exists = prev.some(
          (m) => m.id === newMsg.id || (m.sender_id === newMsg.sender_id && m.message === newMsg.message && Math.abs(new Date(m.created_at || 0).getTime() - new Date(newMsg.created_at || 0).getTime()) < 3000)
        );

        if (exists) {
          return prev.map((m) =>
            m.sender_id === newMsg.sender_id && m.message === newMsg.message ? newMsg : m
          );
        }

        return [...prev, newMsg];
      });

      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      messageService.unsubscribeFromConversation(channel);
    };
  }, [user, friendId]);

  const animateSendPress = () => {
    Animated.sequence([
      Animated.timing(sendBtnScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(sendBtnScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !user || !friendId || sending) return;

    animateSendPress();

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: DisplayMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: friendId,
      message: trimmed,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    setSending(true);
    const { data: realMsg, error } = await messageService.sendMessage(user.id, friendId, trimmed);
    setSending(false);

    if (error || !realMsg) {
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isOptimistic: false, hasError: true } : m))
      );
    } else {
      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? realMsg : m))
      );
    }
  };

  const friendName = friendProfile?.display_name || params.name || 'Friend';
  const friendAvatar = friendProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconButton icon="arrow-back" onPress={() => RootNavigation.back()} style={styles.backBtn} />
            <Avatar source={friendAvatar} size={40} />
            <View style={styles.headerTitleGroup}>
              <CraveText variant="bodyBold">{friendName}</CraveText>
              <CraveText variant="caption" color={colors.primary}>
                Connected on CraveList
              </CraveText>
            </View>
          </View>

          <IconButton
            icon="person-outline"
            onPress={() => friendId && RootNavigation.toUserProfile(friendId)}
          />
        </View>

        {/* Messages Stream */}
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Loading conversation...
            </CraveText>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedText} />
                <CraveText variant="body" color={colors.secondaryText} align="center">
                  Start the conversation with {friendName.split(' ')[0]}!
                </CraveText>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const formattedTime = new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleWrapper,
                      isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        {
                          backgroundColor: isMe ? colors.primary : colors.surface,
                          borderColor: isMe ? 'transparent' : colors.border,
                          opacity: msg.isOptimistic ? 0.7 : 1,
                        },
                      ]}
                    >
                      <CraveText
                        variant="body"
                        color={isMe ? '#FFFFFF' : colors.primaryText}
                        style={styles.messageText}
                      >
                        {msg.message}
                      </CraveText>
                    </View>

                    <View style={styles.timeRow}>
                      <CraveText variant="caption" color={colors.mutedText} style={styles.timestamp}>
                        {formattedTime}
                      </CraveText>
                      {msg.hasError && (
                        <CraveText variant="caption" color="#EF4444" style={{ fontSize: 10 }}>
                          Failed to send
                        </CraveText>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Message ${friendName.split(' ')[0]}...`}
            placeholderTextColor={colors.mutedText}
            onSubmitEditing={handleSend}
            multiline
            style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
          />
          <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? colors.primary : colors.border },
              ]}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginRight: 2,
  },
  headerTitleGroup: {
    gap: 1,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubbleWrapper: {
    maxWidth: '80%',
    gap: 2,
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirBubbleWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageText: {
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
