import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { restaurantService, mapRowToRestaurant } from '@/services/restaurantService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { RestaurantRow, SavedPlaceRow } from '@/types/database';

const filterCategories = ['All', 'Pakistani', 'Italian', 'Ramen', 'Bakery', 'Fast Food', 'Cafe'];

export default function SearchResultsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Searching...');
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const [dbRestaurants, setDbRestaurants] = useState<RestaurantRow[]>([]);
  const [mySavedPlaces, setMySavedPlaces] = useState<SavedPlaceRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSearchData() {
      setLoading(true);
      setStatusMessage('Searching...');
      setFallbackUsed(false);

      try {
        const [searchResult, saved] = await Promise.all([
          restaurantService.searchRestaurants(query),
          user ? savedPlaceService.getMySavedPlaces(user.id) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setDbRestaurants(searchResult.records);
          setMySavedPlaces(saved);
          setFallbackUsed(searchResult.fallbackUsed);
          if (searchResult.fallbackUsed && searchResult.records.length > 0) {
            setStatusMessage('Found a new place');
          }
        }
      } catch (err) {
        console.error('[SearchResultsScreen] Error querying restaurants:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadSearchData();
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, user]);

  const savedSet = new Set(mySavedPlaces.map((sp) => sp.restaurant_id));

  // Map rows to frontend format
  const restaurants: Restaurant[] = dbRestaurants.map((row) =>
    mapRowToRestaurant(row, savedSet.has(row.id))
  );

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesTag =
      selectedTag === 'All' || r.category.toLowerCase().includes(selectedTag.toLowerCase());
    return matchesTag;
  });

  const handleToggleSave = async (restaurantId: string) => {
    if (!user) return;

    const isCurrentlySaved = savedSet.has(restaurantId);

    if (isCurrentlySaved) {
      await savedPlaceService.unsavePlace(user.id, restaurantId);
      setMySavedPlaces((prev) => prev.filter((sp) => sp.restaurant_id !== restaurantId));
    } else {
      const targetRest = dbRestaurants.find((r) => r.id === restaurantId);
      const { data } = await savedPlaceService.savePlace(user.id, restaurantId, {
        category: targetRest?.category || 'General',
      });
      if (data) {
        setMySavedPlaces((prev) => [data, ...prev]);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Discover Spots" onBackPress={() => RootNavigation.back()} />

      <View style={styles.searchWrapper}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by restaurant name, food, or vibe..."
          autoFocus
        />
      </View>

      {/* Category Pills */}
      <View style={styles.pillsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
          {filterCategories.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                activeOpacity={0.8}
                onPress={() => setSelectedTag(tag)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <CraveText
                  variant="caption"
                  color={isSelected ? '#FFFFFF' : colors.primaryText}
                  style={styles.pillText}
                >
                  {tag}
                </CraveText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results List */}
      <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeaderRow}>
          <CraveText variant="caption" color={colors.secondaryText} style={styles.resultsCount}>
            SHOWING {filteredRestaurants.length} SPOTS
          </CraveText>
          {fallbackUsed && filteredRestaurants.length > 0 && (
            <View style={[styles.newDiscoveryBadge, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <CraveText variant="badge" color={colors.primary}>
                Found a new place
              </CraveText>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={styles.loadingText}>
              {query.trim() ? 'Looking for this place...' : 'Finding places...'}
            </CraveText>
          </View>
        ) : filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((rest) => (
            <RestaurantCard
              key={rest.id}
              restaurant={rest}
              layout="vertical"
              onPress={() => RootNavigation.toRestaurantDetails(rest.id)}
              onSaveToggle={() => handleToggleSave(rest.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="search-outline"
            title="No spots found"
            description={
              query.trim()
                ? `We couldn't find any spots matching "${query}". Try checking the name or searching again.`
                : 'Search for cafes, bakeries, or restaurants in Lahore.'
            }
            actionTitle="Clear Search"
            onActionPress={() => {
              setQuery('');
              setSelectedTag('All');
            }}
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillsWrapper: {
    paddingVertical: 8,
  },
  pillsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsCount: {
    letterSpacing: 0.5,
  },
  newDiscoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
});
