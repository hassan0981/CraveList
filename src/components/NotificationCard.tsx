import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { NotificationItem } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';

interface NotificationCardProps {
  notification: NotificationItem;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  const { colors } = useTheme();

  const getIconInfo = () => {
    switch (notification.type) {
      case 'proximity':
        return { name: 'location' as const, color: colors.primary };
      case 'friend_save':
        return { name: 'bookmark' as const, color: colors.visited };
      case 'plan_invite':
      case 'plan_update':
        return { name: 'calendar' as const, color: colors.primarySoft };
      case 'friend_request':
        return { name: 'person-add' as const, color: colors.primary };
      default:
        return { name: 'notifications' as const, color: colors.primary };
    }
  };

  const iconInfo = getIconInfo();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: notification.read ? colors.surface : colors.elevatedSurface,
          borderColor: notification.read ? colors.border : colors.primary,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: notification.read ? colors.badgeBg : colors.primary + '20' }]}>
        <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <CraveText variant="bodyBold" numberOfLines={1} style={styles.flexOne} color={colors.primaryText}>
            {notification.title}
          </CraveText>
          <CraveText variant="caption" color={colors.mutedText}>
            {notification.time}
          </CraveText>
        </View>

        <CraveText variant="body" color={colors.secondaryText} numberOfLines={2} style={styles.subtitle}>
          {notification.subtitle}
        </CraveText>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.mutedText} style={styles.chevron} />
      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    position: 'relative',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  subtitle: {
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexOne: {
    flex: 1,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 14,
    right: 12,
  },
});
