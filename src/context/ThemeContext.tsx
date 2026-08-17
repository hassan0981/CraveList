import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTheme, Palette, ThemeMode } from '@/constants/colors';

const STORAGE_KEY = '@cravelist_theme_mode';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ColorTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: Palette.light,
  setMode: () => {},
  toggleTheme: () => {},
});

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary default choice for app theme is bright / light
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setModeState(saved as ThemeMode);
        }
      } catch (err) {
        console.warn('[ThemeContext] Error loading theme preference:', err);
      }
    }
    loadSavedTheme();
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  };

  const toggleTheme = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  const colors = Palette[mode];

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
