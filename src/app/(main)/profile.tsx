import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CraveText } from '@/components/CraveText';
import { IconButton } from '@/components/IconButton';
import { MemoryCard } from '@/components/MemoryCard';
import { RestaurantCard } from '@/components/RestaurantCard';
import { StatCard } from '@/components/StatCard';
import { mockCurrentUser } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { profileService } from '@/services/profileService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { visitService } from '@/services/visitService';
import { mapRowToRestaurant } from '@/services/restaurantService';
import { ProfileRow, SavedPlaceRow, VisitRow } from '@/types/database';
import { Restaurant, Memory } from '@/constants/mockData';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'saved' | 'memories'>('saved');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadRealData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [profData, savedData, visitsData] = await Promise.all([
          profileService.getCurrentProfile(user.id, {
            display_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
          }),
          savedPlaceService.getMySavedPlaces(user.id),
          visitService.getMyVisits(user.id),
        ]);

        if (isMounted) {
          setProfile(profData);
          setSavedPlaces(savedData);
          setVisits(visitsData);
        }
      } catch (err) {
        console.error('[ProfileScreen] Error loading Supabase profile/saved/visit data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Extract display details from Supabase Profile + Auth session
  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    mockCurrentUser.name;

  const displayEmail = user?.email || mockCurrentUser.username;
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || mockCurrentUser.avatar;
  const bioText = profile?.bio || mockCurrentUser.bio;

  // Convert Supabase saved_places rows to frontend Restaurant format
  const realSavedRestaurants: Restaurant[] = savedPlaces
    .filter((sp) => sp.restaurant)
    .map((sp) => mapRowToRestaurant(sp.restaurant!, true));

  // Convert Supabase visits rows to Memory type format for MemoryCard
  const realMemories: Memory[] = visits.map((v) => ({
    id: v.id,
    restaurantId: v.restaurant_id,
    restaurantName: v.restaurant?.name || 'Restaurant Spot',
    category: v.restaurant?.category || 'Dining',
    date: new Date(v.visited_at || v.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    satisfactionTag: v.note?.startsWith('[') ? v.note.split(']')[0].replace('[', '') : 'Logged Visit',
    photo: v.photo_url || v.restaurant?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    personalNote: v.note?.includes(']') ? v.note.split(']').slice(1).join(']').trim() : v.note || 'Recorded visit on trail.',
    location: v.restaurant?.address || 'Lahore',
  }));

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Settings and Logout */}
        <View style={styles.topHeader}>
          <CraveText variant="h2">Profile</CraveText>
          <View style={styles.headerActions}>
            <IconButton
              icon="settings-outline"
              onPress={() => RootNavigation.toAppearance()}
            />
            <IconButton
              icon="log-out-outline"
              onPress={handleSignOut}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* User Profile Hero */}
            <View style={styles.profileHero}>
              <Image source={{ uri: avatarUrl }} style={styles.heroAvatar} />
              <CraveText variant="h1">{displayName}</CraveText>
              <CraveText variant="subtitle" color={colors.primary}>
                {displayEmail}
              </CraveText>
              <CraveText variant="body" align="center" color={colors.secondaryText} style={styles.bioText}>
                {bioText}
              </CraveText>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard
                title="Saved"
                value={savedPlaces.length}
                icon="bookmark"
              />
              <StatCard
                title="Visited"
                value={visits.length}
                icon="checkmark-circle"
              />
              <StatCard
                title="Memories"
                value={realMemories.length}
                icon="images"
              />
              <StatCard
                title="Friends"
                value={mockCurrentUser.stats.friends}
                icon="people"
              />
            </View>

            {/* Tab Switcher: Saved vs Memories */}
            <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('saved')}
                style={[
                  styles.tabItem,
                  activeTab === 'saved' && { backgroundColor: colors.primary, borderRadius: 10 },
                ]}
              >
                <CraveText
                  variant="bodyBold"
                  color={activeTab === 'saved' ? '#FFFFFF' : colors.secondaryText}
                >
                  Saved Cravings ({realSavedRestaurants.length})
                </CraveText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('memories')}
                style={[
                  styles.tabItem,
                  activeTab === 'memories' && { backgroundColor: colors.primary, borderRadius: 10 },
                ]}
              >
                <CraveText
                  variant="bodyBold"
                  color={activeTab === 'memories' ? '#FFFFFF' : colors.secondaryText}
                >
                  Logged Memories ({realMemories.length})
                </CraveText>
              </TouchableOpacity>
            </View>

            {/* Tab Contents */}
            <View style={styles.tabContentArea}>
              {activeTab === 'saved' ? (
                realSavedRestaurants.length > 0 ? (
                  realSavedRestaurants.map((rest) => (
                    <RestaurantCard
                      key={rest.id}
                      restaurant={rest}
                      layout="horizontal"
                      onPress={() => RootNavigation.toRestaurantDetails(rest.id)}
                    />
                  ))
                ) : (
                  <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <CraveText variant="body" color={colors.secondaryText} align="center">
                      No saved cravings yet. Explore nearby spots and save your favorites!
                    </CraveText>
                  </View>
                )
              ) : realMemories.length > 0 ? (
                realMemories.map((mem) => (
                  <MemoryCard
                    key={mem.id}
                    memory={mem}
                    onPress={() => RootNavigation.toRestaurantDetails(mem.restaurantId)}
                  />
                ))
              ) : (
                <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <CraveText variant="body" color={colors.secondaryText} align="center">
                    No memories logged yet. Check in to places you visit to build your craving memories!
                  </CraveText>
                </View>
              )}
            </View>
          </>
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
    gap: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileHero: {
    alignItems: 'center',
    gap: 4,
  },
  heroAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
  },
  bioText: {
    maxWidth: 280,
    lineHeight: 20,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContentArea: {
    gap: 12,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
});
