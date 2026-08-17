import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { IconButton } from '@/components/IconButton';
import { RestaurantCard } from '@/components/RestaurantCard';
import { SearchBar } from '@/components/SearchBar';
import { Restaurant } from '@/constants/mockData';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RootNavigation } from '@/navigation';
import { friendService } from '@/services/friendService';
import { LocationCoordinates, locationService } from '@/services/locationService';
import { notificationService } from '@/services/notificationService';
import { ProximityMatch, proximityService } from '@/services/proximityService';
import { mapRowToRestaurant, restaurantService } from '@/services/restaurantService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { visitService } from '@/services/visitService';
import { ProfileRow, RestaurantRow, SavedPlaceRow } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { profileService } from '@/services/profileService';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const [allRestaurants, setAllRestaurants] = useState<RestaurantRow[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
  const [myFriends, setMyFriends] = useState<ProfileRow[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileRow | null>(null);
  const [proximityMatches, setProximityMatches] = useState<ProximityMatch[]>([]);
  const [userCoords, setUserCoords] = useState<LocationCoordinates | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);

  // Fade entrance animation for Home
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch real Supabase database records & initialize location tracking
  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const [restsData, mySaved, visitsData, friendsList, unreadNum, profileData] = await Promise.all([
          restaurantService.getRestaurants(),
          user ? savedPlaceService.getMySavedPlaces(user.id) : Promise.resolve([]),
          user ? visitService.getMyVisits(user.id) : Promise.resolve([]),
          user ? friendService.getMyFriends(user.id) : Promise.resolve([]),
          user ? notificationService.getUnreadCount(user.id) : Promise.resolve(0),
          user ? profileService.getCurrentProfile(user.id) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        const visitedIds = new Set(visitsData.map((v) => v.restaurant_id));
        const unvisitedSaved = mySaved.filter((sp) => !visitedIds.has(sp.restaurant_id));

        setAllRestaurants(restsData);
        setSavedPlaces(unvisitedSaved);
        setMyFriends(friendsList);
        setUnreadCount(unreadNum);
        if (profileData) setMyProfile(profileData);
        setLoading(false); // Unblock screen instantly!

        // Location & GPS proximity checks in background without blocking UI
        locationService.requestLocationPermissions().then(async (perms) => {
          if (!isMounted) return;
          if (perms.foregroundGranted) {
            const coords = await locationService.getCurrentLocation();
            if (coords && isMounted) {
              setUserCoords(coords);
              const matches = proximityService.findNearbySavedCravings(
                coords.latitude,
                coords.longitude,
                unvisitedSaved,
                restsData,
                0.5
              );
              setProximityMatches(matches);
            }

            if (user && isMounted) {
              locationService.startLocationTracking(user.id, (newCoords, newMatches) => {
                if (isMounted) {
                  setUserCoords(newCoords);
                  setProximityMatches(newMatches);
                }
              });
            }
          } else if (isMounted) {
            setPermissionDenied(true);
            const fallbackMatches = proximityService.findNearbySavedCravings(31.5204, 74.3587, unvisitedSaved, restsData, 0.5);
            setProximityMatches(fallbackMatches);
          }
        });
      } catch (err) {
        console.error('[HomeScreen] Error loading data:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();

    // Subscribe to realtime notification updates
    const unsubscribeNotif = user
      ? notificationService.subscribeToNotifications(user.id, () => {
        if (isMounted) {
          notificationService.getUnreadCount(user.id).then((count) => {
            if (isMounted) setUnreadCount(count);
          });
        }
      })
      : () => { };

    return () => {
      isMounted = false;
      locationService.stopLocationTracking();
      unsubscribeNotif();
    };
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        Promise.all([
          savedPlaceService.getMySavedPlaces(user.id),
          visitService.getMyVisits(user.id),
          notificationService.getUnreadCount(user.id),
          profileService.getCurrentProfile(user.id),
        ]).then(([mySaved, visitsData, count, profileData]) => {
          const visitedIds = new Set(visitsData.map((v) => v.restaurant_id));
          const unvisitedSaved = mySaved.filter((sp) => !visitedIds.has(sp.restaurant_id));
          setSavedPlaces(unvisitedSaved);
          setUnreadCount(count);
          if (profileData) setMyProfile(profileData);
        });
      }
    }, [user])
  );

  const savedRestaurantIds = new Set(savedPlaces.map((sp) => sp.restaurant_id));

  // Map Supabase rows to frontend Restaurant format
  const formattedRestaurants: Restaurant[] = allRestaurants.map((row) =>
    mapRowToRestaurant(row, savedRestaurantIds.has(row.id))
  );

  const savedCravings: Restaurant[] = savedPlaces
    .filter((sp) => sp.restaurant)
    .map((sp) => mapRowToRestaurant(sp.restaurant!, true));

  const userName =
    myProfile?.display_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Explorer';

  const userAvatar =
    myProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF385C&color=fff`;

  const topProximity = proximityMatches[0];

  const handleSelectRestaurant = (rest: Restaurant) => {
    RootNavigation.toRestaurantDetails(rest.id);
  };

  if (loading && allRestaurants.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="restaurant" size={32} color={colors.primary} />
          </View>
          <ActivityIndicator size="large" color={colors.primary} />
          <CraveText variant="bodyBold" color={colors.primaryText}>
            Setting up your CraveList...
          </CraveText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Greeting Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => RootNavigation.toProfile()}
              style={styles.userGreetingRow}
            >
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
              <View style={styles.greetingTextGroup}>
                <CraveText variant="h1" style={styles.greetingTitle}>
                  Good day, {userName} 👋
                </CraveText>
                <CraveText variant="body" color={colors.secondaryText}>
                  What are you craving today?
                </CraveText>
              </View>
            </TouchableOpacity>

            <IconButton
              icon="notifications-outline"
              badgeCount={unreadCount}
              onPress={() => RootNavigation.toNotifications()}
            />
          </View>

          {/* Search Field */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => RootNavigation.toSearchResults()}
            style={styles.searchTouchable}
          >
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search sourdough, ramen, or spots..."
              onFilterPress={() => RootNavigation.toSearchResults()}
            />
          </TouchableOpacity>

          {/* Near Your Cravings Proximity Section */}
          {topProximity ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => RootNavigation.toProximityAlert()}
              style={[styles.proximityBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.proximityIconBg, { backgroundColor: colors.primary }]}>
                <Ionicons name="location" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.proximityTextGroup}>
                <CraveText variant="bodyBold" color={colors.primary}>
                  📍 NEAR YOUR CRAVINGS (500m)
                </CraveText>
                <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
                  {topProximity.matchedBranch.name} — {topProximity.distanceFormatted}
                </CraveText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.proximityBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.proximityIconBg, { backgroundColor: colors.badgeBg }]}>
                <Ionicons name="compass-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.proximityTextGroup}>
                <CraveText variant="bodyBold">
                  No saved cravings nearby
                </CraveText>
                <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
                  Explore places and save something for later.
                </CraveText>
              </View>
            </View>
          )}

          {/* Primary Save Action Banner */}
          <View style={[styles.saveActionBanner, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]}>
            <View style={styles.saveBannerLeft}>
              <CraveText variant="h3" color={colors.primary}>
                ＋ Save a Place
              </CraveText>
              <CraveText variant="caption" color={colors.primaryText}>
                Keep somewhere you want to try in your cravings list.
              </CraveText>
            </View>

            <AppButton
              title="Save a Place"
              onPress={() => RootNavigation.toSearchResults()}
              variant="primary"
              size="small"
              icon="add"
            />
          </View>

          {/* Available Spots in Database (Discover Something New) */}
          <View style={styles.sectionHeader}>
            <CraveText variant="h3">Discover Something New</CraveText>
            <TouchableOpacity onPress={() => RootNavigation.toSearchResults()}>
              <CraveText variant="caption" color={colors.primary}>
                See All ({formattedRestaurants.length})
              </CraveText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
            {formattedRestaurants.map((rest) => (
              <RestaurantCard
                key={rest.id}
                restaurant={rest}
                layout="compact"
                onPress={() => handleSelectRestaurant(rest)}
              />
            ))}
          </ScrollView>

          {/* Craving Dashboard Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowItem}>
                <Ionicons name="bookmark" size={18} color={colors.primary} />
                <CraveText variant="h3" style={styles.leftMargin}>
                  Your Cravings
                </CraveText>
              </View>

              <TouchableOpacity onPress={() => RootNavigation.toCravings()}>
                <CraveText variant="caption" color={colors.primary}>
                  View All ({savedPlaces.length}) →
                </CraveText>
              </TouchableOpacity>
            </View>

            <CraveText variant="body" color={colors.secondaryText}>
              <CraveText variant="bodyBold" color={colors.primaryText}>{savedPlaces.length} places saved</CraveText> in your personal CraveList
            </CraveText>
          </View>

          {/* Places You Saved Nearby */}
          {savedCravings.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <CraveText variant="h3">Places You Saved</CraveText>
                <TouchableOpacity onPress={() => RootNavigation.toCravings()}>
                  <CraveText variant="caption" color={colors.primary}>
                    My Cravings →
                  </CraveText>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
                {savedCravings.map((rest) => (
                  <RestaurantCard
                    key={rest.id}
                    restaurant={rest}
                    layout="compact"
                    onPress={() => handleSelectRestaurant(rest)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* From Your Food Circle */}
          <View style={styles.sectionHeader}>
            <CraveText variant="h3">From Your Food Circle</CraveText>
            <TouchableOpacity onPress={() => RootNavigation.toFriends()}>
              <CraveText variant="caption" color={colors.primary}>
                See Friends ({myFriends.length}) →
              </CraveText>
            </TouchableOpacity>
          </View>

          {myFriends.length > 0 ? (
            myFriends.slice(0, 3).map((friend) => (
              <TouchableOpacity
                key={friend.id}
                activeOpacity={0.85}
                onPress={() => RootNavigation.toUserProfile(friend.id)}
                style={[
                  styles.foodCircleCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Image
                  source={{
                    uri:
                      friend.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.display_name || 'Friend')}&background=FF385C&color=fff`,
                  }}
                  style={styles.friendAvatar}
                />
                <View style={styles.foodCircleTextGroup}>
                  <CraveText variant="bodyBold">{friend.display_name || 'CraveList Explorer'}</CraveText>
                  <CraveText variant="caption" color={colors.secondaryText}>
                    {friend.bio || 'Connected on CraveList'}
                  </CraveText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => RootNavigation.toFriends()}
              style={[styles.foodCircleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.friendAvatar, { backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="person-add" size={20} color={colors.primary} />
              </View>
              <View style={styles.foodCircleTextGroup}>
                <CraveText variant="bodyBold">Build Your Food Circle</CraveText>
                <CraveText variant="caption" color={colors.secondaryText}>
                  Find & connect with friends to share craving spots together.
                </CraveText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  greetingTextGroup: {
    gap: 2,
    flex: 1,
  },
  greetingTitle: {
    fontSize: 22,
  },
  searchTouchable: {
    marginVertical: 2,
  },
  saveActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  saveBannerLeft: {
    flex: 1,
    gap: 2,
  },
  proximityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  proximityIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximityTextGroup: {
    flex: 1,
    gap: 2,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftMargin: {
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  carouselScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  foodCircleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  foodCircleTextGroup: {
    flex: 1,
    gap: 2,
  },
});
