import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'restaurant-outline',
  title,
  description,
  actionTitle,
  onActionPress,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.badgeBg, borderColor: colors.border }]}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <CraveText variant="h3" align="center" style={styles.title}>
        {title}
      </CraveText>
      <CraveText variant="body" align="center" color={colors.secondaryText} style={styles.description}>
        {description}
      </CraveText>
      {actionTitle && onActionPress && (
        <AppButton title={actionTitle} onPress={onActionPress} variant="primary" size="medium" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    maxWidth: 280,
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
    alignSelf: 'center',
  },
});
