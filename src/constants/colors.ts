/**
 * CraveList Design System - Master Color Definitions
 * Dark & Light mode palettes with warm neutrals, subtle gold gradients, and soft green visited states.
 */

export interface ColorTheme {
  background: string;
  surface: string;
  elevatedSurface: string;
  primary: string;
  primarySoft: string;
  visited: string;
  visitedSoft: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  border: string;
  cardBackground: string;
  mapBackground: string;
  mapGrid: string;
  mapRoad: string;
  mapWater: string;
  mapPark: string;
  shadowColor: string;
  badgeBg: string;
  danger: string;
  activeTab: string;
  inactiveTab: string;
}

export const Palette: { dark: ColorTheme; light: ColorTheme } = {
  dark: {
    background: '#14171C',
    surface: '#1C2027',
    elevatedSurface: '#242A32',
    primary: '#D4A24C',
    primarySoft: '#E0B96C',
    visited: '#7A9E7E',
    visitedSoft: 'rgba(122, 158, 126, 0.16)',
    primaryText: '#F4F1E8',
    secondaryText: '#A8AAA6',
    mutedText: '#777B78',
    border: '#2C323B',
    cardBackground: '#1C2027',
    mapBackground: '#16191E',
    mapGrid: '#21262E',
    mapRoad: '#2A303A',
    mapWater: '#131A24',
    mapPark: '#1E2B23',
    shadowColor: '#000000',
    badgeBg: 'rgba(212, 162, 76, 0.16)',
    danger: '#E06C6C',
    activeTab: '#D4A24C',
    inactiveTab: '#777B78',
  },
  light: {
    background: '#EDEBE3',
    surface: '#F6F3EB',
    elevatedSurface: '#FFFFFF',
    primary: '#B88732',
    primarySoft: '#D4A24C',
    visited: '#6B8F71',
    visitedSoft: 'rgba(107, 143, 113, 0.14)',
    primaryText: '#20231F',
    secondaryText: '#656862',
    mutedText: '#8C8E88',
    border: '#DDD9CF',
    cardBackground: '#FFFFFF',
    mapBackground: '#E6E3DB',
    mapGrid: '#DAD6CC',
    mapRoad: '#D0CBC0',
    mapWater: '#D2E1ED',
    mapPark: '#D8E5D7',
    shadowColor: '#1A1A1A',
    badgeBg: 'rgba(184, 135, 50, 0.14)',
    danger: '#D94848',
    activeTab: '#B88732',
    inactiveTab: '#8C8E88',
  },
};

export type ThemeMode = 'dark' | 'light';
