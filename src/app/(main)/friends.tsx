import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { FriendCard } from '@/components/FriendCard';
import { PlanCard } from '@/components/PlanCard';
import { SearchBar } from '@/components/SearchBar';
import { mockPlans, UserFriend } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { friendService } from '@/services/friendService';
import { FriendRequestRow, ProfileRow } from '@/types/database';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);

  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestRow[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSocialData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [myFriends, requests] = await Promise.all([
          friendService.getMyFriends(user.id),
          friendService.getFriendRequests(user.id),
        ]);

        if (isMounted) {
          setFriends(myFriends);
          setPendingRequests(requests);
        }
      } catch (err) {
        console.error('[FriendsScreen] Error loading friends data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSocialData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Perform live user search
  useEffect(() => {
    let isMounted = true;

    async function handleSearch() {
      if (!user || !searchQuery.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const results = await friendService.searchUsers(searchQuery, user.id);
        if (isMounted) {
          setSearchResults(results);
        }
      } catch (err) {
        console.error('[FriendsScreen] User search error:', err);
      } finally {
        if (isMounted) setSearching(false);
      }
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, user]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!user || processingId) return;

    setProcessingId(requestId);
    const { success } = await friendService.acceptFriendRequest(requestId, user.id);
    setProcessingId(null);

    if (success) {
      // Refresh friends and pending requests immediately
      const [updatedFriends, updatedRequests] = await Promise.all([
        friendService.getMyFriends(user.id),
        friendService.getFriendRequests(user.id),
      ]);
      setFriends(updatedFriends);
      setPendingRequests(updatedRequests);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!user || processingId) return;

    setProcessingId(requestId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    await friendService.rejectFriendRequest(requestId, user.id);
    setProcessingId(null);
  };

  // Convert ProfileRow to UserFriend format for FriendCard
  const formattedFriends: UserFriend[] = friends.map((p) => ({
    id: p.id,
    name: p.display_name || 'CraveList Explorer',
    username: '@' + (p.display_name?.toLowerCase().replace(/\s+/g, '') || 'explorer'),
    avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: p.bio || 'Food Explorer on CraveList',
    mutualSaved: 0,
    statusText: 'Connected on CraveList',
    lastActive: 'Active',
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <CraveText variant="h1">Food Circle</CraveText>
            <CraveText variant="caption" color={colors.secondaryText}>
              FRIENDS, CONNECT & SHARED CRAVINGS
            </CraveText>
          </View>

          <AppButton
            title="Create Plan"
            onPress={() => RootNavigation.toPlans()}
            variant="primary"
            size="small"
            icon="calendar"
          />
        </View>

        {/* User Search Bar */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users by name to add friends..."
          />
        </View>

        {/* User Search Results Dropdown */}
        {searchQuery.trim().length > 0 && (
          <View style={[styles.searchResultsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CraveText variant="caption" color={colors.secondaryText} style={styles.marginBottom}>
              SEARCH RESULTS
            </CraveText>
            {searching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : searchResults.length > 0 ? (
              searchResults.map((userItem) => (
                <TouchableOpacity
                  key={userItem.id}
                  activeOpacity={0.85}
                  onPress={() => RootNavigation.toUserProfile(userItem.id)}
                  style={styles.searchUserRow}
                >
                  <Image
                    source={{
                      uri:
                        userItem.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                    }}
                    style={styles.searchAvatar}
                  />
                  <View style={styles.flexOne}>
                    <CraveText variant="bodyBold">{userItem.display_name || 'CraveList User'}</CraveText>
                    <CraveText variant="caption" color={colors.secondaryText}>
                      {userItem.bio || 'Food Explorer'}
                    </CraveText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <CraveText variant="body" color={colors.secondaryText} align="center">
                No users found matching "{searchQuery}"
              </CraveText>
            )}
          </View>
        )}

        {/* Incoming Pending Friend Requests Section */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CraveText variant="h3">Pending Requests ({pendingRequests.length})</CraveText>
            </View>

            {pendingRequests.map((req) => {
              const requester = req.requester_profile;
              const name = requester?.display_name || 'CraveList User';
              const avatar =
                requester?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

              return (
                <View
                  key={req.id}
                  style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => RootNavigation.toUserProfile(req.requester_id)}
                    style={styles.requestUserRow}
                  >
                    <Image source={{ uri: avatar }} style={styles.requestAvatar} />
                    <View style={styles.flexOne}>
                      <CraveText variant="bodyBold">{name}</CraveText>
                      <CraveText variant="caption" color={colors.secondaryText}>
                        Sent you a friend request
                      </CraveText>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.requestActions}>
                    <AppButton
                      title="Accept"
                      onPress={() => handleAcceptRequest(req.id)}
                      variant="primary"
                      size="small"
                      disabled={processingId === req.id}
                      style={styles.flexOne}
                    />
                    <AppButton
                      title="Decline"
                      onPress={() => handleDeclineRequest(req.id)}
                      variant="outline"
                      size="small"
                      disabled={processingId === req.id}
                      style={styles.flexOne}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Group Dining Plans Section */}
        <View style={styles.sectionHeader}>
          <CraveText variant="h3">Upcoming Group Plans</CraveText>
          <TouchableOpacity onPress={() => RootNavigation.toPlans()}>
            <CraveText variant="caption" color={colors.primary}>
              View All
            </CraveText>
          </TouchableOpacity>
        </View>

        {mockPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onPress={() => RootNavigation.toPlans()}
          />
        ))}

        {/* Foodie Friends List Section */}
        <View style={styles.sectionHeader}>
          <CraveText variant="h3">Foodie Friends ({formattedFriends.length})</CraveText>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Loading your friends...
            </CraveText>
          </View>
        ) : formattedFriends.length > 0 ? (
          formattedFriends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onPress={() => RootNavigation.toUserProfile(friend.id)}
              onChatPress={() => RootNavigation.toChat(friend.id, friend.name)}
            />
          ))
        ) : (
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            description="Find friends who share your cravings and discover spots together."
            actionTitle="Find Friends"
            onActionPress={() => {
              // Focus search bar
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
    marginBottom: 4,
  },
  searchWrapper: {
    marginVertical: 4,
  },
  searchResultsCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  marginBottom: {
    marginBottom: 4,
  },
  searchUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  searchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  flexOne: {
    flex: 1,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  requestCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  requestUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
