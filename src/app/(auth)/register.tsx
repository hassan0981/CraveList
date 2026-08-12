import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
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
      setErrorMessage('Please enter a password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  /**
   * Handle Supabase Email + Password Registration
   */
  const handleRegister = async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error, requiresVerification } = await signUp(email, password, fullName);

    if (error) {
      setErrorMessage(error);
      setIsSubmitting(false);
      return;
    }

    if (requiresVerification) {
      setSuccessMessage('Account created. Please check your email to verify your account.');
      setIsSubmitting(false);
    }
    // If no verification is required, AuthContext and RootNavigator will auto-navigate to (main)
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity disabled={isSubmitting} onPress={() => RootNavigation.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primaryText} />
        </TouchableOpacity>

        <View style={styles.header}>
          <CraveText variant="h1" color={colors.primary}>
            Create Account
          </CraveText>
          <CraveText variant="body" color={colors.secondaryText}>
            Join CraveList to start saving culinary discoveries and tracing your food journey.
          </CraveText>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View style={[styles.banner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <CraveText variant="caption" color="#991B1B" style={styles.bannerText}>
              {errorMessage}
            </CraveText>
          </View>
        )}

        {/* Success Banner */}
        {successMessage && (
          <View style={[styles.banner, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <CraveText variant="caption" color={colors.primaryText} style={styles.bannerText}>
              {successMessage}
            </CraveText>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <CraveText variant="subtitle">Full Name</CraveText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Alexander Wright"
                placeholderTextColor={colors.mutedText}
                editable={!isSubmitting}
                style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
              />
            </View>
          </View>

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

          <View style={styles.inputGroup}>
            <CraveText variant="subtitle">Password</CraveText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Create a strong password (min 6 chars)"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                editable={!isSubmitting}
                style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
              />
            </View>
          </View>

          <AppButton
            title={isSubmitting ? 'Creating account...' : 'Create Account'}
            onPress={handleRegister}
            variant="primary"
            size="large"
            disabled={isSubmitting}
            fullWidth
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <CraveText variant="body" color={colors.secondaryText}>
            Already have an account?{' '}
          </CraveText>
          <TouchableOpacity disabled={isSubmitting} onPress={() => RootNavigation.toLogin()}>
            <CraveText variant="bodyBold" color={colors.primary}>
              Sign In
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
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    gap: 8,
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    lineHeight: 18,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
});
