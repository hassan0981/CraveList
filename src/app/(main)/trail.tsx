import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { visitService } from '@/services/visitService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { VisitRow, SavedPlaceRow } from '@/types/database';

export default function TrailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrailData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [myVisits, mySaved] = await Promise.all([
          visitService.getMyVisits(user.id),
          savedPlaceService.getMySavedPlaces(user.id),
        ]);

        if (isMounted) {
          setVisits(myVisits);
          setSavedPlaces(mySaved);
        }
      } catch (err) {
        console.error('[TrailScreen] Error loading trail data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTrailData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Combine visited places and saved places into a unified chronological trail
  const visitedRestaurantIds = new Set(visits.map((v) => v.restaurant_id));

  // Build trail items list
  const trailItems = [
    ...visits.map((v) => ({
      type: 'visited' as const,
      id: v.id,
      restaurantId: v.restaurant_id,
      restaurantName: v.restaurant?.name || 'Restaurant Spot',
      category: v.restaurant?.category || 'Dining',
      address: v.restaurant?.address || 'Lahore',
      image: v.photo_url || v.restaurant?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      date: new Date(v.visited_at || v.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      note: v.note,
    })),
    ...savedPlaces
      .filter((sp) => !visitedRestaurantIds.has(sp.restaurant_id))
      .map((sp) => ({
        type: 'saved' as const,
        id: sp.id,
        restaurantId: sp.restaurant_id,
        restaurantName: sp.restaurant?.name || 'Restaurant Spot',
        category: sp.restaurant?.category || 'Dining',
        address: sp.restaurant?.address || 'Lahore',
        image: sp.restaurant?.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        date: new Date(sp.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        note: sp.note,
      })),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <CraveText variant="h1">Craving Trail</CraveText>
            <CraveText variant="caption" color={colors.secondaryText}>
              YOUR DISCOVERY, VISIT & MEMORY JOURNEY
            </CraveText>
          </View>
        </View>

        {/* Trail Explanation Banner */}
        <View style={[styles.bannerCard, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
          <CraveText variant="bodyBold" color={colors.primary}>
            🗺 Your Personal Food Journey
          </CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            Trace spots you discovered, saved, visited, and turned into memories over time.
          </CraveText>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Loading your Trail...
            </CraveText>
          </View>
        ) : trailItems.length > 0 ? (
          <View style={styles.timelineContainer}>
            {/* Vertical Timeline Line */}
            <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />

            {/* Timeline Nodes */}
            {trailItems.map((item) => {
              const isVisited = item.type === 'visited';

              return (
                <View key={item.id} style={styles.timelineItem}>
                  {/* Timeline Dot */}
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: isVisited ? colors.visited : colors.primary,
                        borderColor: colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isVisited ? 'checkmark' : 'bookmark'}
                      size={12}
                      color="#FFFFFF"
                    />
                  </View>

                  {/* Trail Card */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => RootNavigation.toRestaurantDetails(item.restaurantId)}
                    style={[
                      styles.trailCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.trailCardHeader}>
                      <View style={styles.flexOne}>
                        <View style={styles.rowItem}>
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: isVisited ? colors.visitedSoft : colors.badgeBg },
                            ]}
                          >
                            <CraveText
                              variant="badge"
                              color={isVisited ? colors.visited : colors.primary}
                            >
                              {isVisited ? 'VISITED' : 'SAVED CRAVING'}
                            </CraveText>
                          </View>
                          <CraveText variant="caption" color={colors.mutedText}>
                            {item.date}
                          </CraveText>
                        </View>

                        <CraveText variant="h3" style={styles.restTitle}>
                          {item.restaurantName}
                        </CraveText>
                        <CraveText variant="caption" color={colors.secondaryText}>
                          {item.category} • 📍 {item.address}
                        </CraveText>
                      </View>

                      <Image source={{ uri: item.image }} style={styles.thumbImage} />
                    </View>

                    {/* Attached Memory Note Snippet if Note exists */}
                    {item.note && (
                      <View
                        style={[
                          styles.memorySnippet,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <CraveText variant="body" color={colors.primaryText} numberOfLines={2} style={styles.italicText}>
                          "{item.note}"
                        </CraveText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="map-outline"
            title="Your Trail is waiting."
            description="Save a place and check in when you visit it to create your personal craving timeline."
            actionTitle="Explore Places"
            onActionPress={() => RootNavigation.toSearchResults()}
          />
        )}
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  loadingWrapper: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 24,
    gap: 20,
    marginTop: 8,
  },
  verticalLine: {
    position: 'absolute',
    left: 8,
    top: 12,
    bottom: 12,
    width: 2,
  },
  timelineItem: {
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -24,
    top: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  trailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  trailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexOne: {
    flex: 1,
    marginRight: 10,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  restTitle: {
    marginVertical: 2,
  },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  memorySnippet: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  italicText: {
    fontStyle: 'italic',
  },
});
