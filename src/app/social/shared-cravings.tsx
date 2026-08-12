import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { friendService } from '@/services/friendService';
import { mapRowToRestaurant } from '@/services/restaurantService';
import { RestaurantRow } from '@/types/database';

export default function SharedCravingsScreen() {
  const params = useLocalSearchParams<{ friendName?: string; friendId?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sharedRows, setSharedRows] = useState<RestaurantRow[]>([]);

  const friendName = params.friendName || 'Friend';
  const friendId = params.friendId;

  useEffect(() => {
    let isMounted = true;

    async function loadShared() {
      if (!user || !friendId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rows = await friendService.getSharedCravings(user.id, friendId);
        if (isMounted) {
          setSharedRows(rows);
        }
      } catch (err) {
        console.error('[SharedCravingsScreen] Error fetching shared cravings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShared();

    return () => {
      isMounted = false;
    };
  }, [user, friendId]);

  const sharedRestaurants: Restaurant[] = sharedRows.map((r) => mapRowToRestaurant(r, true));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Shared Cravings"
        subtitle={`Co-saved with ${friendName}`}
        onBackPress={() => RootNavigation.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
          <CraveText variant="bodyBold" color={colors.primary}>
            {sharedRestaurants.length} Places You Both Want to Try!
          </CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            Spots saved by both you and {friendName}. Great candidates for your next group dining plan!
          </CraveText>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Finding matching cravings...
            </CraveText>
          </View>
        ) : sharedRestaurants.length > 0 ? (
          sharedRestaurants.map((rest) => (
            <RestaurantCard
              key={rest.id}
              restaurant={rest}
              layout="vertical"
              onPress={() => RootNavigation.toRestaurantDetails(rest.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="sparkles-outline"
            title="No shared cravings yet"
            description={`You and ${friendName} haven't co-saved any matching spots yet. Explore places and save your favorites!`}
            actionTitle="Discover Spots"
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
  banner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
