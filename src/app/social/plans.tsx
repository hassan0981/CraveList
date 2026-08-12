import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { PlanCard } from '@/components/PlanCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { DiningPlan, mockPlans } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { RootNavigation } from '@/navigation';

export default function PlansScreen() {
  const { colors } = useTheme();
  const [plansList, setPlansList] = useState<DiningPlan[]>(mockPlans);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePlanMock = () => {
    const newPlan: DiningPlan = {
      id: `plan_${Date.now()}`,
      title: 'Saturday Night Italian Feast',
      restaurantId: 'rest_1',
      restaurantName: 'Osteria Del Corso',
      date: 'Saturday, Aug 22',
      time: '7:30 PM',
      location: '428 Via Garibaldi',
      participants: [
        { name: 'Alexander', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
        { name: 'Sophia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      ],
      status: 'upcoming',
      note: 'Organized via CraveList',
    };

    setPlansList([newPlan, ...plansList]);
    setShowCreateModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Group Dining Plans"
        onBackPress={() => RootNavigation.back()}
        rightAction={
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
          <CraveText variant="bodyBold" color={colors.primary}>
            Organize Dinners with Friends
          </CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            Pick a spot on your craving trail, set a date & time, and invite your food circle.
          </CraveText>

          <AppButton
            title="Create New Plan"
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            size="small"
            icon="add"
            style={styles.bannerBtn}
          />
        </View>

        <View style={styles.sectionHeader}>
          <CraveText variant="h3">Upcoming Plans ({plansList.length})</CraveText>
        </View>

        {plansList.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onPress={() => RootNavigation.toRestaurantDetails(plan.restaurantId)}
          />
        ))}

        {/* Quick Modal Simulation View */}
        {showCreateModal && (
          <View style={[styles.modalCard, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <CraveText variant="h3">Create Dining Plan</CraveText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={20} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <CraveText variant="body" color={colors.secondaryText}>
              Spot: Osteria Del Corso (Italian)
            </CraveText>
            <CraveText variant="body" color={colors.secondaryText}>
              Date: Saturday, Aug 22 at 7:30 PM
            </CraveText>

            <AppButton
              title="Confirm & Send Invites"
              onPress={handleCreatePlanMock}
              variant="primary"
              size="medium"
              fullWidth
            />
          </View>
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
  modalCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
