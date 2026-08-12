import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { mapRowToRestaurant } from '@/services/restaurantService';
import { SavedPlaceRow, VisitRow } from '@/types/database';

const filterTabs = ['All Cravings', 'Visited', 'Italian', 'Ramen', 'Bakery', 'Fast Food'];

export default function CravingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Cravings');
  const [loading, setLoading] = useState(true);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
  const [userVisits, setUserVisits] = useState<VisitRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMyCravings() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [rows, visits] = await Promise.all([
          savedPlaceService.getMySavedPlaces(user.id),
          visitService.getMyVisits(user.id),
        ]);

        if (isMounted) {
          setSavedPlaces(rows);
          setUserVisits(visits);
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
  }, [user]);

  const visitedSet = new Set(userVisits.map((v) => v.restaurant_id));

  // Convert Supabase saved places rows to frontend Restaurant type
  const cravingsList: Restaurant[] = savedPlaces
    .filter((sp) => sp.restaurant)
    .map((sp) => {
      const rest = mapRowToRestaurant(sp.restaurant!, true);
      rest.visited = visitedSet.has(sp.restaurant_id);
      return rest;
    });

  const filteredList = cravingsList.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'All Cravings') return true;
    if (activeFilter === 'Visited') return r.visited;
    return r.category.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const handleToggleSave = async (restaurantId: string) => {
    if (!user) return;

    // Immediately update local UI list
    setSavedPlaces((prev) => prev.filter((sp) => sp.restaurant_id !== restaurantId));
    // Persist deletion to Supabase database
    await savedPlaceService.unsavePlace(user.id, restaurantId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with + Save a Place Action */}
      <View style={styles.header}>
        <View style={styles.flexOne}>
          <CraveText variant="h1">My Cravings</CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            {cravingsList.length} PLACES YOU WANT TO TRY
          </CraveText>
        </View>

        <AppButton
          title="+ Save a Place"
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
          placeholder="Search saved cravings..."
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
        ) : filteredList.length > 0 ? (
          filteredList.map((rest) => (
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
            icon="bookmark-outline"
            title="Your craving list is empty"
            description="Found a restaurant you want to try? Save it here and CraveList will remind you when you're nearby."
            actionTitle="+ Save Your First Place"
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
});
