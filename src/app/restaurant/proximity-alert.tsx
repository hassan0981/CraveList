import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { mockRestaurants } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { RootNavigation } from '@/navigation';

export default function ProximityAlertScreen() {
  const { colors } = useTheme();

  const restaurant = mockRestaurants[0]; // Osteria Del Corso (250m away)

  return (
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => RootNavigation.back()} />

      <View style={[styles.card, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}>
        <View style={[styles.pulseIconHeader, { backgroundColor: colors.badgeBg }]}>
          <Ionicons name="location" size={28} color={colors.primary} />
        </View>

        <CraveText variant="h2" align="center">
          📍 YOU'RE NEAR A CRAVING
        </CraveText>

        <CraveText variant="body" align="center" color={colors.secondaryText}>
          You are only <CraveText variant="bodyBold" color={colors.primary}>{restaurant.distance}</CraveText> away from a spot you saved {restaurant.savedDate ? `on ${restaurant.savedDate}` : 'recently'}!
        </CraveText>

        <View style={[styles.restaurantPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: restaurant.image }} style={styles.previewImage} />
          <View style={styles.previewTextGroup}>
            <CraveText variant="title">{restaurant.name}</CraveText>
            <CraveText variant="caption" color={colors.secondaryText}>
              {restaurant.category}
            </CraveText>
            <CraveText variant="caption" color={colors.primary}>
              📍 250m away • {restaurant.address}
            </CraveText>
          </View>
        </View>

        {restaurant.personalNote && (
          <View style={[styles.noteSnippetBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CraveText variant="caption" color={colors.primary} style={styles.boldText}>
              Why You Saved It:
            </CraveText>
            <CraveText variant="caption" color={colors.primaryText} numberOfLines={2} style={styles.italicText}>
              "{restaurant.personalNote}"
            </CraveText>
          </View>
        )}

        <View style={styles.actionColumn}>
          <AppButton
            title="View Place Details"
            onPress={() => RootNavigation.toRestaurantDetails(restaurant.id)}
            variant="primary"
            size="large"
            fullWidth
            icon="compass-outline"
          />

          <AppButton
            title="Check In Now"
            onPress={() => RootNavigation.toVisitCheckin(restaurant.id)}
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
