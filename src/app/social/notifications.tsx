import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { NotificationCard } from '@/components/NotificationCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { mockNotifications, NotificationItem } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { RootNavigation } from '@/navigation';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const handleNotificationPress = (notif: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    if (notif.type === 'proximity') {
      RootNavigation.toProximityAlert();
    } else if (notif.type === 'friend_save') {
      RootNavigation.toUserProfile(notif.targetId || 'friend_1');
    } else if (notif.type === 'plan_invite') {
      RootNavigation.toPlans();
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Notifications"
        onBackPress={() => RootNavigation.back()}
        rightAction={
          <TouchableOpacity onPress={markAllRead}>
            <CraveText variant="caption" color={colors.primary}>
              Mark all read
            </CraveText>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onPress={() => handleNotificationPress(notif)}
            />
          ))
        ) : (
          <EmptyState
            icon="notifications-outline"
            title="You're all caught up"
            description="No new notifications. We'll notify you when you are near saved cravings or when friends invite you to dinner."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
});
