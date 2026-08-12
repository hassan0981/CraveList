import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface AvatarProps {
  source: string;
  size?: number;
  showOnlineStatus?: boolean;
  showRing?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 44,
  showOnlineStatus = false,
  showRing = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: showRing ? colors.primary : colors.border,
            borderWidth: showRing ? 2 : 1,
          },
        ]}
      >
        <Image
          source={{ uri: source }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
        />
      </View>

      {showOnlineStatus && (
        <View
          style={[
            styles.onlineBadge,
            {
              backgroundColor: '#4EBA6F',
              borderColor: colors.background,
              width: Math.max(10, size * 0.26),
              height: Math.max(10, size * 0.26),
              borderRadius: Math.max(5, size * 0.13),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});
