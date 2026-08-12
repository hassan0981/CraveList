import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    async function processCallback() {
      try {
        const url = await Linking.getInitialURL();
        console.log('[AuthCallbackScreen] Initial URL detected:', url);

        if (url) {
          let code: string | null = null;
          let access_token: string | null = null;
          let refresh_token: string | null = null;

          if (url.includes('?')) {
            const query = url.split('?')[1].split('#')[0];
            const params = new URLSearchParams(query);
            code = params.get('code');
            access_token = params.get('access_token');
            refresh_token = params.get('refresh_token');
          }

          if (!code && !access_token && url.includes('#')) {
            const hash = url.split('#')[1];
            const params = new URLSearchParams(hash);
            code = params.get('code');
            access_token = params.get('access_token');
            refresh_token = params.get('refresh_token');
          }

          if (code) {
            console.log('[AuthCallbackScreen] Exchanging code for session...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('[AuthCallbackScreen] Code exchange error:', error);
            } else {
              console.log('[AuthCallbackScreen] ✅ Code exchange successful for:', data.user?.email);
            }
          } else if (access_token && refresh_token) {
            console.log('[AuthCallbackScreen] Setting implicit session...');
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              console.error('[AuthCallbackScreen] Implicit setSession error:', error);
            } else {
              console.log('[AuthCallbackScreen] ✅ Implicit setSession successful for:', data.user?.email);
            }
          }
        }
      } catch (err) {
        console.error('[AuthCallbackScreen] Error processing callback:', err);
      } finally {
        console.log('[AuthCallbackScreen] Redirecting to (main)...');
        router.replace('/(main)' as any);
      }
    }

    processCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <CraveText variant="subtitle" color={colors.primaryText}>
        Authenticating with Google...
      </CraveText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
});
