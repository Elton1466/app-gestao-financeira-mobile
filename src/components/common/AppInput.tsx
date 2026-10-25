import React, { useContext, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  borderRadius,
  colors as defaultColors,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme';
import { FeatherIconName } from '../../constants/categories';
import ThemeContext from '../../contexts/ThemeContext';
import { KEYBOARD_DISMISS_ACCESSORY_ID } from './KeyboardDoneAccessory';

const colors = defaultColors;

export interface AppInputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  leftIcon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  isPassword?: boolean;
  prefixText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AppInput({
  label,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  isPassword = false,
  prefixText,
  containerStyle,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  ...rest
}: AppInputProps): React.JSX.Element {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors ?? defaultColors;
  const isDark = themeContext?.isDark ?? false;

  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasError = Boolean(errorMessage);

  const effectiveRightIcon: FeatherIconName | undefined = isPassword
    ? passwordVisible
      ? 'eye-off'
      : 'eye'
    : rightIcon;

  const effectiveOnRightIconPress = isPassword
    ? () => setPasswordVisible((prev) => !prev)
    : onRightIconPress;

  const effectiveRightIconLabel = isPassword
    ? passwordVisible
      ? 'Ocultar senha'
      : 'Mostrar senha'
    : rightIconAccessibilityLabel;

  const effectiveSecureTextEntry = isPassword
    ? !passwordVisible
    : secureTextEntry;

  const isNumericOrDateKeyboard =
    rest.keyboardType === 'numeric' ||
    rest.keyboardType === 'decimal-pad' ||
    rest.keyboardType === 'number-pad' ||
    rest.keyboardType === 'phone-pad';

  const effectiveInputAccessoryViewID =
    rest.inputAccessoryViewID ??
    (isNumericOrDateKeyboard ? KEYBOARD_DISMISS_ACCESSORY_ID : undefined);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: hasError
              ? colors.expense
              : isFocused
              ? colors.accent
              : colors.borderLight,
          },
          isFocused && {
            borderWidth: 2,
            backgroundColor: colors.surface,
          },
          hasError && styles.inputWrapperError,
        ]}
      >
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={18}
            color={isFocused ? colors.accent : colors.textSecondary}
            style={styles.leftIcon}
          />
        ) : null}

        {prefixText ? (
          <Text style={[styles.prefixText, { color: colors.textSecondary }]}>{prefixText}</Text>
        ) : null}

        <TextInput
          placeholderTextColor={rest.placeholderTextColor ?? colors.textPlaceholder}
          style={[styles.input, { color: colors.textPrimary }, style]}
          secureTextEntry={effectiveSecureTextEntry}
          inputAccessoryViewID={effectiveInputAccessoryViewID}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {effectiveRightIcon ? (
          <Pressable
            onPress={effectiveOnRightIconPress}
            disabled={!effectiveOnRightIconPress}
            accessibilityRole={effectiveOnRightIconPress ? 'button' : 'image'}
            accessibilityLabel={effectiveRightIconLabel}
            hitSlop={8}
            style={styles.rightIconButton}
          >
            <Feather
              name={effectiveRightIcon}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow}>
          <Feather
            name="alert-circle"
            size={14}
            color={colors.expense}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorText, { color: colors.expense }]}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 4,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  inputWrapperError: {
    borderColor: colors.expense,
    borderWidth: 1.5,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  prefixText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
  },
  rightIconButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errorIcon: {
    marginRight: spacing.xs,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.expense,
  },
});

export default AppInput;
