import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatCard } from '@/components/StatCard';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { friendService, FriendshipStatus } from '@/services/friendService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { visitService } from '@/services/visitService';
import { mapRowToRestaurant } from '@/services/restaurantService';
import { ProfileRow, RestaurantRow } from '@/types/database';

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('not_connected');
  const [requestId, setRequestId] = useState<string | undefined>(undefined);

  const [sharedRestaurants, setSharedRestaurants] = useState<RestaurantRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      if (!params.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [targetProfile, statusInfo, savedPlaces, visitNum, shared] = await Promise.all([
          friendService.getUserProfile(params.id),
          user ? friendService.getFriendshipStatus(user.id, params.id) : Promise.resolve({ status: 'not_connected' as FriendshipStatus, requestId: undefined }),
          savedPlaceService.getMySavedPlaces(params.id),
          visitService.getVisitCount(params.id),
          user ? friendService.getSharedCravings(user.id, params.id) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setProfile(targetProfile);
          setFriendshipStatus(statusInfo.status);
          setRequestId(statusInfo.requestId);
          setSavedCount(savedPlaces.length);
          setVisitedCount(visitNum);
          setSharedRestaurants(shared);
        }
      } catch (err) {
        console.error('[UserProfileScreen] Error loading user profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [params.id, user]);

  const handleRemoveFriend = async () => {
    if (!user || !params.id || actionLoading) return;
    setActionLoading(true);
    const { success } = await friendService.removeFriend(user.id, params.id);
    if (success) {
      setFriendshipStatus('not_connected');
    }
    setActionLoading(false);
  };

  const handleFriendshipAction = async () => {
    if (!user || !params.id || actionLoading) return;

    setActionLoading(true);

    if (friendshipStatus === 'not_connected') {
      const { success } = await friendService.sendFriendRequest(user.id, params.id);
      if (success) {
        setFriendshipStatus('request_sent');
      }
    } else if (friendshipStatus === 'request_received' && requestId) {
      const { success } = await friendService.acceptFriendRequest(requestId, user.id);
      if (success) {
        setFriendshipStatus('friends');
      }
    }

    setActionLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="User Profile" onBackPress={() => RootNavigation.back()} />
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="User Profile" onBackPress={() => RootNavigation.back()} />
        <View style={styles.loadingWrapper}>
          <CraveText variant="h3">User Profile Not Found</CraveText>
          <AppButton title="Go Back" onPress={() => RootNavigation.back()} variant="ghost" style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  const name = profile.display_name || 'CraveList Explorer';
  const username = '@' + (profile.display_name?.toLowerCase().replace(/\s+/g, '') || 'user');
  const avatarUrl = profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  const bio = profile.bio || 'Food Explorer on CraveList';

  const formattedShared: Restaurant[] = sharedRestaurants.map((row) => mapRowToRestaurant(row, true));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={username} onBackPress={() => RootNavigation.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <CraveText variant="h1">{name}</CraveText>
          <CraveText variant="subtitle" color={colors.primary}>
            {username}
          </CraveText>
          <CraveText variant="body" align="center" color={colors.secondaryText} style={styles.bio}>
            {bio}
          </CraveText>
        </View>

        {/* Dynamic Friendship Action Buttons */}
        {friendshipStatus !== 'self' && (
          <View style={styles.actionRow}>
            {friendshipStatus === 'not_connected' && (
              <AppButton
                title={actionLoading ? 'Sending...' : 'Add Friend'}
                onPress={handleFriendshipAction}
                variant="primary"
                icon="person-add"
                disabled={actionLoading}
                fullWidth
                style={styles.flexOne}
              />
            )}

            {friendshipStatus === 'request_sent' && (
              <AppButton
                title="Request Sent"
                onPress={() => {}}
                variant="secondary"
                icon="time"
                disabled
                fullWidth
                style={styles.flexOne}
              />
            )}

            {friendshipStatus === 'request_received' && (
              <AppButton
                title={actionLoading ? 'Accepting...' : 'Accept Request'}
                onPress={handleFriendshipAction}
                variant="visited"
                icon="checkmark"
                disabled={actionLoading}
                fullWidth
                style={styles.flexOne}
              />
            )}

            {friendshipStatus === 'friends' && (
              <View style={{ gap: 10, width: '100%' }}>
                <View style={styles.actionRow}>
                  <AppButton
                    title="Message"
                    onPress={() => RootNavigation.toChat(profile.id, name)}
                    variant="primary"
                    icon="chatbubble-ellipses"
                    fullWidth
                    style={styles.flexOne}
                  />

                  <AppButton
                    title="Shared Cravings"
                    onPress={() => RootNavigation.toSharedCravings(name, profile.id)}
                    variant="outline"
                    icon="sparkles"
                    fullWidth
                    style={styles.flexOne}
                  />
                </View>

                <AppButton
                  title={actionLoading ? 'Removing...' : 'Remove Friend'}
                  onPress={handleRemoveFriend}
                  variant="outline"
                  icon="person-remove"
                  disabled={actionLoading}
                  fullWidth
                  style={{ borderColor: colors.danger }}
                />
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard title="Mutual Spots" value={sharedRestaurants.length} icon="sparkles" />
          <StatCard title="Saved" value={savedCount} icon="bookmark" />
          <StatCard title="Visited" value={visitedCount} icon="checkmark-circle" />
        </View>

        {/* Shared Craving Spots */}
        {formattedShared.length > 0 && (
          <View style={styles.sectionHeader}>
            <CraveText variant="h3">Spots You Both Saved ({formattedShared.length})</CraveText>
          </View>
        )}

        {formattedShared.map((rest) => (
          <RestaurantCard
            key={rest.id}
            restaurant={rest}
            layout="horizontal"
            onPress={() => RootNavigation.toRestaurantDetails(rest.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 8,
  },
  bio: {
    maxWidth: 280,
    lineHeight: 20,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    marginTop: 4,
  },
});
