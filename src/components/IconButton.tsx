import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  badgeCount?: number;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 20,
  color,
  backgroundColor,
  badgeCount,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: backgroundColor || colors.elevatedSurface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color || colors.primaryText} />
      {!!badgeCount && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <CraveText style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </CraveText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 12,
  },
});
