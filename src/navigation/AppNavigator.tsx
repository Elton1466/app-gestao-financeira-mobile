import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../@types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileEditScreen } from '../screens/settings/ProfileEditScreen';
import { TransactionModal } from '../components/modals/TransactionModal';
import { SuccessFeedback } from '../components/modals/SuccessFeedback';
import { colors, spacing, typography } from '../theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isDark, colors: themeColors } = useTheme();
  const { user, isLoading } = useAuth();
  const {
    showSuccessFeedback,
    successFeedbackMessage,
    setShowSuccessFeedback,
  } = useFinance();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        background: themeColors.background,
        card: themeColors.surface,
        text: themeColors.textPrimary,
        border: themeColors.border,
        primary: themeColors.accent,
      },
    };
  }, [isDark, themeColors]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.surface }]}>
        <ActivityIndicator size="large" color={themeColors.headerBg} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Carregando suas finanças...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? (
        <>
          <RootStack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen name="Settings" component={SettingsScreen} />
            <RootStack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
            />
          </RootStack.Navigator>

          <TransactionModal />
          <SuccessFeedback
            visible={showSuccessFeedback}
            message={successFeedbackMessage}
            onDismiss={() => setShowSuccessFeedback(false)}
          />
        </>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default AppNavigator;
