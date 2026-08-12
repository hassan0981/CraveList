import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  rightAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.leftRow}>
        {onBackPress && (
          <IconButton icon="arrow-back" onPress={onBackPress} style={styles.backBtn} />
        )}
        <View style={styles.titleArea}>
          <CraveText variant="h2" numberOfLines={1}>
            {title}
          </CraveText>
          {subtitle && (
            <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
              {subtitle}
            </CraveText>
          )}
        </View>
      </View>

      {rightAction && <View style={styles.rightArea}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  rightArea: {
    marginLeft: 12,
  },
});
