import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { CraveText } from '@/components/CraveText';
import { DiningPlan } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';

interface PlanCardProps {
  plan: DiningPlan;
  onPress: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <CraveText variant="title">{plan.title}</CraveText>
          <CraveText variant="subtitle" color={colors.primary}>
            {plan.restaurantName}
          </CraveText>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: colors.badgeBg }]}>
          <CraveText variant="badge" color={colors.primary}>
            {plan.status.toUpperCase()}
          </CraveText>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconText}>
          <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
          <CraveText variant="caption" color={colors.secondaryText} style={styles.textMargin}>
            {plan.date} at {plan.time}
          </CraveText>
        </View>

        <View style={styles.iconText}>
          <Ionicons name="location-outline" size={14} color={colors.mutedText} />
          <CraveText variant="caption" color={colors.secondaryText} style={styles.textMargin}>
            {plan.location}
          </CraveText>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.avatarStack}>
          {plan.participants.map((p, index) => (
            <View key={index} style={[styles.avatarOverlap, { marginLeft: index > 0 ? -10 : 0 }]}>
              <Avatar source={p.avatar} size={28} />
            </View>
          ))}
        </View>

        <View style={styles.joinAction}>
          <CraveText variant="caption" color={colors.primarySoft}>
            {plan.participants.length} Friends Attending
          </CraveText>
          <Ionicons name="chevron-forward" size={14} color={colors.primarySoft} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
    gap: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textMargin: {
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    zIndex: 1,
  },
  joinAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
