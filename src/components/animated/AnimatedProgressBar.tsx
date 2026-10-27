import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { motion, useReducedMotionPreference } from '../../theme/motion';

export interface AnimatedProgressBarProps {
  current: number;
  target: number;
  barColor?: string;
  trackColor?: string;
  height?: number;
  showPercentageLabel?: boolean;
  mode?: 'budget' | 'goal';
  style?: StyleProp<ViewStyle>;
  /** Duração personalizada (400 a 600 ms, padrão 450 ms) */
  duration?: number;
}

/**
 * Barra de progresso animada com React Native Reanimated.
 *
 * Diretrizes do Nexo e Requisitos do Usuário:
 * - Animação suave com withTiming (400 a 600 ms).
 * - Trava visual em 100% no trilho para integridade do layout.
 * - Rótulo textual com percentual real (ex: "115% utilizado - Limite ultrapassado").
 * - Ícone vetorial complementar para não depender exclusivamente de cor (WCAG 1.4.1).
 * - Suporte imediato à preferência de Movimento Reduzido.
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  current,
  target,
  barColor = colors.accent,
  trackColor = colors.divider,
  height = 8,
  showPercentageLabel = true,
  mode = 'budget',
  style,
  duration = 450,
}) => {
  const isReducedMotion = useReducedMotionPreference();
  const safeTarget = target > 0 ? target : 1;
  const safeCurrent = Math.max(0, current);

  const realPercentage = (safeCurrent / safeTarget) * 100;
  const roundedRealPercentage = Math.round(realPercentage);
  const visualTargetPercent = Math.min(Math.max(realPercentage, 0), 100);

  const progressShared = useSharedValue(isReducedMotion ? visualTargetPercent : 0);

  useEffect(() => {
    if (isReducedMotion) {
      progressShared.value = visualTargetPercent;
    } else {
      progressShared.value = withTiming(visualTargetPercent, {
        duration,
        easing: motion.easing.emphasized,
      });
    }
  }, [visualTargetPercent, isReducedMotion, duration, progressShared]);

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      width: `${progressShared.value}%`,
    };
  });

  const isOverBudget = mode === 'budget' && safeCurrent > safeTarget;
  const isWarningBudget =
    mode === 'budget' && !isOverBudget && realPercentage >= 80;
  const isGoalCompleted = mode === 'goal' && realPercentage >= 100;

  const resolvedBarColor = (() => {
    if (mode === 'goal') {
      return isGoalCompleted ? colors.income : (barColor || colors.highlight);
    }
    if (isOverBudget) {
      return colors.expense;
    }
    if (isWarningBudget) {
      return colors.warning;
    }
    return barColor;
  })();

  const getPercentageLabelText = (): string => {
    if (mode === 'goal') {
      return isGoalCompleted
        ? `${roundedRealPercentage}% concluída`
        : `${roundedRealPercentage}%`;
    }
    if (isOverBudget) {
      return `${roundedRealPercentage}% utilizado — Limite ultrapassado`;
    }
    if (isWarningBudget) {
      return `${roundedRealPercentage}% utilizado — Próximo ao limite`;
    }
    return `${roundedRealPercentage}% utilizado`;
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: trackColor,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: roundedRealPercentage,
          text: getPercentageLabelText(),
        }}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: resolvedBarColor,
            },
            animatedFillStyle,
          ]}
        />
      </View>

      {showPercentageLabel ? (
        <View style={styles.statusRow}>
          {(isOverBudget || isWarningBudget) && (
            <Feather
              name="alert-triangle"
              size={12}
              color={resolvedBarColor}
              style={styles.alertIcon}
            />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color:
                  isOverBudget || isWarningBudget || isGoalCompleted
                    ? resolvedBarColor
                    : colors.textSecondary,
                fontWeight: isOverBudget
                  ? typography.fontWeight.bold
                  : typography.fontWeight.semibold,
              },
            ]}
          >
            {getPercentageLabelText()}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  alertIcon: {
    marginRight: 4,
  },
  statusText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
});

export default AnimatedProgressBar;
