import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { locationService } from '@/services/locationService';
import { ProximityMatch } from '@/services/proximityService';

export default function ProximityAlertScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<ProximityMatch | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNearbySpot() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const coords = await locationService.getCurrentLocation();
        const lat = coords?.latitude || 31.5204;
        const lng = coords?.longitude || 74.3587;

        const matches = await locationService.getNearbySavedPlaces(lat, lng, user.id);
        if (isMounted && matches.length > 0) {
          setMatch(matches[0]);
        }
      } catch (err) {
        console.error('[ProximityAlertScreen] Error loading nearby spot:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNearbySpot();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const targetRest = match?.matchedBranch;
  const restId = targetRest?.id || 'rest_1';
  const restName = targetRest?.name || 'Saved Craving Spot';
  const restAddress = targetRest?.address || 'Lahore, Pakistan';
  const restImage = targetRest?.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  const distanceText = match?.distanceFormatted || '320m away';
  const personalNote = match?.savedBrandName ? `Craving for brand: ${match.savedBrandName}` : 'Craving from your saved list';

  return (
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => RootNavigation.back()} />

      <View style={[styles.card, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}>
        <View style={[styles.pulseIconHeader, { backgroundColor: colors.badgeBg }]}>
          <Ionicons name="location" size={28} color={colors.primary} />
        </View>

        <CraveText variant="h2" align="center">
          📍 NEARBY CRAVING ALERT
        </CraveText>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <CraveText variant="body" align="center" color={colors.secondaryText}>
              You are only <CraveText variant="bodyBold" color={colors.primary}>{distanceText}</CraveText> from a saved restaurant!
            </CraveText>

            <View style={[styles.restaurantPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={{ uri: restImage }} style={styles.previewImage} />
              <View style={styles.previewTextGroup}>
                <CraveText variant="title">{restName}</CraveText>
                <CraveText variant="caption" color={colors.primary}>
                  📍 {distanceText} • {restAddress}
                </CraveText>
              </View>
            </View>

            <View style={[styles.noteSnippetBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <CraveText variant="caption" color={colors.primary} style={styles.boldText}>
                Why You Saved It:
              </CraveText>
              <CraveText variant="caption" color={colors.primaryText} numberOfLines={2} style={styles.italicText}>
                "{personalNote}"
              </CraveText>
            </View>
          </>
        )}

        <View style={styles.actionColumn}>
          <AppButton
            title="View Place Details"
            onPress={() => RootNavigation.toRestaurantDetails(restId)}
            variant="primary"
            size="large"
            fullWidth
            icon="compass-outline"
          />

          <AppButton
            title="Check In Now"
            onPress={() => RootNavigation.toVisitCheckin(restId)}
            variant="visited"
            size="medium"
            fullWidth
            icon="checkmark-circle-outline"
          />

          <AppButton
            title="Dismiss Alert"
            onPress={() => RootNavigation.back()}
            variant="ghost"
            size="small"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  pulseIconHeader: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  restaurantPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  previewTextGroup: {
    flex: 1,
    gap: 2,
  },
  noteSnippetBox: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  boldText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  actionColumn: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
});
