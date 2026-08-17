import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { EmptyState } from '@/components/EmptyState';
import { PlanCard } from '@/components/PlanCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RootNavigation } from '@/navigation';
import { friendService } from '@/services/friendService';
import { planService } from '@/services/planService';
import { restaurantService } from '@/services/restaurantService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { PlanRow, ProfileRow, RestaurantRow, SavedPlaceRow } from '@/types/database';

export default function PlansScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<PlanRow[]>([]);

  // Create plan modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [plannedTimeOption, setPlannedTimeOption] = useState<'tonight' | 'tomorrow' | 'saturday' | 'custom'>('tonight');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'dinner' | 'prime' | 'late' | 'lunch' | 'custom'>('prime');
  const [customDateString, setCustomDateString] = useState('');
  const [customTimeString, setCustomTimeString] = useState('');
  const [spotSearchQuery, setSpotSearchQuery] = useState('');

  // Form options data
  const [allAvailableSpots, setAllAvailableSpots] = useState<{ id: string; name: string }[]>([]);
  const [friendsList, setFriendsList] = useState<ProfileRow[]>([]);

  const fetchPlans = async () => {
    if (!user) return;
    try {
      const fetched = await planService.getMyPlans(user.id);
      setPlans(fetched);
    } catch (err) {
      console.error('[PlansScreen] Error fetching plans:', err);
    }
  };

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    await fetchPlans();
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }

    const unsubscribe = user
      ? planService.subscribeToPlanUpdates(user.id, () => {
          if (isMounted) fetchPlans();
        })
      : () => {};

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchPlans();
      }
    }, [user])
  );

  const handleOpenCreateModal = async () => {
    if (!user) return;
    setShowCreateModal(true);
    try {
      const [places, friends, rests] = await Promise.all([
        savedPlaceService.getMySavedPlaces(user.id),
        friendService.getMyFriends(user.id),
        restaurantService.getRestaurants(),
      ]);

      setFriendsList(friends || []);

      // Combine saved places and all database spots
      const map = new Map<string, string>();
      (places || []).forEach((p: SavedPlaceRow) => {
        if (p.restaurant_id && p.restaurant?.name) map.set(p.restaurant_id, `📍 ${p.restaurant.name} (Saved)`);
      });
      (rests || []).forEach((r: RestaurantRow) => {
        if (r.id && r.name && !map.has(r.id)) map.set(r.id, `🍽️ ${r.name}`);
      });

      const spotList = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      setAllAvailableSpots(spotList);

      if (spotList.length > 0 && !selectedSpotId) {
        setSelectedSpotId(spotList[0].id);
      }
    } catch (err) {
      console.error('[PlansScreen] Error loading modal form options:', err);
    }
  };

  const handleToggleFriend = (friendId: string) => {
    if (selectedFriendIds.includes(friendId)) {
      setSelectedFriendIds(selectedFriendIds.filter((id) => id !== friendId));
    } else {
      setSelectedFriendIds([...selectedFriendIds, friendId]);
    }
  };

  const handleCreatePlanSubmit = async () => {
    if (!user) return;
    if (!title.trim()) {
      alert('Please enter a plan title');
      return;
    }

    setCreating(true);

    let plannedAt = new Date();

    // 1. Calculate Date
    if (plannedTimeOption === 'tonight') {
      // today
    } else if (plannedTimeOption === 'tomorrow') {
      plannedAt.setDate(plannedAt.getDate() + 1);
    } else if (plannedTimeOption === 'saturday') {
      const daysUntilSaturday = (6 - plannedAt.getDay() + 7) % 7 || 7;
      plannedAt.setDate(plannedAt.getDate() + daysUntilSaturday);
    } else if (plannedTimeOption === 'custom' && customDateString.trim()) {
      const parsed = new Date(customDateString.trim());
      if (!isNaN(parsed.getTime())) {
        plannedAt = parsed;
      }
    }

    // 2. Calculate Time
    if (selectedTimeSlot === 'dinner') {
      plannedAt.setHours(19, 0, 0, 0);
    } else if (selectedTimeSlot === 'prime') {
      plannedAt.setHours(20, 0, 0, 0);
    } else if (selectedTimeSlot === 'late') {
      plannedAt.setHours(21, 0, 0, 0);
    } else if (selectedTimeSlot === 'lunch') {
      plannedAt.setHours(13, 30, 0, 0);
    } else if (selectedTimeSlot === 'custom' && customTimeString.trim()) {
      const match = customTimeString.trim().match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        if (customTimeString.toLowerCase().includes('pm') && hrs < 12) hrs += 12;
        plannedAt.setHours(hrs, mins, 0, 0);
      }
    }

    const { data: newPlan, error } = await planService.createPlan(user.id, {
      title: title.trim(),
      restaurantId: selectedSpotId || undefined,
      plannedAt: plannedAt.toISOString(),
      description: description.trim() || undefined,
      invitedUserIds: selectedFriendIds,
    });

    setCreating(false);

    if (error) {
      alert(error);
    } else if (newPlan) {
      setShowCreateModal(false);
      // Reset form fields
      setTitle('');
      setDescription('');
      setSelectedFriendIds([]);
      setCustomDateString('');

      // Optimistically prepend created plan to list immediately!
      setPlans((prev) => [newPlan, ...prev]);
      await fetchPlans();
    }
  };

  const filteredSpots = allAvailableSpots.filter((spot) =>
    spot.name.toLowerCase().includes(spotSearchQuery.trim().toLowerCase())
  );

  const handleAcceptRsvp = async (planId: string) => {
    if (!user) return;
    await planService.updateRsvpStatus(planId, user.id, 'accepted');
    await fetchPlans();
  };

  const handleDeclineRsvp = async (planId: string) => {
    if (!user) return;
    await planService.updateRsvpStatus(planId, user.id, 'declined');
    await fetchPlans();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Group Dining Plans"
        onBackPress={() => RootNavigation.back()}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenCreateModal}
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <CraveText variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
              Create Plan
            </CraveText>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
          <CraveText variant="bodyBold" color={colors.primary}>
            Organize Dinners with Friends 🍽️
          </CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            Select a craving spot, pick a time, and invite your food circle. All plans are saved live in your database!
          </CraveText>

          <AppButton
            title="Create New Dining Plan"
            onPress={handleOpenCreateModal}
            variant="primary"
            size="small"
            icon="add-circle"
            style={styles.bannerBtn}
          />
        </View>

        <View style={styles.sectionHeader}>
          <CraveText variant="h3">Upcoming Plans ({plans.length})</CraveText>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <CraveText variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
              Loading your group dining plans...
            </CraveText>
          </View>
        ) : plans.length > 0 ? (
          plans.map((planItem) => (
            <PlanCard
              key={planItem.id}
              plan={planItem}
              currentUserId={user?.id}
              onPress={() => planItem.restaurant_id && RootNavigation.toRestaurantDetails(planItem.restaurant_id)}
              onAccept={() => handleAcceptRsvp(planItem.id)}
              onDecline={() => handleDeclineRsvp(planItem.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No Group Plans Yet"
            description="Plan a dining meetup with your friends at your favorite restaurant spots in Lahore!"
            actionTitle="Create First Plan"
            onActionPress={handleOpenCreateModal}
          />
        )}
      </ScrollView>

      {/* Interactive Modal: Create Dining Plan */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true} onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.modalIconBg, { backgroundColor: colors.badgeBg }]}>
                  <Ionicons name="calendar-sharp" size={20} color={colors.primary} />
                </View>
                <View>
                  <CraveText variant="h2">Plan a Dining Meetup</CraveText>
                  <CraveText variant="caption" color={colors.secondaryText}>
                    Set date, pick spot, and invite your food circle
                  </CraveText>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Form Section 1: Title */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.primary} style={styles.fieldLabel}>
                  1. MEETUP TITLE *
                </CraveText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border }]}
                  placeholder="e.g. Weekend Pizza & Coffee Catchup"
                  placeholderTextColor={colors.mutedText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Form Section 2: Restaurant Spot Finder */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.primary} style={styles.fieldLabel}>
                  2. SEARCH & SELECT RESTAURANT SPOT
                </CraveText>
                <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="search-outline" size={16} color={colors.mutedText} style={{ marginRight: 6 }} />
                  <TextInput
                    style={{ flex: 1, color: colors.primaryText, fontSize: 13, height: 38 }}
                    placeholder="Search Howdy, Rina, Ramen, Coffee..."
                    placeholderTextColor={colors.mutedText}
                    value={spotSearchQuery}
                    onChangeText={setSpotSearchQuery}
                  />
                </View>
                {filteredSpots.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {filteredSpots.map((spot) => {
                      const isSelected = selectedSpotId === spot.id;
                      return (
                        <TouchableOpacity
                          key={spot.id}
                          onPress={() => setSelectedSpotId(spot.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name={isSelected ? 'location' : 'location-outline'}
                            size={14}
                            color={isSelected ? '#FFFFFF' : colors.primary}
                            style={{ marginRight: 4 }}
                          />
                          <CraveText variant="caption" color={isSelected ? '#FFFFFF' : colors.primaryText}>
                            {spot.name}
                          </CraveText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <CraveText variant="caption" color={colors.mutedText}>
                    No matching restaurant spots found.
                  </CraveText>
                )}
              </View>

              {/* Form Section 3: Dedicated Date Selector */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.primary} style={styles.fieldLabel}>
                  3. SELECT DATE 📅
                </CraveText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 2 }}>
                  {[
                    { key: 'tonight', label: 'Today' },
                    { key: 'tomorrow', label: 'Tomorrow' },
                    { key: 'saturday', label: 'This Saturday' },
                    { key: 'custom', label: '✍️ Pick Date' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setPlannedTimeOption(opt.key as any)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: plannedTimeOption === opt.key ? colors.primary : colors.background,
                          borderColor: plannedTimeOption === opt.key ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <CraveText variant="caption" color={plannedTimeOption === opt.key ? '#FFFFFF' : colors.primaryText}>
                        {opt.label}
                      </CraveText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {plannedTimeOption === 'custom' && (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border, marginTop: 4 }]}
                    placeholder="Enter Date (e.g. 2026-08-25)"
                    placeholderTextColor={colors.mutedText}
                    value={customDateString}
                    onChangeText={setCustomDateString}
                  />
                )}
              </View>

              {/* Form Section 4: Dedicated Time Selector */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.primary} style={styles.fieldLabel}>
                  4. SELECT TIME ⏰
                </CraveText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 2 }}>
                  {[
                    { key: 'dinner', label: '7:00 PM (Dinner)' },
                    { key: 'prime', label: '8:00 PM (Prime)' },
                    { key: 'late', label: '9:00 PM (Late)' },
                    { key: 'lunch', label: '1:30 PM (Lunch)' },
                    { key: 'custom', label: '✍️ Custom Time' },
                  ].map((t) => {
                    const isSelected = selectedTimeSlot === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        onPress={() => setSelectedTimeSlot(t.key as any)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={isSelected ? '#FFFFFF' : colors.primary}
                          style={{ marginRight: 4 }}
                        />
                        <CraveText variant="caption" color={isSelected ? '#FFFFFF' : colors.primaryText}>
                          {t.label}
                        </CraveText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {selectedTimeSlot === 'custom' && (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border, marginTop: 4 }]}
                    placeholder="Enter Time (e.g. 8:30 PM)"
                    placeholderTextColor={colors.mutedText}
                    value={customTimeString}
                    onChangeText={setCustomTimeString}
                  />
                )}
              </View>

              {/* Form Section 5: Invite Friends */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.primary} style={styles.fieldLabel}>
                  5. INVITE FOOD CIRCLE FRIENDS ({selectedFriendIds.length} Invited)
                </CraveText>
                {friendsList.length > 0 ? (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {friendsList.map((f) => {
                      const isInvited = selectedFriendIds.includes(f.id);
                      return (
                        <TouchableOpacity
                          key={f.id}
                          onPress={() => handleToggleFriend(f.id)}
                          style={[
                            styles.friendRow,
                            {
                              backgroundColor: isInvited ? colors.badgeBg : colors.background,
                              borderColor: isInvited ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                            <CraveText variant="bodyBold">{f.display_name || 'Friend'}</CraveText>
                          </View>
                          <Ionicons
                            name={isInvited ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={isInvited ? colors.primary : colors.mutedText}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <CraveText variant="caption" color={colors.mutedText}>
                    Add friends in your Food Circle to invite them!
                  </CraveText>
                )}
              </View>

              {/* Form Section 6: Note / Description */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.secondaryText} style={styles.fieldLabel}>
                  6. NOTE / INSTRUCTIONS (OPTIONAL)
                </CraveText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border }]}
                  placeholder="e.g. Meet by the entrance at 8 PM!"
                  placeholderTextColor={colors.mutedText}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </ScrollView>

            <View style={{ marginTop: 12 }}>
              <AppButton
                title={creating ? 'Saving Dining Plan...' : '🎉 Create & Send Invitations'}
                onPress={handleCreatePlanSubmit}
                variant="primary"
                size="medium"
                disabled={creating}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 16,
  },
  banner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  bannerBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    marginTop: 4,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  formGroup: {
    marginBottom: 14,
    gap: 6,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
