import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { MainTabsParamList } from '../../@types/navigation';

interface TabItemConfig {
  routeName: keyof MainTabsParamList;
  label: string;
  iconName: React.ComponentProps<typeof Feather>['name'];
}

const LEFT_TABS: readonly TabItemConfig[] = [
  { routeName: 'Dashboard', label: 'Dashboard', iconName: 'home' },
  { routeName: 'Planning', label: 'Planejamento', iconName: 'calendar' },
];

const RIGHT_TABS: readonly TabItemConfig[] = [
  { routeName: 'Reports', label: 'Análise', iconName: 'bar-chart-2' },
  { routeName: 'Transactions', label: 'Lançamentos', iconName: 'list' },
];

export const CustomBottomTab: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const { openTransactionModal } = useFinance();

  const currentRouteName = state.routes[state.index]?.name as
    | keyof MainTabsParamList
    | undefined;

  const handleNavigate = (routeName: keyof MainTabsParamList) => {
    const targetRoute = state.routes.find((r) => r.name === routeName);
    if (!targetRoute) {
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: targetRoute.key,
      canPreventDefault: true,
    });

    if (currentRouteName !== routeName && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderTabButton = (item: TabItemConfig) => {
    const isFocused = currentRouteName === item.routeName;
    const tintColor = isFocused ? themeColors.accent : themeColors.textSecondary;

    return (
      <Pressable
        key={item.routeName}
        onPress={() => handleNavigate(item.routeName)}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={`Aba ${item.label}`}
        style={({ pressed }) => [
          styles.tabItem,
          pressed && styles.tabItemPressed,
        ]}
      >
        <Feather name={item.iconName} size={22} color={tintColor} />
        <Text
          style={[
            styles.tabLabel,
            { color: tintColor },
            isFocused && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.borderLight,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      {LEFT_TABS.map(renderTabButton)}

      {/* Botão Flutuante Central (+) — Heurísticas 4 e 7 + Acessibilidade WCAG Seção 4.2 */}
      <View style={styles.fabWrapper}>
        <Pressable
          onPress={() => openTransactionModal()}
          accessibilityRole="button"
          accessibilityLabel="Botão: Adicionar nova transação"
          style={({ pressed }) => [
            styles.fabButton,
            { borderColor: themeColors.surface },
            pressed && styles.fabButtonPressed,
          ]}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {RIGHT_TABS.map(renderTabButton)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  tabLabelActive: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  },
  fabWrapper: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -24,
    backgroundColor: colors.accent, // Azul-ciano vibrante #009FE3 conforme DESIGN.md
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabButtonPressed: {
    backgroundColor: colors.primary,
    transform: [{ scale: 0.95 }],
  },
});

export default CustomBottomTab;
