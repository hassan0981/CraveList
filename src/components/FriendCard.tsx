import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { IconButton } from '@/components/IconButton';
import { ProfileRow } from '@/types/database';
import { useTheme } from '@/context/ThemeContext';

interface FriendCardProps {
  friend: ProfileRow;
  unreadCount?: number;
  onPress?: () => void;
  onChatPress?: () => void;
}

export function FriendCard({
  friend,
  unreadCount = 0,
  onPress,
  onChatPress,
}: FriendCardProps) {
  const { colors } = useTheme();

  const displayName = friend.display_name || 'Foodie Friend';
  const avatarUrl =
    friend.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF385C&color=fff`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: unreadCount > 0 ? colors.primary : colors.border,
          borderWidth: unreadCount > 0 ? 1.5 : 1,
        },
      ]}
    >
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <CraveText variant="bodyBold" numberOfLines={1}>
            {displayName}
          </CraveText>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <CraveText variant="caption" color="#FFFFFF" style={{ fontSize: 10, fontWeight: '700' }}>
                💬 {unreadCount} New
              </CraveText>
            </View>
          )}
        </View>
        <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
          {friend.bio || 'CraveList Explorer'}
        </CraveText>
      </View>

      <View style={styles.actions}>
        <IconButton
          icon="chatbubble-ellipses-outline"
          onPress={() => {
            if (onChatPress) onChatPress();
            else if (onPress) onPress();
          }}
          color={unreadCount > 0 ? colors.primary : colors.primaryText}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
