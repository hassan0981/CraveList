import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Entrance micro-animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = (): boolean => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return false;
    }
    return true;
  };

  /**
   * Handle Email + Password Login
   */
  const handleLogin = async () => {
    if (!validateForm() || isSubmitting || isGoogleSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);

    if (error) {
      setErrorMessage(error);
      setIsSubmitting(false);
    }
    // On success, AuthState listener in AuthContext and RootNavigator will automatically transition to (main)
  };

  /**
   * Handle Google OAuth Login
   */
  const handleGoogleLogin = async () => {
    if (isSubmitting || isGoogleSubmitting) return;

    console.log('[LoginScreen] User clicked "Continue with Google"');
    setIsGoogleSubmitting(true);
    setErrorMessage(null);

    const { error } = await signInWithGoogle();

    if (error) {
      console.log('[LoginScreen] Google sign-in failed with error:', error);
      setErrorMessage(error);
      setIsGoogleSubmitting(false);
    } else {
      console.log('[LoginScreen] Google sign-in process completed successfully');
    }
  };

  const isLoading = isSubmitting || isGoogleSubmitting;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.centeredWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* CraveList Brand Hero */}
          <View style={styles.brandHero}>
            <View style={[styles.logoIconBg, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="restaurant" size={32} color={colors.primary} />
            </View>

            <CraveText variant="h1" align="center" color={colors.primary} style={styles.brandTitle}>
              CraveList
            </CraveText>

            <View style={styles.taglineBox}>
              <CraveText variant="h3" align="center" color={colors.primaryText}>
                Your cravings.
              </CraveText>
              <CraveText variant="h3" align="center" color={colors.primary}>
                Your places.
              </CraveText>
              <CraveText variant="h3" align="center" color={colors.secondaryText}>
                Your trail.
              </CraveText>
            </View>
          </View>

          {/* Error Message Banner */}
          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" style={styles.errorIcon} />
              <CraveText variant="caption" color="#991B1B" style={styles.errorText}>
                {errorMessage}
              </CraveText>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <CraveText variant="subtitle">Email Address</CraveText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.secondaryText} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="alexander@example.com"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <CraveText variant="subtitle">Password</CraveText>
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={() => RootNavigation.toForgotPassword()}
                >
                  <CraveText variant="caption" color={colors.primary}>
                    Forgot Password?
                  </CraveText>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.secondaryText} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedText}
                  secureTextEntry
                  editable={!isLoading}
                  style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
                />
              </View>
            </View>

            <AppButton
              title={isSubmitting ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              variant="primary"
              size="large"
              disabled={isLoading}
              fullWidth
              style={styles.submitBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <CraveText variant="caption" color={colors.mutedText} style={styles.dividerText}>
                or
              </CraveText>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Google Sign-in */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isLoading}
              onPress={handleGoogleLogin}
              style={[
                styles.googleBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isLoading && { opacity: 0.6 },
              ]}
            >
              {isGoogleSubmitting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="logo-google" size={18} color={colors.primaryText} />
              )}
              <CraveText variant="bodyBold" color={colors.primaryText}>
                {isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
              </CraveText>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <CraveText variant="body" color={colors.secondaryText}>
            Don't have an account?{' '}
          </CraveText>
          <TouchableOpacity disabled={isLoading} onPress={() => RootNavigation.toRegister()}>
            <CraveText variant="bodyBold" color={colors.primary}>
              Sign Up
            </CraveText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  centeredWrapper: {
    gap: 24,
    marginTop: 16,
  },
  brandHero: {
    alignItems: 'center',
    gap: 8,
  },
  logoIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandTitle: {
    letterSpacing: -0.5,
  },
  taglineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  errorIcon: {
    marginRight: 2,
  },
  errorText: {
    flex: 1,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  submitBtn: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
});
