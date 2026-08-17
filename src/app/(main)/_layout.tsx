import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';

export default function MainLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCount() {
      if (!user) {
        setUnreadCount(0);
        return;
      }
      const count = await notificationService.getUnreadCount(user.id);
      if (isMounted) setUnreadCount(count);
    }

    loadCount();

    const interval = setInterval(() => {
      if (isMounted) loadCount();
    }, 4000);

    const unsubscribe = user
      ? notificationService.subscribeToNotifications(user.id, () => {
          if (isMounted) loadCount();
        })
      : () => {};

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.activeTab,
        tabBarInactiveTintColor: colors.inactiveTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cravings"
        options={{
          title: 'Cravings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="trail"
        options={{
          title: 'Trail',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'footsteps' : 'footsteps-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            fontSize: 10,
            fontFamily: 'SpaceGrotesk_700Bold',
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
