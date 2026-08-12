import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  onSaveToggle?: () => void;
  layout?: 'vertical' | 'horizontal' | 'compact';
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
  onSaveToggle,
  layout = 'vertical',
}) => {
  const { colors } = useTheme();

  if (layout === 'horizontal') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.horizontalContainer,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        <Image source={{ uri: restaurant.image }} style={styles.horizontalImage} />
        <View style={styles.horizontalContent}>
          <View style={styles.rowBetween}>
            <CraveText variant="title" numberOfLines={1} style={styles.flexOne}>
              {restaurant.name}
            </CraveText>
            {onSaveToggle && (
              <TouchableOpacity onPress={onSaveToggle} style={styles.saveIconButton}>
                <Ionicons
                  name={restaurant.saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={restaurant.saved ? colors.primary : colors.mutedText}
                />
              </TouchableOpacity>
            )}
          </View>

          <CraveText variant="subtitle" numberOfLines={1}>
            {restaurant.category} • {restaurant.priceLevel}
          </CraveText>

          <View style={styles.rowItem}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <CraveText variant="caption" color={colors.primaryText} style={styles.leftMargin}>
              {restaurant.distance}
            </CraveText>
            {restaurant.priority === 'high' && (
              <View style={[styles.miniPriorityBadge, { backgroundColor: colors.badgeBg }]}>
                <CraveText variant="badge" color={colors.primary}>
                  🔥 High Craving
                </CraveText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (layout === 'compact') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.compactContainer,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        <Image source={{ uri: restaurant.image }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <CraveText variant="title" numberOfLines={1}>
            {restaurant.name}
          </CraveText>
          <CraveText variant="caption" numberOfLines={1} color={colors.secondaryText}>
            {restaurant.category}
          </CraveText>
          <CraveText variant="caption" color={colors.primary}>
            📍 {restaurant.distance}
          </CraveText>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.verticalContainer,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: restaurant.image }} style={styles.verticalImage} />
        <View style={styles.badgeContainer}>
          {restaurant.visited ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.visited }]}>
              <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
              <CraveText variant="badge" color="#FFFFFF" style={styles.badgeText}>
                VISITED
              </CraveText>
            </View>
          ) : restaurant.priority === 'high' ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="flame" size={12} color="#FFFFFF" />
              <CraveText variant="badge" color="#FFFFFF" style={styles.badgeText}>
                HIGH PRIORITY
              </CraveText>
            </View>
          ) : restaurant.saved ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="bookmark" size={12} color={colors.primary} />
              <CraveText variant="badge" color={colors.primary} style={styles.badgeText}>
                SAVED CRAVING
              </CraveText>
            </View>
          ) : null}
        </View>

        {onSaveToggle && (
          <TouchableOpacity
            onPress={onSaveToggle}
            style={[styles.floatingSaveBtn, { backgroundColor: colors.elevatedSurface }]}
          >
            <Ionicons
              name={restaurant.saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={restaurant.saved ? colors.primary : colors.primaryText}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.verticalContent}>
        <View style={styles.rowBetween}>
          <CraveText variant="title" numberOfLines={1} style={styles.flexOne}>
            {restaurant.name}
          </CraveText>
          <CraveText variant="caption" color={colors.mutedText}>
            {restaurant.savedDate ? `Saved ${restaurant.savedDate}` : 'Nearby'}
          </CraveText>
        </View>

        <CraveText variant="subtitle" numberOfLines={1} style={styles.categoryMargin}>
          {restaurant.category} • {restaurant.priceLevel}
        </CraveText>

        {restaurant.personalNote && (
          <View style={[styles.personalNoteBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CraveText variant="caption" color={colors.secondaryText} numberOfLines={2} style={styles.italicText}>
              "{restaurant.personalNote}"
            </CraveText>
          </View>
        )}

        <View style={styles.rowBetween}>
          <View style={styles.rowItem}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <CraveText variant="caption" color={colors.primaryText} style={styles.distanceText}>
              {restaurant.distance}
            </CraveText>
          </View>

          {restaurant.recommendedBy && (
            <CraveText variant="caption" color={colors.primarySoft}>
              Saved by {restaurant.recommendedBy.split(' ')[0]}
            </CraveText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  verticalContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageWrapper: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  verticalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  floatingSaveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  verticalContent: {
    padding: 14,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexOne: {
    flex: 1,
    marginRight: 8,
  },
  categoryMargin: {
    marginVertical: 2,
  },
  personalNoteBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  italicText: {
    fontStyle: 'italic',
  },
  distanceText: {
    marginLeft: 4,
  },
  leftMargin: {
    marginLeft: 4,
  },
  miniPriorityBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Horizontal styles
  horizontalContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    height: 96,
  },
  horizontalImage: {
    width: 96,
    height: '100%',
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  saveIconButton: {
    padding: 2,
  },

  // Compact styles
  compactContainer: {
    width: 160,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 12,
  },
  compactImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  compactContent: {
    padding: 10,
    gap: 2,
  },
});
