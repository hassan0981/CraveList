import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';

export default function AppearanceSettingsScreen() {
  const { mode, colors, setMode } = useTheme();
  const { signOut } = useAuth();

  const [proximityAlerts, setProximityAlerts] = useState(true);
  const [friendNotifs, setFriendNotifs] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Appearance & Settings" onBackPress={() => RootNavigation.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Theme Selector Section */}
        <View style={styles.section}>
          <CraveText variant="subtitle">APP THEME</CraveText>
          <View style={[styles.themeSegmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('dark')}
              style={[
                styles.themeTab,
                mode === 'dark' && { backgroundColor: colors.primary, borderRadius: 10 },
              ]}
            >
              <Ionicons
                name="moon"
                size={18}
                color={mode === 'dark' ? '#FFFFFF' : colors.secondaryText}
              />
              <CraveText
                variant="bodyBold"
                color={mode === 'dark' ? '#FFFFFF' : colors.secondaryText}
              >
                Dark Mode
              </CraveText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('light')}
              style={[
                styles.themeTab,
                mode === 'light' && { backgroundColor: colors.primary, borderRadius: 10 },
              ]}
            >
              <Ionicons
                name="sunny"
                size={18}
                color={mode === 'light' ? '#FFFFFF' : colors.secondaryText}
              />
              <CraveText
                variant="bodyBold"
                color={mode === 'light' ? '#FFFFFF' : colors.secondaryText}
              >
                Light Mode
              </CraveText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <CraveText variant="subtitle">NOTIFICATIONS & ALERTS</CraveText>

          <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <CraveText variant="bodyBold">Proximity Alerts</CraveText>
              <CraveText variant="caption" color={colors.secondaryText}>
                Get notified when you walk or drive near saved cravings.
              </CraveText>
            </View>
            <Switch
              value={proximityAlerts}
              onValueChange={setProximityAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <CraveText variant="bodyBold">Friend Activity</CraveText>
              <CraveText variant="caption" color={colors.secondaryText}>
                Alerts when friends save mutual spots or organize plans.
              </CraveText>
            </View>
            <Switch
              value={friendNotifs}
              onValueChange={setFriendNotifs}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Location Preferences */}
        <View style={styles.section}>
          <CraveText variant="subtitle">PRIVACY & LOCATION</CraveText>

          <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <CraveText variant="bodyBold">Location Services</CraveText>
              <CraveText variant="caption" color={colors.secondaryText}>
                Enable background location for accurate proximity detection.
              </CraveText>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* About CraveList */}
        <View style={styles.section}>
          <CraveText variant="subtitle">ABOUT</CraveText>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <CraveText variant="body">CraveList Mobile</CraveText>
              <CraveText variant="caption" color={colors.primary}>
                v1.0.0
              </CraveText>
            </View>
            <CraveText variant="caption" color={colors.secondaryText}>
              Designed for modern restaurant discovery & memory trail tracking.
            </CraveText>
          </View>
        </View>

        {/* Sign Out Action */}
        <AppButton
          title={isSigningOut ? 'Signing Out...' : 'Sign Out'}
          onPress={handleSignOut}
          variant="outline"
          size="medium"
          disabled={isSigningOut}
          fullWidth
          icon="log-out-outline"
          style={styles.signOutBtn}
        />
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
    gap: 20,
  },
  section: {
    gap: 8,
  },
  themeSegmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  themeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  settingTextGroup: {
    flex: 1,
    marginRight: 12,
    gap: 2,
  },
  aboutCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signOutBtn: {
    marginTop: 12,
  },
});
