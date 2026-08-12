import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'badge'
  | 'code';

interface CraveTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const CraveText: React.FC<CraveTextProps> = ({
  children,
  variant = 'body',
  color,
  align = 'left',
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return {
          fontFamily: 'SpaceGrotesk_700Bold',
          fontSize: 28,
          lineHeight: 34,
          color: color || colors.primaryText,
        };
      case 'h2':
        return {
          fontFamily: 'SpaceGrotesk_700Bold',
          fontSize: 22,
          lineHeight: 28,
          color: color || colors.primaryText,
        };
      case 'h3':
        return {
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 18,
          lineHeight: 24,
          color: color || colors.primaryText,
        };
      case 'title':
        return {
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 16,
          lineHeight: 22,
          color: color || colors.primaryText,
        };
      case 'subtitle':
        return {
          fontFamily: 'SpaceGrotesk_500Medium',
          fontSize: 14,
          lineHeight: 20,
          color: color || colors.secondaryText,
        };
      case 'bodyBold':
        return {
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 14,
          lineHeight: 20,
          color: color || colors.primaryText,
        };
      case 'body':
        return {
          fontFamily: 'SpaceGrotesk_400Regular',
          fontSize: 14,
          lineHeight: 20,
          color: color || colors.primaryText,
        };
      case 'caption':
        return {
          fontFamily: 'SpaceGrotesk_500Medium',
          fontSize: 12,
          lineHeight: 16,
          color: color || colors.mutedText,
        };
      case 'badge':
        return {
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.5,
          color: color || colors.primary,
        };
      case 'code':
        return {
          fontFamily: 'SpaceGrotesk_500Medium',
          fontSize: 12,
          lineHeight: 16,
          color: color || colors.primarySoft,
        };
      default:
        return {
          fontFamily: 'SpaceGrotesk_400Regular',
          fontSize: 14,
          color: color || colors.primaryText,
        };
    }
  };

  return (
    <Text
      style={[getVariantStyle(), { textAlign: align }, style]}
      {...props}
    >
      {children}
    </Text>
  );
};
