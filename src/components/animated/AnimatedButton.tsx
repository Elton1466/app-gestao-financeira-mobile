import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
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
import { FeatherIconName } from '../../constants/categories';
import ThemeContext from '../../contexts/ThemeContext';

export type AnimatedButtonVariant = 'primary' | 'danger' | 'outline' | 'ghost';
export type AnimatedButtonTone = 'accent' | 'primary' | 'navy' | 'teal' | 'blue' | 'green';

export interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: AnimatedButtonVariant;
  tone?: AnimatedButtonTone;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Botão com microinteração refinada usando React Native Reanimated.
 *
 * - Duração ágil (120–180 ms).
 * - Leve transição de escala (0.97) e opacidade sem rebotes exagerados.
 * - Desativação imediata da escala quando Movimento Reduzido estiver ativo.
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  variant = 'primary',
  tone = 'accent',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  style,
  textStyle,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors ?? defaultColors;
  const isDark = themeContext?.isDark ?? false;

  const isReducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const isDisabled = disabled || loading;

  const handlePressIn: PressableProps['onPressIn'] = (e) => {
    if (!isDisabled) {
      if (!isReducedMotion) {
        scale.value = withTiming(motion.scale.pressedButton, {
          duration: motion.duration.fast,
          easing: motion.easing.standard,
        });
      }
      opacity.value = withTiming(0.9, {
        duration: motion.duration.fast,
        easing: motion.easing.standard,
      });
    }
    onPressIn?.(e);
  };

  const handlePressOut: PressableProps['onPressOut'] = (e) => {
    if (!isDisabled) {
      if (!isReducedMotion) {
        scale.value = withTiming(1, {
          duration: motion.duration.fast,
          easing: motion.easing.standard,
        });
      }
      opacity.value = withTiming(1, {
        duration: motion.duration.fast,
        easing: motion.easing.standard,
      });
    }
    onPressOut?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: isDisabled ? 0.5 : opacity.value,
    };
  });

  const getPrimaryBgColor = (): string => {
    if (tone === 'navy' || tone === 'primary') return colors.primary;
    if (tone === 'green') return colors.income;
    return colors.accent;
  };

  const getContainerVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: colors.expense,
          borderColor: colors.expense,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor:
            tone === 'navy' || tone === 'primary'
              ? (isDark ? colors.accent : colors.primary)
              : colors.borderLight,
          borderWidth: 1.5,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'primary':
      default:
        return {
          backgroundColor: getPrimaryBgColor(),
          borderColor: getPrimaryBgColor(),
          borderWidth: 1,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'danger') {
      return '#FFFFFF';
    }
    if (variant === 'primary') {
      if (isDark) {
        if (tone === 'green') return '#FFFFFF';
        return '#081F4D';
      }
      return colors.textInverse;
    }
    if (variant === 'outline') {
      if (tone === 'navy' || tone === 'primary') return isDark ? colors.accent : colors.primary;
      if (tone === 'accent' || tone === 'teal' || tone === 'blue') return colors.accent;
      return colors.textPrimary;
    }
    return colors.textSecondary;
  };

  const textColor = getTextColor();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        getContainerVariantStyle(),
        animatedStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? (
            <Feather
              name={leftIcon}
              size={18}
              color={textColor}
              style={styles.leftIcon}
            />
          ) : null}
          <Text style={[styles.text, { color: textColor }, textStyle]}>
            {title}
          </Text>
          {rightIcon ? (
            <Feather
              name={rightIcon}
              size={18}
              color={textColor}
              style={styles.rightIcon}
            />
          ) : null}
        </View>
      )}
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
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
});

export default AnimatedButton;
