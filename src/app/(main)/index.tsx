import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { IconButton } from '@/components/IconButton';
import { InteractiveMap } from '@/components/InteractiveMap';
import { RestaurantCard } from '@/components/RestaurantCard';
import { SearchBar } from '@/components/SearchBar';
import { mockCurrentUser, mockFriends, mockNotifications, Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { restaurantService, mapRowToRestaurant } from '@/services/restaurantService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { RestaurantRow, SavedPlaceRow } from '@/types/database';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const [allRestaurants, setAllRestaurants] = useState<RestaurantRow[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fade entrance animation for Home
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch real Supabase database records
  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        const [restsData, mySaved] = await Promise.all([
          restaurantService.getRestaurants(),
          user ? savedPlaceService.getMySavedPlaces(user.id) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setAllRestaurants(restsData);
          setSavedPlaces(mySaved);
        }
      } catch (err) {
        console.error('[HomeScreen] Error loading Supabase data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const savedRestaurantIds = new Set(savedPlaces.map((sp) => sp.restaurant_id));

  // Map Supabase rows to frontend Restaurant format
  const formattedRestaurants: Restaurant[] = allRestaurants.map((row) =>
    mapRowToRestaurant(row, savedRestaurantIds.has(row.id))
  );

  const savedCravings: Restaurant[] = savedPlaces
    .filter((sp) => sp.restaurant)
    .map((sp) => mapRowToRestaurant(sp.restaurant!, true));

  const userName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Explorer';

  const userAvatar = user?.user_metadata?.avatar_url || mockCurrentUser.avatar;
  const proximityAlert = mockNotifications.find((n) => n.type === 'proximity');

  const handleSelectRestaurant = (rest: Restaurant) => {
    RootNavigation.toRestaurantDetails(rest.id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Greeting Header */}
          <View style={styles.topHeader}>
            <View style={styles.userGreetingRow}>
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
              <View style={styles.greetingTextGroup}>
                <CraveText variant="h1" style={styles.greetingTitle}>
                  Good day, {userName} 👋
                </CraveText>
                <CraveText variant="body" color={colors.secondaryText}>
                  What are you craving today?
                </CraveText>
              </View>
            </View>

            <IconButton
              icon="notifications-outline"
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

          {/* Proximity Alert Banner */}
          {proximityAlert && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => RootNavigation.toProximityAlert()}
              style={[
                styles.proximityBanner,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.proximityIconBg, { backgroundColor: colors.primary }]}>
                <Ionicons name="location" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.proximityTextGroup}>
                <CraveText variant="bodyBold" color={colors.primary}>
                  📍 NEARBY CRAVING ALERT
                </CraveText>
                <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
                  {proximityAlert.subtitle}
                </CraveText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

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

          {/* Available Spots in Database */}
          <View style={styles.sectionHeader}>
            <CraveText variant="h3">Explore Spots</CraveText>
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

          {/* Explore Your Craving Map Feature Card */}
          <View style={styles.sectionHeader}>
            <CraveText variant="h3">Explore Your Craving Map</CraveText>
            {formattedRestaurants.length > 0 && (
              <TouchableOpacity onPress={() => handleSelectRestaurant(formattedRestaurants[0])}>
                <CraveText variant="caption" color={colors.primary}>
                  Explore Map →
                </CraveText>
              </TouchableOpacity>
            )}
          </View>

          <InteractiveMap onSelectRestaurant={handleSelectRestaurant} height={190} showControls={false} />

          {/* From Your Food Circle */}
          <View style={styles.sectionHeader}>
            <CraveText variant="h3">From Your Food Circle</CraveText>
            <TouchableOpacity onPress={() => RootNavigation.toFriends()}>
              <CraveText variant="caption" color={colors.primary}>
                See Friends →
              </CraveText>
            </TouchableOpacity>
          </View>

          {mockFriends.slice(0, 2).map((friend) => (
            <TouchableOpacity
              key={friend.id}
              activeOpacity={0.85}
              onPress={() => RootNavigation.toUserProfile(friend.id)}
              style={[
                styles.foodCircleCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
              <View style={styles.foodCircleTextGroup}>
                <CraveText variant="bodyBold">{friend.name}</CraveText>
                <CraveText variant="caption" color={colors.secondaryText}>
                  {friend.statusText}
                </CraveText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          ))}
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
