import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  ColorPalette,
  darkPalette,
  lightPalette,
} from '../theme/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextData {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ColorPalette;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = '@nexo:theme_mode';

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Carrega a preferência persistida no AsyncStorage
  useEffect(() => {
    let isMounted = true;
    async function loadThemePreference(): Promise<void> {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          isMounted &&
          (saved === 'light' || saved === 'dark' || saved === 'system')
        ) {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.warn('[ThemeContext] Falha ao carregar tema persistido:', err);
      }
    }
    void loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const activeColors = useMemo(() => {
    return isDark ? darkPalette : lightPalette;
  }, [isDark]);

  // Sincroniza o objeto global estático 'colors' para compatibilidade imediata
  useEffect(() => {
    Object.assign(colors, activeColors);
  }, [activeColors]);

  const setThemeMode = useCallback(async (mode: ThemeMode): Promise<void> => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('[ThemeContext] Falha ao persistir tema:', err);
    }
  }, []);

  const value = useMemo<ThemeContextData>(
    () => ({
      themeMode,
      isDark,
      colors: activeColors,
      setThemeMode,
    }),
    [themeMode, isDark, activeColors, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextData {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}

export default ThemeContext;
