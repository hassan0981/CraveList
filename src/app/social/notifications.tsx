import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { NotificationCard } from '@/components/NotificationCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { NotificationItem } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { notificationService } from '@/services/notificationService';
import { friendService } from '@/services/friendService';
import { planService } from '@/services/planService';
import { NotificationRow } from '@/types/database';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  // Subtle entry animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const triggerAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(-8);
    scaleAnim.setValue(0.98);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [dbNotifs, friendRequests, myPlans] = await Promise.all([
          notificationService.getMyNotifications(user.id),
          friendService.getFriendRequests(user.id),
          planService.getMyPlans(user.id),
        ]);

        if (isMounted) {
          const combined: NotificationRow[] = [...dbNotifs];
          const existingRefIds = new Set(dbNotifs.map((n: NotificationRow) => n.reference_id).filter(Boolean));

          // Synthesize pending friend request notifications
          for (const req of friendRequests) {
            if (!existingRefIds.has(req.requester_id)) {
              combined.push({
                id: `freq_${req.id}`,
                user_id: user.id,
                type: 'friend_request',
                title: 'New Friend Request',
                body: `${req.requester_profile?.display_name || 'A CraveList member'} sent you a friend request.`,
                reference_id: req.requester_id,
                is_read: false,
                created_at: req.created_at || new Date().toISOString(),
              });
            }
          }

          // Synthesize pending plan invitation notifications
          for (const plan of myPlans) {
            const memberRecord = (plan.members || []).find((m: any) => m.user_id === user.id);
            if (memberRecord && memberRecord.rsvp_status === 'pending' && !existingRefIds.has(plan.id)) {
              combined.push({
                id: `pinv_${plan.id}`,
                user_id: user.id,
                type: 'plan_invite',
                title: 'Dining Plan Invitation',
                body: `Invited you to "${plan.title}" at ${plan.restaurant?.name || 'Lahore Spot'}.`,
                reference_id: plan.id,
                is_read: false,
                created_at: plan.created_at || new Date().toISOString(),
              });
            }
          }

          // Sort by creation date DESC
          combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

          setNotifications(combined);
          triggerAnimation();
        }
      } catch (err) {
        console.error('[NotificationsScreen] Error loading notifications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNotifications();

    // Realtime notifications subscription
    const unsubscribeNotif = user
      ? notificationService.subscribeToNotifications(user.id, (newNotif) => {
          if (isMounted) {
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            triggerAnimation();
          }
        })
      : () => {};

    const unsubscribePlans = user
      ? planService.subscribeToPlanUpdates(user.id, () => {
          if (isMounted) loadNotifications();
        })
      : () => {};

    return () => {
      isMounted = false;
      unsubscribeNotif();
      unsubscribePlans();
    };
  }, [user]);

  const handleNotificationPress = async (notif: NotificationRow) => {
    // Mark as read in state and Supabase
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    await notificationService.markNotificationAsRead(notif.id);

    // Navigate to target feature
    if (notif.type === 'friend_request' && notif.reference_id) {
      RootNavigation.toUserProfile(notif.reference_id);
    } else if (notif.type === 'plan_invite' || notif.type === 'plan_update') {
      RootNavigation.toPlans();
    } else if (notif.type === 'proximity') {
      RootNavigation.toProximityAlert();
    } else if (notif.reference_id) {
      RootNavigation.toUserProfile(notif.reference_id);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await notificationService.markAllNotificationsAsRead(user.id);
  };

  // Convert NotificationRow database items to NotificationItem card format
  const formattedNotifications: NotificationItem[] = notifications.map((n) => {
    const timeAgo = n.created_at
      ? new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'Just now';

    return {
      id: n.id,
      title: n.title,
      subtitle: n.body || 'Social update from CraveList',
      time: timeAgo,
      read: !!n.is_read,
      type: n.type,
      targetId: n.reference_id || undefined,
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Notifications"
        onBackPress={() => RootNavigation.back()}
        rightAction={
          notifications.some((n) => !n.is_read) ? (
            <TouchableOpacity onPress={markAllRead}>
              <CraveText variant="caption" color={colors.primary}>
                Mark all read
              </CraveText>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
          <CraveText variant="caption" color={colors.secondaryText} style={styles.loadingText}>
            Loading your notifications...
          </CraveText>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {formattedNotifications.length > 0 ? (
              formattedNotifications.map((notifItem, idx) => {
                const originalRow = notifications[idx];
                return (
                  <NotificationCard
                    key={notifItem.id}
                    notification={notifItem}
                    onPress={() => originalRow && handleNotificationPress(originalRow)}
                  />
                );
              })
            ) : (
              <EmptyState
                icon="notifications-outline"
                title="You're all caught up"
                description="No new notifications. We'll notify you when friends invite you to plans or send friend requests."
              />
            )}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
  },
});
