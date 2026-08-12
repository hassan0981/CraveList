import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { CraveText } from '@/components/CraveText';
import { UserFriend } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';

interface FriendCardProps {
  friend: UserFriend;
  onPress: () => void;
  onChatPress?: () => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, onPress, onChatPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <Avatar source={friend.avatar} size={48} showOnlineStatus />

      <View style={styles.content}>
        <CraveText variant="bodyBold" numberOfLines={1}>
          {friend.name}
        </CraveText>
        <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
          {friend.username} • {friend.lastActive}
        </CraveText>

        <View style={styles.statusRow}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <CraveText variant="caption" color={colors.primary} numberOfLines={1} style={styles.statusText}>
            {friend.statusText}
          </CraveText>
        </View>
      </View>

      {onChatPress && (
        <TouchableOpacity
          onPress={onChatPress}
          style={[styles.chatBtn, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusText: {
    marginLeft: 4,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
