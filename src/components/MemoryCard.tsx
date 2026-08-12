import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { Memory } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';

interface MemoryCardProps {
  memory: Memory;
  onPress: () => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onPress }) => {
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
      <Image source={{ uri: memory.photo }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.flexOne}>
            <CraveText variant="title">{memory.restaurantName}</CraveText>
            <CraveText variant="subtitle">{memory.category}</CraveText>
          </View>

          <View style={[styles.satisfactionBadge, { backgroundColor: colors.visitedSoft }]}>
            <Ionicons name="sparkles" size={12} color={colors.visited} />
            <CraveText variant="caption" color={colors.visited} style={styles.boldText}>
              {memory.satisfactionTag}
            </CraveText>
          </View>
        </View>

        <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CraveText variant="caption" color={colors.primary} style={styles.boldText}>
            Personal Memory Note
          </CraveText>
          <CraveText variant="body" color={colors.primaryText} style={styles.noteText}>
            "{memory.personalNote}"
          </CraveText>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.iconRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedText} />
            <CraveText variant="caption" color={colors.mutedText} style={styles.leftMargin}>
              Visited {memory.date}
            </CraveText>
          </View>

          <View style={styles.iconRow}>
            <Ionicons name="location-outline" size={12} color={colors.mutedText} />
            <CraveText variant="caption" color={colors.mutedText} style={styles.leftMargin}>
              {memory.location}
            </CraveText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  content: {
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flexOne: {
    flex: 1,
    marginRight: 8,
  },
  satisfactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  boldText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  noteBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  noteText: {
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftMargin: {
    marginLeft: 4,
  },
});
