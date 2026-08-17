import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { FriendCard } from '@/components/FriendCard';
import { SearchBar } from '@/components/SearchBar';
import { UserFriend } from '@/constants/mockData';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RootNavigation } from '@/navigation';
import { friendService } from '@/services/friendService';
import { messageService } from '@/services/messageService';
import { planService } from '@/services/planService';
import { FriendRequestRow, PlanRow, ProfileRow } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notificationService } from '@/services/notificationService';
import { useFocusEffect } from 'expo-router';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([]);

  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestRow[]>([]);
  const [pendingPlanInvites, setPendingPlanInvites] = useState<PlanRow[]>([]);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<Record<string, number>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSocialData = async () => {
    if (!user) return;
    try {
      const [myFriends, requests, msgCounts, myPlans] = await Promise.all([
        friendService?.getMyFriends ? friendService.getMyFriends(user.id) : Promise.resolve([]),
        friendService?.getFriendRequests ? friendService.getFriendRequests(user.id) : Promise.resolve([]),
        messageService?.getUnreadCountsByFriend ? messageService.getUnreadCountsByFriend(user.id) : Promise.resolve({}),
        planService?.getMyPlans ? planService.getMyPlans(user.id) : Promise.resolve([]),
      ]);
      setFriends(myFriends || []);
      setPendingRequests(requests || []);
      setUnreadMessageCounts(msgCounts || {});

      const pendingInvites = (myPlans || []).filter(
        (p: PlanRow) =>
          p.creator_id !== user.id &&
          (p.members || []).some((m: any) => m.user_id === user.id && m.rsvp_status === 'pending')
      );
      setPendingPlanInvites(pendingInvites);
    } catch (err) {
      console.error('[FriendsScreen] Error refreshing social data:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSocialData() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (friends.length === 0) {
        setLoading(true);
      }

      try {
        const [myFriends, requests, msgCounts, myPlans] = await Promise.all([
          friendService?.getMyFriends ? friendService.getMyFriends(user.id) : Promise.resolve([]),
          friendService?.getFriendRequests ? friendService.getFriendRequests(user.id) : Promise.resolve([]),
          messageService?.getUnreadCountsByFriend ? messageService.getUnreadCountsByFriend(user.id) : Promise.resolve({}),
          planService?.getMyPlans ? planService.getMyPlans(user.id) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setFriends(myFriends || []);
          setPendingRequests(requests || []);
          setUnreadMessageCounts(msgCounts || {});

          const pendingInvites = (myPlans || []).filter(
            (p: PlanRow) =>
              p.creator_id !== user.id &&
              (p.members || []).some((m: any) => m.user_id === user.id && m.rsvp_status === 'pending')
          );
          setPendingPlanInvites(pendingInvites);
        }
      } catch (err) {
        console.error('[FriendsScreen] Error loading friends data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSocialData();

    const unsubscribe = user
      ? notificationService.subscribeToNotifications(user.id, () => {
        if (isMounted) fetchSocialData();
      })
      : () => { };

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchSocialData();
      }
    }, [user])
  );

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
    avatar:
      p.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name || 'Explorer')}&background=FF385C&color=fff`,
    bio: p.bio || 'Food Explorer on CraveList',
    mutualSaved: 0,
    statusText: 'Connected on CraveList',
    lastActive: 'Active',
  }));

  const [sentRequestUserIds, setSentRequestUserIds] = useState<Set<string>>(new Set());

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user || processingId) return;

    setProcessingId(targetUserId);
    const { success } = await friendService.sendFriendRequest(user.id, targetUserId);
    setProcessingId(null);

    if (success) {
      setSentRequestUserIds((prev) => new Set([...prev, targetUserId]));
    }
  };

  const friendIdsSet = new Set(friends.map((f) => f.id));

  const handleRemoveFriend = async (friendUserId: string) => {
    if (!user || processingId) return;

    setProcessingId(friendUserId);
    setFriends((prev) => prev.filter((f) => f.id !== friendUserId));
    await friendService.removeFriend(user.id, friendUserId);
    setProcessingId(null);
  };

  const handleAcceptPlanRsvp = async (planId: string) => {
    if (!user) return;
    setProcessingId(planId);
    await planService.updateRsvpStatus(planId, user.id, 'accepted');
    await fetchSocialData();
    setProcessingId(null);
  };

  const handleDeclinePlanRsvp = async (planId: string) => {
    if (!user) return;
    setProcessingId(planId);
    await planService.updateRsvpStatus(planId, user.id, 'declined');
    await fetchSocialData();
    setProcessingId(null);
  };

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

        {/* Pending Plan Invitations Banner */}
        {pendingPlanInvites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CraveText variant="h3" color={colors.primary}>
                🍽️ Pending Dining Plan Invites ({pendingPlanInvites.length})
              </CraveText>
            </View>

            {pendingPlanInvites.map((plan) => {
              const hostName = plan.creator_profile?.display_name || 'A friend';
              const spotName = plan.restaurant?.name || plan.title;

              return (
                <View
                  key={plan.id}
                  style={[styles.requestCard, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => RootNavigation.toPlans()}
                    style={styles.requestUserRow}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.flexOne}>
                      <CraveText variant="bodyBold">{plan.title}</CraveText>
                      <CraveText variant="caption" color={colors.primarySoft}>
                        {hostName} invited you to dinner at {spotName}!
                      </CraveText>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.requestActions}>
                    <AppButton
                      title="Accept RSVP"
                      onPress={() => handleAcceptPlanRsvp(plan.id)}
                      variant="primary"
                      size="small"
                      disabled={processingId === plan.id}
                      style={styles.flexOne}
                      icon="checkmark"
                    />
                    <AppButton
                      title="Decline"
                      onPress={() => handleDeclinePlanRsvp(plan.id)}
                      variant="outline"
                      size="small"
                      disabled={processingId === plan.id}
                      style={styles.flexOne}
                      icon="close"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* User Search Results Dropdown */}
        {searchQuery.trim().length > 0 && (
          <View style={[styles.searchResultsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CraveText variant="caption" color={colors.secondaryText} style={styles.marginBottom}>
              SEARCH RESULTS
            </CraveText>
            {searching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : searchResults.length > 0 ? (
              searchResults.map((userItem) => {
                const isFriend = friendIdsSet.has(userItem.id);
                const isRequestSent = sentRequestUserIds.has(userItem.id);

                return (
                  <View key={userItem.id} style={styles.searchUserRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => RootNavigation.toUserProfile(userItem.id)}
                      style={styles.searchUserInfo}
                    >
                      <Image
                        source={{
                          uri:
                            userItem.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.display_name || 'User')}&background=FF385C&color=fff`,
                        }}
                        style={styles.searchAvatar}
                      />
                      <View style={styles.flexOne}>
                        <CraveText variant="bodyBold">{userItem.display_name || 'CraveList User'}</CraveText>
                        <CraveText variant="caption" color={colors.secondaryText}>
                          {userItem.bio || 'Food Explorer'}
                        </CraveText>
                      </View>
                    </TouchableOpacity>

                    {isFriend ? (
                      <AppButton
                        title="Chat"
                        onPress={() => RootNavigation.toChat(userItem.id, userItem.display_name || 'Friend')}
                        variant="secondary"
                        size="small"
                        icon="chatbubbles-outline"
                      />
                    ) : isRequestSent ? (
                      <AppButton
                        title="Sent"
                        onPress={() => { }}
                        variant="outline"
                        size="small"
                        disabled
                      />
                    ) : (
                      <AppButton
                        title="+ Add"
                        onPress={() => handleSendFriendRequest(userItem.id)}
                        variant="primary"
                        size="small"
                        disabled={processingId === userItem.id}
                      />
                    )}
                  </View>
                );
              })
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
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF385C&color=fff`;

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
              Manage Plans →
            </CraveText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => RootNavigation.toPlans()}
          style={[styles.searchResultsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <CraveText variant="bodyBold">Plan a Meal Together</CraveText>
              <CraveText variant="caption" color={colors.secondaryText}>
                Schedule dining meetups with friends at your favorite spots.
              </CraveText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Foodie Friends List Section */}
        <View style={styles.sectionHeader}>
          <CraveText variant="h3">Foodie Friends ({friends.length})</CraveText>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Loading your friends...
            </CraveText>
          </View>
        ) : friends.length > 0 ? (
          friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              unreadCount={unreadMessageCounts[friend.id] || 0}
              onPress={() => RootNavigation.toUserProfile(friend.id)}
              onChatPress={() => {
                setUnreadMessageCounts((prev) => ({ ...prev, [friend.id]: 0 }));
                RootNavigation.toChat(friend.id, friend.display_name || 'Friend');
              }}
            />
          ))
        ) : (
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            description="Find friends who share your cravings and discover spots together."
            actionTitle="Find Friends"
            onActionPress={() => setSearchQuery('a')}
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
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  searchUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
