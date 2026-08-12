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
        return { name: 'calendar' as const, color: colors.primarySoft };
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
          backgroundColor: notification.read ? colors.cardBackground : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.badgeBg }]}>
        <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <CraveText variant="bodyBold" numberOfLines={1} style={styles.flexOne}>
            {notification.title}
          </CraveText>
          <CraveText variant="caption" color={colors.mutedText}>
            {notification.time}
          </CraveText>
        </View>

        <CraveText variant="body" color={colors.secondaryText} numberOfLines={2}>
          {notification.subtitle}
        </CraveText>
      </View>

      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
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
    position: 'relative',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
