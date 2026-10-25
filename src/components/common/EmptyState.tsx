import React, { useContext, useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { borderRadius, colors as defaultColors, spacing, typography } from '../../theme';
import { motion, useReducedMotionPreference } from '../../theme/motion';
import { FeatherIconName } from '../../constants/categories';
import { AnimatedButton } from '../animated/AnimatedButton';
import ThemeContext from '../../contexts/ThemeContext';

const colors = defaultColors;

export interface EmptyStateProps {
  iconName?: FeatherIconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Componente de estado vazio com entrada animada suave (200–350 ms).
 * Sem loops constantes, com suporte integral a Movimento Reduzido.
 */
export function EmptyState({
  iconName = 'inbox',
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps): React.JSX.Element {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors ?? defaultColors;
  const isDark = themeContext?.isDark ?? false;

  const isReducedMotion = useReducedMotionPreference();
  const hasAnimatedRef = useRef<boolean>(false);

  const opacity = useSharedValue(isReducedMotion ? 1 : 0);
  const translateY = useSharedValue(isReducedMotion ? 0 : motion.distance.subtle);

  useEffect(() => {
    if (isReducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      opacity.value = withTiming(1, {
        duration: motion.duration.normal,
        easing: motion.easing.decelerate,
      });
      translateY.value = withTiming(0, {
        duration: motion.duration.normal,
        easing: motion.easing.decelerate,
      });
    }
  }, [isReducedMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: isDark
              ? 'rgba(0, 159, 227, 0.2)'
              : colors.brandTurquoiseLight,
          },
        ]}
      >
        <Feather
          name={iconName}
          size={24}
          color={isDark ? colors.accent : colors.headerBg}
        />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}

      {actionLabel && onActionPress ? (
        <View style={styles.actionWrapper}>
          <AnimatedButton
            title={actionLabel}
            onPress={onActionPress}
            fullWidth={false}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brandTurquoiseLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.tight,
  },
  actionWrapper: {
    marginTop: spacing.md,
  },
});

export default EmptyState;
