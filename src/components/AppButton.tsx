import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'visited';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled = false,
}) => {
  const { colors } = useTheme();

  const getContainerStyle = () => {
    let bg: string = colors.primary;
    let border: string = 'transparent';

    if (variant === 'secondary') {
      bg = colors.elevatedSurface;
      border = colors.border;
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = colors.border;
    } else if (variant === 'ghost') {
      bg = 'transparent';
      border = 'transparent';
    } else if (variant === 'visited') {
      bg = colors.visited;
      border = 'transparent';
    }

    let paddingVertical = 12;
    let paddingHorizontal = 20;
    let borderRadius = 12;

    if (size === 'small') {
      paddingVertical = 8;
      paddingHorizontal = 14;
      borderRadius = 8;
    } else if (size === 'large') {
      paddingVertical = 16;
      paddingHorizontal = 24;
      borderRadius = 14;
    }

    return {
      backgroundColor: disabled ? colors.border : bg,
      borderColor: border,
      borderWidth: border !== 'transparent' ? 1 : 0,
      paddingVertical,
      paddingHorizontal,
      borderRadius,
      alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'visited') {
      return '#FFFFFF';
    }
    if (variant === 'outline' || variant === 'secondary') {
      return colors.primaryText;
    }
    if (variant === 'ghost') {
      return colors.primary;
    }
    return colors.primaryText;
  };

  const textVariant = size === 'small' ? 'caption' : size === 'large' ? 'h3' : 'bodyBold';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, getContainerStyle(), style]}
    >
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={size === 'small' ? 16 : 18}
          color={getTextColor()}
          style={styles.iconLeft}
        />
      )}
      <CraveText variant={textVariant} color={getTextColor()}>
        {title}
      </CraveText>
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={size === 'small' ? 16 : 18}
          color={getTextColor()}
          style={styles.iconRight}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
