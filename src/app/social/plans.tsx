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
import { savedPlaceService } from '@/services/savedPlaceService';
import { PlanRow, ProfileRow, SavedPlaceRow } from '@/types/database';

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
  const [plannedTimeOption, setPlannedTimeOption] = useState<'tonight' | 'tomorrow' | 'weekend'>('tonight');

  // Form options data
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
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
      const [places, friends] = await Promise.all([
        savedPlaceService.getMySavedPlaces(user.id),
        friendService.getMyFriends(user.id),
      ]);
      setSavedPlaces(places || []);
      setFriendsList(friends || []);
      if (places && places.length > 0 && !selectedSpotId) {
        setSelectedSpotId(places[0].restaurant_id);
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
    if (plannedTimeOption === 'tonight') {
      plannedAt.setHours(20, 0, 0, 0);
    } else if (plannedTimeOption === 'tomorrow') {
      plannedAt.setDate(plannedAt.getDate() + 1);
      plannedAt.setHours(19, 30, 0, 0);
    } else if (plannedTimeOption === 'weekend') {
      const daysUntilSaturday = (6 - plannedAt.getDay() + 7) % 7 || 7;
      plannedAt.setDate(plannedAt.getDate() + daysUntilSaturday);
      plannedAt.setHours(20, 0, 0, 0);
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
    } else {
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFriendIds([]);
      await fetchPlans();
    }
  };

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
              <CraveText variant="h2">Create Dining Plan</CraveText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Form Field 1: Title */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.secondaryText}>
                  PLAN TITLE *
                </CraveText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border }]}
                  placeholder="e.g. Saturday Italian Dinner"
                  placeholderTextColor={colors.mutedText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Form Field 2: Restaurant Spot */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.secondaryText}>
                  CHOOSE DINING SPOT
                </CraveText>
                {savedPlaces.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {savedPlaces.map((sp) => {
                      const isSelected = selectedSpotId === sp.restaurant_id;
                      return (
                        <TouchableOpacity
                          key={sp.id}
                          onPress={() => setSelectedSpotId(sp.restaurant_id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <CraveText variant="caption" color={isSelected ? '#FFFFFF' : colors.primaryText}>
                            📍 {sp.restaurant?.name || 'Spot'}
                          </CraveText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <CraveText variant="caption" color={colors.mutedText}>
                    Save places on home/search to pick from your saved list.
                  </CraveText>
                )}
              </View>

              {/* Form Field 3: Time Frame */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.secondaryText}>
                  WHEN ARE YOU GOING?
                </CraveText>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {(['tonight', 'tomorrow', 'weekend'] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setPlannedTimeOption(opt)}
                      style={[
                        styles.chip,
                        {
                          flex: 1,
                          alignItems: 'center',
                          backgroundColor: plannedTimeOption === opt ? colors.primary : colors.background,
                          borderColor: plannedTimeOption === opt ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <CraveText variant="caption" color={plannedTimeOption === opt ? '#FFFFFF' : colors.primaryText}>
                        {opt.toUpperCase()}
                      </CraveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Form Field 4: Invite Friends */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.secondaryText}>
                  INVITE FRIENDS ({selectedFriendIds.length} Selected)
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
                          <CraveText variant="bodyBold">{f.display_name || 'Friend'}</CraveText>
                          <Ionicons
                            name={isInvited ? 'checkmark-circle' : 'ellipse-outline'}
                            size={20}
                            color={isInvited ? colors.primary : colors.mutedText}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <CraveText variant="caption" color={colors.mutedText}>
                    Add friends in Food Circle to invite them to dining meetups.
                  </CraveText>
                )}
              </View>

              {/* Form Field 5: Description */}
              <View style={styles.formGroup}>
                <CraveText variant="caption" color={colors.secondaryText}>
                  NOTE / DESCRIPTION (OPTIONAL)
                </CraveText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border }]}
                  placeholder="e.g. Celebrating exam completion! Meet by the entrance."
                  placeholderTextColor={colors.mutedText}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <AppButton
                title={creating ? 'Saving Plan...' : 'Confirm & Save Plan'}
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
    marginBottom: 8,
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
