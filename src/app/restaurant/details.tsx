import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { IconButton } from '@/components/IconButton';
import { InteractiveMap } from '@/components/InteractiveMap';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { restaurantService, mapRowToRestaurant } from '@/services/restaurantService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { visitService } from '@/services/visitService';
import { locationService } from '@/services/locationService';
import { normalizeBrand } from '@/services/brandService';
import { VisitRow } from '@/types/database';

export default function RestaurantDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [userVisits, setUserVisits] = useState<VisitRow[]>([]);
  const [realDistanceText, setRealDistanceText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      if (!params.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [row, savedStatus, visitsList] = await Promise.all([
          restaurantService.getRestaurantById(params.id),
          user ? savedPlaceService.isPlaceSaved(user.id, params.id) : Promise.resolve(false),
          user ? visitService.getVisitsForRestaurant(user.id, params.id) : Promise.resolve([]),
        ]);

        if (isMounted) {
          if (row) {
            setRestaurant(mapRowToRestaurant(row, savedStatus));
            setIsSaved(savedStatus);
            setUserVisits(visitsList);
          }
        }
      } catch (err) {
        console.error('[RestaurantDetailsScreen] Error loading restaurant:', err);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Fetch location asynchronously without blocking restaurant rendering
      try {
        const coords = await locationService.getCurrentLocation();
        if (isMounted && coords && params.id) {
          const row = await restaurantService.getRestaurantById(params.id);
          if (row && row.latitude && row.longitude) {
            const meters = locationService.calculateDistance(
              coords.latitude,
              coords.longitude,
              row.latitude,
              row.longitude
            );
            setRealDistanceText(locationService.formatDistance(meters));
          }
        }
      } catch (locErr) {
        console.warn('[RestaurantDetailsScreen] Async location fetch failed:', locErr);
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [params.id, user]);

  const toggleSave = async () => {
    if (!user || !restaurant) return;

    if (isSaved) {
      setIsSaved(false);
      await savedPlaceService.unsavePlace(user.id, restaurant.id);
    } else {
      RootNavigation.toSavePlace(restaurant.id);
    }
  };

  const hasVisited = userVisits.length > 0;
  const latestVisit = hasVisited ? userVisits[0] : null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
          <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
            Loading restaurant details...
          </CraveText>
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <CraveText variant="h3">Restaurant Not Found</CraveText>
          <AppButton
            title="Go Back"
            onPress={() => RootNavigation.back()}
            variant="outline"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.imageHeaderWrapper}>
          <Image source={{ uri: restaurant.image }} style={styles.heroImage} />

          <View style={styles.headerOverlayButtons}>
            <IconButton icon="arrow-back" onPress={() => RootNavigation.back()} />
            <IconButton
              icon={isSaved ? 'bookmark' : 'bookmark-outline'}
              color={isSaved ? colors.primary : colors.primaryText}
              onPress={toggleSave}
            />
          </View>
        </View>

        {/* Info Card Body */}
        <View style={styles.bodyContent}>
          <View style={styles.titleRow}>
            <View style={styles.flexOne}>
              <CraveText variant="h1">{restaurant.name}</CraveText>
              <CraveText variant="subtitle" color={colors.secondaryText} style={styles.marginTop}>
                {restaurant.category} • {restaurant.priceLevel}
              </CraveText>
            </View>

            {hasVisited ? (
              <View style={[styles.visitedBadge, { backgroundColor: colors.visitedSoft }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.visited} />
                <CraveText variant="badge" color={colors.visited}>
                  VISITED BEFORE
                </CraveText>
              </View>
            ) : (
              restaurant.priority === 'high' && (
                <View style={[styles.priorityBadge, { backgroundColor: colors.badgeBg }]}>
                  <Ionicons name="flame" size={14} color={colors.primary} />
                  <CraveText variant="badge" color={colors.primary}>
                    HIGH PRIORITY
                  </CraveText>
                </View>
              )
            )}
          </View>

          {/* Quick Location & Opening Metrics */}
          <View style={[styles.metricsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricItem}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <CraveText variant="caption" color={colors.primaryText}>
                📍 {realDistanceText ? `${realDistanceText} • ` : ''}{restaurant.address || restaurant.distance}
              </CraveText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={18} color={colors.visited} />
              <CraveText variant="caption" color={colors.primaryText}>
                {restaurant.openingStatus}
              </CraveText>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.ctaRow}>
            <AppButton
              title={isSaved ? `✓ ${normalizeBrand(restaurant.name).brandName} Saved` : `♡ Save ${normalizeBrand(restaurant.name).brandName}`}
              onPress={() => RootNavigation.toSavePlace(restaurant.id)}
              variant={isSaved ? 'secondary' : 'primary'}
              icon={isSaved ? 'bookmark' : 'bookmark-outline'}
              fullWidth
              style={styles.flexOne}
            />

            <AppButton
              title={hasVisited ? 'Log Another Visit' : 'Check In'}
              onPress={() => RootNavigation.toVisitCheckin(restaurant.id)}
              variant="visited"
              icon="checkmark-circle-outline"
              fullWidth
              style={styles.flexOne}
            />
          </View>

          {/* Personal Visit Memory Card if Visited */}
          {latestVisit && (
            <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.rowItem}>
                <Ionicons name="journal-outline" size={16} color={colors.visited} />
                <CraveText variant="bodyBold" color={colors.visited} style={styles.leftMargin}>
                  Your Visit Memory
                </CraveText>
              </View>
              <CraveText variant="body" color={colors.primaryText} style={styles.italicText}>
                "{latestVisit.note || 'Visited and logged to trail.'}"
              </CraveText>
            </View>
          )}

          {/* Description */}
          <View style={styles.sectionGroup}>
            <CraveText variant="h3">About this spot</CraveText>
            <CraveText variant="body" color={colors.secondaryText} style={styles.lineHeight}>
              {restaurant.description}
            </CraveText>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {restaurant.tags.map((tag) => (
              <View key={tag} style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <CraveText variant="caption" color={colors.secondaryText}>
                  #{tag}
                </CraveText>
              </View>
            ))}
          </View>

          {/* Location Map Preview */}
          <View style={styles.sectionGroup}>
            <CraveText variant="h3">Location</CraveText>
            <CraveText variant="caption" color={colors.secondaryText}>
              {restaurant.address}
            </CraveText>
            <InteractiveMap restaurants={[restaurant]} height={200} showControls={false} />
          </View>
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
    paddingBottom: 32,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  imageHeaderWrapper: {
    position: 'relative',
    height: 280,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlayButtons: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flexOne: {
    flex: 1,
  },
  marginTop: {
    marginTop: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionGroup: {
    gap: 8,
  },
  lineHeight: {
    lineHeight: 22,
  },
  notesCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftMargin: {
    marginLeft: 6,
  },
  italicText: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});
