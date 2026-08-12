import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { ThemeContextProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  _experiments: {
    profilesSampleRate: 1.0,
  },
});

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { mode, colors } = useTheme();
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Root level route protection listener
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';

    if (user) {
      // Authenticated user redirected out of auth screens
      if (inAuthGroup) {
        router.replace('/(main)' as any);
      }
    } else {
      // Unauthenticated user trying to access main app
      if (inMainGroup) {
        if (!hasCompletedOnboarding) {
          router.replace('/(auth)/onboarding' as any);
        } else {
          router.replace('/(auth)/login' as any);
        }
      }
    }
  }, [user, loading, hasCompletedOnboarding, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen
          name="restaurant/details"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="restaurant/save-place"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="restaurant/search-results"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="restaurant/proximity-alert"
          options={{ presentation: 'transparentModal', headerShown: false }}
        />
        <Stack.Screen
          name="social/user-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="social/shared-cravings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="social/chat"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="social/notifications"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="social/plans"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="memories/visit-checkin"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="settings/appearance"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeContextProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default Sentry.wrap(RootLayout);
