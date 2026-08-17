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

import { brandService, BrandGroup } from '@/services/brandService';
import { AppButton } from '@/components/AppButton';

const filterCategories = ['All', 'Pakistani', 'Italian', 'Ramen', 'Bakery', 'Fast Food', 'Cafe'];

export default function SearchResultsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Searching...');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);

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

  // Group physical branch records into brand-level structures
  const brandGroups: BrandGroup[] = brandService.groupRestaurantsByBrand(dbRestaurants, savedSet);

  const filteredBrandGroups = brandGroups.filter((bg) => {
    const matchesTag =
      selectedTag === 'All' || bg.category.toLowerCase().includes(selectedTag.toLowerCase());
    return matchesTag;
  });

  const handleToggleSaveBrand = async (brand: BrandGroup) => {
    if (!user) return;

    const isCurrentlySaved = brand.isSaved;

    if (isCurrentlySaved) {
      // Unsave all branches of this brand
      const branchIds = new Set(brand.branches.map((b) => b.id));
      setMySavedPlaces((prev) => prev.filter((sp) => !branchIds.has(sp.restaurant_id)));

      for (const branch of brand.branches) {
        await savedPlaceService.unsavePlace(user.id, branch.id);
      }
    } else {
      // Save primary representative restaurant ID for brand
      const { data } = await savedPlaceService.savePlace(user.id, brand.representativeRestaurantId, {
        category: brand.category || 'General',
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
          placeholder="Search by brand name (e.g. KFC, Butt Karahi)..."
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
            SHOWING {filteredBrandGroups.length} BRANDS ({dbRestaurants.length} LOCATIONS)
          </CraveText>
          {fallbackUsed && filteredBrandGroups.length > 0 && (
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
              {query.trim() ? 'Looking for this brand...' : 'Finding places...'}
            </CraveText>
          </View>
        ) : filteredBrandGroups.length > 0 ? (
          filteredBrandGroups.map((brand) => {
            const isExpanded = expandedBrandId === brand.brandId;
            return (
              <View
                key={brand.brandId}
                style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.brandHeader}>
                  <View style={styles.brandInfoGroup}>
                    <CraveText variant="h2">{brand.brandName}</CraveText>
                    <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 2 }}>
                      {brand.category} • {brand.branchCount} location{brand.branchCount > 1 ? 's' : ''} in Lahore
                    </CraveText>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleToggleSaveBrand(brand)}
                    style={[
                      styles.brandSaveBtn,
                      { backgroundColor: brand.isSaved ? colors.surface : colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name={brand.isSaved ? 'checkmark-circle' : 'bookmark'}
                      size={14}
                      color={brand.isSaved ? colors.primary : '#FFFFFF'}
                    />
                    <CraveText
                      variant="caption"
                      color={brand.isSaved ? colors.primary : '#FFFFFF'}
                      style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                    >
                      {brand.isSaved ? 'Saved ✓' : 'Save Brand'}
                    </CraveText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedBrandId(isExpanded ? null : brand.brandId)}
                  style={styles.expandToggleRow}
                >
                  <CraveText variant="caption" color={colors.primary}>
                    {isExpanded ? 'Hide Locations ▲' : `View Locations (${brand.branchCount}) ▾`}
                  </CraveText>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.branchesList}>
                    {brand.branches.map((branch) => {
                      const restFormat = mapRowToRestaurant(branch, brand.isSaved);
                      return (
                        <RestaurantCard
                          key={branch.id}
                          restaurant={restFormat}
                          layout="compact"
                          onPress={() => RootNavigation.toRestaurantDetails(branch.id)}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <EmptyState
            icon="search-outline"
            title="No brands found"
            description={
              query.trim()
                ? `We couldn't find any brands matching "${query}". Try checking the name or searching again.`
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
  multiBranchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  brandCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandInfoGroup: {
    flex: 1,
    paddingRight: 8,
  },
  brandSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  expandToggleRow: {
    paddingTop: 4,
  },
  branchesList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
});
