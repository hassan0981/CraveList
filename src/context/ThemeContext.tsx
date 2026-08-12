import React, { createContext, useContext, useState } from 'react';
import { ColorTheme, Palette, ThemeMode } from '@/constants/colors';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ColorTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: Palette.dark,
  setMode: () => {},
  toggleTheme: () => {},
});

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleTheme = () => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = Palette[mode];

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
