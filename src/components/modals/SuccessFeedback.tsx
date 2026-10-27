import React, { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { motion, useReducedMotionPreference } from '../../theme/motion';
import { useTheme } from '../../contexts/ThemeContext';

export interface SuccessFeedbackProps {
  visible: boolean;
  message?: string;
  onDismiss?: () => void;
}

/**
 * Feedback visual imediato pós-operação com React Native Reanimated
 * (Heurística 1 de Nielsen — Visibilidade do Status do Sistema).
 *
 * Animação suave de escala e opacidade (200 ms) respeitando Movimento Reduzido.
 */
export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
  visible,
  message = 'Despesa registrada com sucesso!',
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const isReducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(isReducedMotion ? 1 : 0.88);
  const opacity = useSharedValue(isReducedMotion ? 1 : 0);

  useEffect(() => {
    if (visible) {
      if (isReducedMotion) {
        scale.value = 1;
        opacity.value = 1;
      } else {
        scale.value = 0.88;
        opacity.value = 0;
        scale.value = withTiming(1, {
          duration: motion.duration.normal,
          easing: motion.easing.decelerate,
        });
        opacity.value = withTiming(1, {
          duration: motion.duration.fast,
          easing: motion.easing.decelerate,
        });
      }
    }
  }, [visible, isReducedMotion, scale, opacity]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.overlay}
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        accessibilityLabel={message}
      >
        <Animated.View style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
          animatedCardStyle,
        ]}>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso de sucesso"
            style={[styles.closeIconButton, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Feather name="x" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.checkCircle, { backgroundColor: colors.income }]}>
            <Feather name="check" size={44} color={isDark ? '#081F4D' : colors.textInverse} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{message}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Toque para fechar</Text>

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={[styles.dismissButton, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>Fechar</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: 320,
    width: '100%',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  closeIconButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.income,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.income,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  dismissButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  dismissButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});

export default SuccessFeedback;
