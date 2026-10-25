import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing | number;
  elevated?: boolean;
}

export function AppCard({
  children,
  style,
  padding = 'lg',
  elevated = true,
  ...rest
}: AppCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const resolvedPadding = typeof padding === 'number' ? padding : spacing[padding];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
          padding: resolvedPadding,
        },
        elevated && styles.elevated,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg, // 16px conforme especificação
    borderWidth: 1,
    width: 'auto',
    alignSelf: 'stretch',
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default AppCard;
