import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getCategoryById } from '../../constants/categories';
import { borderRadius, spacing, typography } from '../../theme';

export interface CategoryBadgeProps {
  categoryId: string;
  variant?: 'pill' | 'icon' | 'both';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function CategoryBadge({
  categoryId,
  variant = 'pill',
  size = 'md',
  style,
}: CategoryBadgeProps): React.JSX.Element {
  const meta = getCategoryById(categoryId);
  const iconBoxSize = size === 'sm' ? 34 : 40;
  const iconSize = size === 'sm' ? 15 : 18;

  if (variant === 'icon') {
    return (
      <View
        style={[
          styles.iconSquare,
          {
            width: iconBoxSize,
            height: iconBoxSize,
            backgroundColor: meta.bgColor,
          },
          style,
        ]}
      >
        <Feather name={meta.iconName} size={iconSize} color={meta.color} />
      </View>
    );
  }

  if (variant === 'both') {
    return (
      <View style={[styles.bothRow, style]}>
        <View
          style={[
            styles.iconSquare,
            {
              width: iconBoxSize,
              height: iconBoxSize,
              backgroundColor: meta.bgColor,
            },
          ]}
        >
          <Feather name={meta.iconName} size={iconSize} color={meta.color} />
        </View>
        <View style={[styles.pill, { backgroundColor: meta.bgColor }]}>
          <Text style={[styles.pillText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: meta.bgColor }, style]}>
      <Feather
        name={meta.iconName}
        size={11}
        color={meta.color}
        style={styles.pillInlineIcon}
      />
      <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bothRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconSquare: {
    borderRadius: borderRadius.md, // 12px quadrado arredondado conforme Figura 1
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  pillInlineIcon: {
    marginRight: 4,
  },
  pillText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xxs,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default CategoryBadge;
