import { AppButton } from '@/components/AppButton';
import { Avatar } from '@/components/Avatar';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';
import { PlanRow } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface PlanCardProps {
  plan: PlanRow;
  currentUserId?: string;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentUserId,
  onPress,
  onAccept,
  onDecline,
}) => {
  const { colors } = useTheme();

  const members = plan.members || [];
  const myMemberRecord = members.find((m) => m.user_id === currentUserId);
  const myRsvp = myMemberRecord?.rsvp_status || (plan.creator_id === currentUserId ? 'accepted' : 'pending');

  const formattedDate = plan.planned_at
    ? new Date(plan.planned_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Date TBD';

  const restaurantName = plan.restaurant?.name || 'Restaurant Spot';
  const restaurantAddress = plan.restaurant?.address || 'Lahore, Pakistan';

  const isCreator = plan.creator_id === currentUserId;

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
            📍 {restaurantName}
          </CraveText>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isCreator
                ? colors.primary
                : myRsvp === 'accepted'
                  ? colors.badgeBg
                  : myRsvp === 'declined'
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(234,179,8,0.15)',
            },
          ]}
        >
          <CraveText
            variant="badge"
            color={
              isCreator
                ? '#FFFFFF'
                : myRsvp === 'accepted'
                  ? colors.primary
                  : myRsvp === 'declined'
                    ? '#EF4444'
                    : '#EAB308'
            }
          >
            {isCreator ? '👑 HOST / ORGANIZER' : myRsvp.toUpperCase()}
          </CraveText>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconText}>
          <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
          <CraveText variant="caption" color={colors.secondaryText} style={styles.textMargin}>
            {formattedDate}
          </CraveText>
        </View>

        <View style={styles.iconText}>
          <Ionicons name="location-outline" size={14} color={colors.mutedText} />
          <CraveText variant="caption" color={colors.secondaryText} style={styles.textMargin} numberOfLines={1}>
            {restaurantAddress}
          </CraveText>
        </View>
      </View>

      {plan.description && (
        <CraveText variant="caption" color={colors.secondaryText} numberOfLines={2}>
          "{plan.description}"
        </CraveText>
      )}

      {/* RSVP Actions if Pending */}
      {myRsvp === 'pending' && onAccept && onDecline && (
        <View style={styles.rsvpRow}>
          <AppButton
            title="Accept RSVP"
            onPress={onAccept}
            variant="primary"
            size="small"
            style={styles.flexOne}
            icon="checkmark"
          />
          <AppButton
            title="Decline"
            onPress={onDecline}
            variant="outline"
            size="small"
            style={styles.flexOne}
            icon="close"
          />
        </View>
      )}

      <View style={styles.footerRow}>
        <View style={styles.avatarStack}>
          {members.slice(0, 4).map((m, index) => (
            <View key={m.id || index} style={[styles.avatarOverlap, { marginLeft: index > 0 ? -10 : 0 }]}>
              <Avatar
                source={
                  m.user_profile?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user_profile?.display_name || 'Member')}&background=FF385C&color=fff`
                }
                size={28}
              />
            </View>
          ))}
        </View>

        <View style={styles.joinAction}>
          <CraveText variant="caption" color={colors.primarySoft}>
            {members.filter((m) => m.rsvp_status === 'accepted').length} Attending ({members.length} Invited)
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
  rsvpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  flexOne: {
    flex: 1,
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
