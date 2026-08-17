import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

// Ensure web browser auth session completes correctly on web/native
WebBrowser.maybeCompleteAuthSession();

const ONBOARDING_STORAGE_KEY = 'cravelist_onboarding_completed_v1';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null; requiresVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Format raw Supabase authentication errors into clean, user-friendly messages.
 */
function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const msg = typeof error === 'string' ? error : error.message || error.error_description || '';

  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (msg.includes('User already registered') || msg.includes('already exists') || msg.includes('user_already_exists')) {
    return 'An account with this email already exists.';
  }
  if (msg.includes('Password should be at least') || msg.includes('weak_password')) {
    return 'Please use a stronger password (minimum 6 characters).';
  }
  if (msg.includes('Network request failed') || msg.includes('FetchError') || msg.includes('network')) {
    return 'Unable to connect. Please check your internet connection.';
  }
  if (msg.includes('cancelled') || msg.includes('dismissed') || msg.includes('cancel')) {
    return 'Google sign-in was cancelled.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }

  return msg || 'Something went wrong. Please try again.';
}

/**
 * Ensure Supabase profiles table record exists for current authenticated user.
 */
async function ensureProfile(authUser: User) {
  if (!authUser || !authUser.id) return;

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', authUser.id)
      .maybeSingle();

    const name =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'CraveList Explorer';

    if (!existing) {
      await supabase.from('profiles').insert({
        id: authUser.id,
        display_name: name,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        bio: 'Food Explorer on CraveList',
      });
    } else if (!existing.display_name && name) {
      await supabase.from('profiles').update({ display_name: name }).eq('id', authUser.id);
    }
  } catch (err) {
    console.error('[AuthContext] Ensure profile error:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  // Initialize session and onboarding state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Load onboarding state from local storage
        const onboardingValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (mounted && onboardingValue === 'true') {
          setHasCompletedOnboarding(true);
        }

        // Fetch initial Supabase session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (err) {
        console.error('[AuthContext] Error during initialization:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Central Supabase authentication listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        // Pre-warm profile in database
        await ensureProfile(currentSession.user);
      }
      setLoading(false);
    });

    // Deep Link handler for incoming auth URLs (e.g. cravelistfinal://auth/callback)
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url) return;

      console.log('[DeepLink Handler] Incoming deep link detected:', url);

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
        console.log('[DeepLink Handler] Found code parameter, exchanging for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[DeepLink Handler] exchangeCodeForSession error:', error);
        } else if (data.session && mounted) {
          console.log('[DeepLink Handler] ✅ Deep link session set for:', data.user?.email);
          setSession(data.session);
          setUser(data.user);
        }
      } else if (access_token && refresh_token) {
        console.log('[DeepLink Handler] Found access_token, setting session...');
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          console.error('[DeepLink Handler] setSession error:', error);
        } else if (data.session && mounted) {
          console.log('[DeepLink Handler] ✅ Deep link session set for:', data.user?.email);
          setSession(data.session);
          setUser(data.user);
        }
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  /**
   * Mark onboarding as completed in AsyncStorage.
   */
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (err) {
      console.error('[AuthContext] Failed to save onboarding state:', err);
    }
  };

  /**
   * Email + Password Sign In
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  /**
   * Email + Password Registration
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'cravelistfinal',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      // Check if email confirmation is required
      const requiresVerification = !data.session && !!data.user;

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { error: null, requiresVerification };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  /**
   * REAL Google OAuth Sign In using Supabase + Expo WebBrowser / Linking
   */
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'cravelistfinal',
        path: 'auth/callback',
      });

      console.log('[Google Auth] Starting Google OAuth flow...');
      console.log('[Google Auth] Using redirectUrl:', redirectUrl);

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });
        if (error) {
          console.error('[Google Auth Web] Error starting Google OAuth:', error);
          return { error: formatAuthError(error) };
        }
        return { error: null };
      }

      // Native platform OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('[Google Auth Native] Error fetching OAuth URL from Supabase:', error);
        return { error: formatAuthError(error) };
      }
      if (!data?.url) {
        console.error('[Google Auth Native] Supabase returned empty OAuth URL.');
        return { error: 'Failed to initiate Google authentication session.' };
      }

      console.log('[Google Auth Native] Opening in-app WebBrowser with URL:', data.url);

      // Open in-app browser session
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      console.log('[Google Auth Native] WebBrowser session result:', result);

      if (result.type === 'success' && result.url) {
        const returnUrl = result.url;
        console.log('[Google Auth Native] Callback URL returned from browser:', returnUrl);

        let error_description: string | null = null;
        let code: string | null = null;
        let access_token: string | null = null;
        let refresh_token: string | null = null;

        if (returnUrl.includes('?')) {
          const queryString = returnUrl.split('?')[1].split('#')[0];
          const searchParams = new URLSearchParams(queryString);
          error_description = searchParams.get('error_description') || searchParams.get('error');
          code = searchParams.get('code');
          access_token = searchParams.get('access_token');
          refresh_token = searchParams.get('refresh_token');
        }

        if (!error_description && returnUrl.includes('#')) {
          const hashString = returnUrl.split('#')[1];
          const searchParams = new URLSearchParams(hashString);
          error_description = searchParams.get('error_description') || searchParams.get('error');
          code = searchParams.get('code');
          access_token = searchParams.get('access_token');
          refresh_token = searchParams.get('refresh_token');
        }

        if (error_description) {
          console.error('[Google Auth Native] OAuth error returned from Supabase:', error_description);
          return { error: formatAuthError(error_description) };
        }

        if (code) {
          console.log('[Google Auth Native] Exchanging PKCE authorization code for session...');
          const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionErr) {
            console.error('[Google Auth Native] exchangeCodeForSession failed:', sessionErr);
            return { error: formatAuthError(sessionErr) };
          }
          if (sessionData.session) {
            console.log('[Google Auth Native] ✅ Session established for:', sessionData.user?.email);
            setSession(sessionData.session);
            setUser(sessionData.user);
            return { error: null };
          }
        }

        if (access_token && refresh_token) {
          console.log('[Google Auth Native] Setting session from implicit tokens...');
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionErr) {
            console.error('[Google Auth Native] setSession failed:', sessionErr);
            return { error: formatAuthError(sessionErr) };
          }
          if (sessionData.session) {
            console.log('[Google Auth Native] ✅ Session established for:', sessionData.user?.email);
            setSession(sessionData.session);
            setUser(sessionData.user);
            return { error: null };
          }
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[Google Auth Native] User closed/cancelled browser session');
        return { error: 'Google sign-in was cancelled.' };
      }

      return { error: null };
    } catch (err: any) {
      console.error('[Google Auth Native] Unexpected error during sign in:', err);
      return { error: formatAuthError(err) };
    }
  };

  /**
   * Password Reset Request
   */
  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'cravelistfinal',
        path: 'auth/reset-password',
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: formatAuthError(error) };
      }
      setSession(null);
      setUser(null);
      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        hasCompletedOnboarding,
        completeOnboarding,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
