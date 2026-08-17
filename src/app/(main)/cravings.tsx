import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { RestaurantCard } from '@/components/RestaurantCard';
import { SearchBar } from '@/components/SearchBar';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { savedPlaceService } from '@/services/savedPlaceService';
import { visitService } from '@/services/visitService';
import { restaurantService, mapRowToRestaurant } from '@/services/restaurantService';
import { RestaurantRow, SavedPlaceRow, VisitRow } from '@/types/database';

import { brandService, BrandGroup, normalizeBrand } from '@/services/brandService';

const filterTabs = ['All Cravings', 'Visited', 'Italian', 'Ramen', 'Bakery', 'Fast Food'];

export default function CravingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Cravings');
  const [loading, setLoading] = useState(true);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
  const [userVisits, setUserVisits] = useState<VisitRow[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<RestaurantRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadMyCravings() {
        if (!user) {
          setLoading(false);
          return;
        }

        if (savedPlaces.length === 0 && userVisits.length === 0) {
          setLoading(true);
        }

        try {
          const [rows, visits, rests] = await Promise.all([
            savedPlaceService.getMySavedPlaces(user.id),
            visitService.getMyVisits(user.id),
            restaurantService.getRestaurants(),
          ]);

          if (isMounted) {
            const visitedRestIds = new Set(visits.map((v) => v.restaurant_id));
            const unvisitedSaved = rows.filter((sp) => !visitedRestIds.has(sp.restaurant_id));
            setSavedPlaces(unvisitedSaved);
            setUserVisits(visits);
            setAllRestaurants(rests);
          }
        } catch (err) {
          console.error('[CravingsScreen] Error fetching my saved places/visits:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      loadMyCravings();

      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const savedSet = new Set(savedPlaces.map((sp) => sp.restaurant_id));

  // Extract saved restaurant rows from joined savedPlaces query
  const savedRestaurants = savedPlaces.filter((sp) => sp.restaurant).map((sp) => sp.restaurant!);
  
  // Combine allRestaurants with savedRestaurants to guarantee every saved spot is present
  const combinedRestaurants = [...allRestaurants];
  const existingIds = new Set(allRestaurants.map((r) => r.id));
  for (const sRest of savedRestaurants) {
    if (!existingIds.has(sRest.id)) {
      combinedRestaurants.push(sRest);
      existingIds.add(sRest.id);
    }
  }

  // Derive saved brand identifiers
  const savedBrandIds = new Set(
    savedRestaurants.map((r) => normalizeBrand(r.name).brandId)
  );

  const brandGroups: BrandGroup[] = brandService.groupRestaurantsByBrand(combinedRestaurants, savedSet);
  const savedBrandGroups = brandGroups.filter((bg) => bg.isSaved || savedBrandIds.has(bg.brandId));

  const filteredBrands = savedBrandGroups.filter((bg) => {
    const matchesSearch =
      bg.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bg.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'All Cravings') return true;
    return bg.category.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const handleUnsaveBrand = async (brand: BrandGroup) => {
    if (!user) return;

    // Remove saved places for all branches of this brand
    const branchIds = new Set(brand.branches.map((b) => b.id));
    setSavedPlaces((prev) => prev.filter((sp) => !branchIds.has(sp.restaurant_id)));

    for (const branch of brand.branches) {
      await savedPlaceService.unsavePlace(user.id, branch.id);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with + Save a Place Action */}
      <View style={styles.header}>
        <View style={styles.flexOne}>
          <CraveText variant="h1">My Cravings</CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            {savedBrandGroups.length} BRANDS SAVED ({savedPlaces.length} LOCATIONS MONITORED)
          </CraveText>
        </View>

        <AppButton
          title="+ Save a Brand"
          onPress={() => RootNavigation.toSearchResults()}
          variant="primary"
          size="small"
          icon="add"
        />
      </View>

      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search saved brands..."
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(tab)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <CraveText
                  variant="caption"
                  color={isSelected ? '#FFFFFF' : colors.primaryText}
                  style={styles.filterText}
                >
                  {tab}
                </CraveText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List / Empty State */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Loading your cravings from Supabase...
            </CraveText>
          </View>
        ) : filteredBrands.length > 0 ? (
          filteredBrands.map((brand) => (
            <View
              key={brand.brandId}
              style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.brandRow}>
                <View style={styles.brandInfo}>
                  <CraveText variant="h2">{brand.brandName}</CraveText>
                  <CraveText variant="caption" color={colors.secondaryText}>
                    {brand.category} • Saved • {brand.branchCount} location{brand.branchCount > 1 ? 's' : ''} in Lahore
                  </CraveText>
                </View>

                <AppButton
                  title={`✓ ${brand.brandName} Saved`}
                  onPress={() => handleUnsaveBrand(brand)}
                  variant="secondary"
                  size="small"
                  icon="bookmark"
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => RootNavigation.toRestaurantDetails(brand.representativeRestaurantId)}
                style={styles.detailsBtnRow}
              >
                <CraveText variant="caption" color={colors.primary}>
                  View Brand Details & Locations →
                </CraveText>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <EmptyState
            icon="bookmark-outline"
            title="Your craving list is empty"
            description="Save your favorite restaurant brands and CraveList will notify you whenever you're within 500m of ANY location!"
            actionTitle="+ Save Your First Brand"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  flexOne: {
    flex: 1,
    marginRight: 10,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterWrapper: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  brandCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandInfo: {
    flex: 1,
    gap: 2,
  },
  detailsBtnRow: {
    paddingTop: 4,
  },
});
