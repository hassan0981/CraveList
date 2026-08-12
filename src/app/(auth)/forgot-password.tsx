import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await resetPassword(trimmedEmail);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Reset Password" onBackPress={() => RootNavigation.back()} />

      <View style={styles.content}>
        {!submitted ? (
          <>
            <CraveText variant="h2" style={styles.title}>
              Trouble logging in?
            </CraveText>
            <CraveText variant="body" color={colors.secondaryText} style={styles.description}>
              Enter the email address associated with your CraveList account and we'll send you a password reset link.
            </CraveText>

            {errorMessage && (
              <View style={[styles.banner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <CraveText variant="caption" color="#991B1B" style={styles.bannerText}>
                  {errorMessage}
                </CraveText>
              </View>
            )}

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
                  editable={!isSubmitting}
                  style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
                />
              </View>
            </View>

            <AppButton
              title={isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
              onPress={handleReset}
              variant="primary"
              size="large"
              disabled={isSubmitting}
              fullWidth
              style={styles.actionBtn}
            />
          </>
        ) : (
          <View style={styles.successState}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
            </View>
            <CraveText variant="h2" align="center" style={styles.title}>
              Reset Link Sent
            </CraveText>
            <CraveText variant="body" align="center" color={colors.secondaryText} style={styles.description}>
              Password reset instructions have been sent to{' '}
              <CraveText variant="bodyBold" color={colors.primaryText}>
                {email}
              </CraveText>
              . Please check your inbox.
            </CraveText>

            <AppButton
              title="Back to Sign In"
              onPress={() => RootNavigation.toLogin()}
              variant="primary"
              size="large"
              fullWidth
              style={styles.actionBtn}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    lineHeight: 22,
    marginBottom: 24,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 20,
  },
  bannerText: {
    flex: 1,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 24,
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
  actionBtn: {
    marginTop: 8,
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
