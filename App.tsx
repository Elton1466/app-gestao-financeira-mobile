import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  Roboto_400Regular,
  Roboto_500Medium,
} from '@expo-google-fonts/roboto';
import { initDatabase } from './src/database/db';
import { runSeedIfNeeded } from './src/database/seed';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { FinanceProvider } from './src/contexts/FinanceContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors, spacing, typography } from './src/theme';
import { KeyboardDoneAccessory } from './src/components/common/KeyboardDoneAccessory';

function AppContent(): React.JSX.Element {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <FinanceProvider>
          <AppNavigator />
          <KeyboardDoneAccessory />
        </FinanceProvider>
      </AuthProvider>
    </>
  );
}

export default function App(): React.JSX.Element {
  const [isDbReady, setIsDbReady] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    let isMounted = true;

    async function setupDatabase(): Promise<void> {
      try {
        await initDatabase();
        await runSeedIfNeeded();
      } catch (err) {
        console.error('[App] Falha ao inicializar banco SQLite:', err);
      } finally {
        if (isMounted) {
          setIsDbReady(true);
        }
      }
    }

    void setupDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDbReady || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.bootContainer}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.bootText}>
            Inicializando nexo...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  bootText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
