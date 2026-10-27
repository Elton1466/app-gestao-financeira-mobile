import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import {
  borderRadius,
  colors as defaultColors,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme';
import { motion, useReducedMotionPreference } from '../../theme/motion';
import ThemeContext from '../../contexts/ThemeContext';

export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OperationFeedbackProps {
  status: OperationStatus;
  idleTitle?: string;
  loadingTitle?: string;
  successTitle?: string;
  errorTitle?: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Componente de botão com feedback de operação em 4 estados:
 * 1. idle (pronto para envio)
 * 2. loading (spinner e bloqueio de cliques duplos)
 * 3. success (ícone de check e cor verde de confirmação pós-gravação real no SQLite)
 * 4. error (ícone de alerta e cor vermelha de erro preservando os dados)
 *
 * Transições suaves de 150 a 250 ms com Reanimated.
 */
export const OperationFeedback: React.FC<OperationFeedbackProps> = ({
  status,
  idleTitle = 'Salvar',
  loadingTitle = 'Salvando...',
  successTitle = 'Salvo com sucesso!',
  errorTitle = 'Erro ao processar',
  onPress,
  disabled = false,
  fullWidth = true,
  style,
}) => {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors ?? defaultColors;
  const isDark = themeContext?.isDark ?? false;

  const isReducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(1);

  const isBusy = status === 'loading' || status === 'success';
  const isButtonDisabled = disabled || isBusy;

  const handlePressIn = () => {
    if (!isButtonDisabled && !isReducedMotion) {
      scale.value = withTiming(motion.scale.pressedButton, {
        duration: motion.duration.fast,
        easing: motion.easing.standard,
      });
    }
  };

  const handlePressOut = () => {
    if (!isButtonDisabled && !isReducedMotion) {
      scale.value = withTiming(1, {
        duration: motion.duration.fast,
        easing: motion.easing.standard,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getBackgroundColor = (): string => {
    switch (status) {
      case 'success':
        return colors.income;
      case 'error':
        return colors.expense;
      case 'loading':
      case 'idle':
      default:
        return colors.accent;
    }
  };

  const getContentColor = (): string => {
    switch (status) {
      case 'error':
        return '#FFFFFF';
      case 'success':
        return isDark ? '#081F4D' : '#FFFFFF';
      case 'loading':
      case 'idle':
      default:
        return isDark ? '#081F4D' : '#FFFFFF';
    }
  };

  const contentColor = getContentColor();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={
        status === 'loading'
          ? loadingTitle
          : status === 'success'
          ? successTitle
          : status === 'error'
          ? errorTitle
          : idleTitle
      }
      accessibilityState={{ disabled: isButtonDisabled, busy: status === 'loading' }}
      disabled={isButtonDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: getBackgroundColor() },
        isButtonDisabled && status === 'idle' && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {status === 'loading' ? (
          <>
            <ActivityIndicator
              size="small"
              color={contentColor}
              style={styles.iconMargin}
            />
            <Text style={[styles.text, { color: contentColor }]}>{loadingTitle}</Text>
          </>
        ) : status === 'success' ? (
          <>
            <Feather
              name="check"
              size={18}
              color={contentColor}
              style={styles.iconMargin}
            />
            <Text style={[styles.text, { color: contentColor }]}>{successTitle}</Text>
          </>
        ) : status === 'error' ? (
          <>
            <Feather
              name="alert-triangle"
              size={18}
              color={contentColor}
              style={styles.iconMargin}
            />
            <Text style={[styles.text, { color: contentColor }]}>{errorTitle}</Text>
          </>
        ) : (
          <Text style={[styles.text, { color: contentColor }]}>{idleTitle}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: defaultColors.textInverse,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default OperationFeedback;
