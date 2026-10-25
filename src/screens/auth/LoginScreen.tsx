import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  borderRadius,
  colors,
  motion,
  radius,
  RECOMMENDED_TOUCH_TARGET,
  spacing,
  typography,
  useReducedMotionPreference,
} from '../../theme';
import { AppCard } from '../../components/common/AppCard';
import { AppInput } from '../../components/common/AppInput';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  validateEmailField,
  validatePasswordField,
} from '../../utils/validators';
import { NexoLogo } from '../../components/common/NexoLogo';
import type { AuthStackScreenProps } from '../../@types/navigation';

type Props = AuthStackScreenProps<'Login'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { colors: themeColors, isDark } = useTheme();
  const isReducedMotion = useReducedMotionPreference();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Micro-interação 1: Logotipo Reativo ao Toque (Spring Scale Effect) ──
  const logoScale = useSharedValue(1);

  const handleLogoPressIn = () => {
    if (!isReducedMotion) {
      logoScale.value = withSpring(0.95, {
        damping: 14,
        stiffness: 220,
      });
    }
  };

  const handleLogoPressOut = () => {
    if (!isReducedMotion) {
      logoScale.value = withSpring(1, {
        damping: 14,
        stiffness: 220,
      });
    }
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  // ── Micro-interação 2: Loading Interativo no Botão Entrar ──
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const loaderOpacity = useSharedValue(0);
  const loaderScale = useSharedValue(0.7);

  useEffect(() => {
    if (isLoading) {
      if (!isReducedMotion) {
        buttonScale.value = withTiming(0.98, {
          duration: motion.duration.fast,
          easing: motion.easing.standard,
        });
      }
      textOpacity.value = withTiming(0, {
        duration: motion.duration.fast,
        easing: motion.easing.accelerate,
      });
      textTranslateY.value = withTiming(-6, {
        duration: motion.duration.fast,
        easing: motion.easing.accelerate,
      });
      loaderOpacity.value = withTiming(1, {
        duration: motion.duration.fast,
        easing: motion.easing.decelerate,
      });
      loaderScale.value = withSpring(1, {
        damping: 14,
        stiffness: 200,
      });
    } else {
      if (!isReducedMotion) {
        buttonScale.value = withTiming(1, {
          duration: motion.duration.fast,
          easing: motion.easing.standard,
        });
      }
      textOpacity.value = withTiming(1, {
        duration: motion.duration.fast,
        easing: motion.easing.decelerate,
      });
      textTranslateY.value = withTiming(0, {
        duration: motion.duration.fast,
        easing: motion.easing.decelerate,
      });
      loaderOpacity.value = withTiming(0, {
        duration: motion.duration.fast,
        easing: motion.easing.accelerate,
      });
      loaderScale.value = withTiming(0.7, {
        duration: motion.duration.fast,
      });
    }
  }, [isLoading, isReducedMotion]);

  const handleButtonPressIn = () => {
    if (!isLoading && !isReducedMotion) {
      buttonScale.value = withTiming(0.97, {
        duration: 100,
        easing: motion.easing.standard,
      });
      buttonOpacity.value = withTiming(0.92, { duration: 100 });
    }
  };

  const handleButtonPressOut = () => {
    if (!isLoading && !isReducedMotion) {
      buttonScale.value = withTiming(1, {
        duration: 140,
        easing: motion.easing.standard,
      });
      buttonOpacity.value = withTiming(1, { duration: 140 });
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const animatedLoaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
    transform: [{ scale: loaderScale.value }],
  }));

  const handleValidateAndSubmit = async (
    targetEmail: string,
    targetPassword: string,
  ): Promise<void> => {
    setGeneralError(null);

    const eErr = validateEmailField(targetEmail);
    const pErr = validatePasswordField(targetPassword, 6);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) {
      return;
    }

    setIsLoading(true);
    try {
      const [result] = await Promise.all([
        signIn(targetEmail, targetPassword),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
      if (!result.success) {
        setGeneralError(
          result.error ?? 'Não foi possível entrar. Verifique suas credenciais.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: themeColors.background }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 16,
              paddingBottom: Math.max(insets.bottom, 16) + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Identidade Oficial nexo ── */}
          <View style={styles.brandSection}>
            <View style={styles.logoWrapper}>
              <Pressable
                onPressIn={handleLogoPressIn}
                onPressOut={handleLogoPressOut}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel="Logotipo nexo — Controle Financeiro Pessoal"
                style={styles.logoPressable}
                hitSlop={8}
              >
                <Animated.View style={animatedLogoStyle}>
                  <NexoLogo
                    variant="full"
                    width={220}
                    height={60}
                    accessibilityLabel="Logotipo nexo — Controle Financeiro Pessoal"
                  />
                </Animated.View>
              </Pressable>
            </View>
            <Text style={[styles.brandTagline, { color: themeColors.textSecondary }]}>
              Controle Financeiro Pessoal
            </Text>
          </View>

          <AppCard style={styles.formCard}>
            <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>Acesse sua conta</Text>
            <Text style={[styles.leadText, { color: themeColors.textSecondary }]}>
              Entre para acompanhar suas receitas, despesas e metas financeiras.
            </Text>

            {/* ── Alerta de Erro Geral ── */}
            {generalError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : themeColors.expenseBg,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : themeColors.expense,
                  },
                ]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Feather
                  name="alert-circle"
                  size={18}
                  color={themeColors.expense}
                />
                <Text style={[styles.errorBannerText, { color: themeColors.expense }]}>{generalError}</Text>
              </View>
            ) : null}

            {/* ── Formulário de Login ── */}
            <View style={styles.form}>
              <AppInput
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(undefined);
                  if (generalError) setGeneralError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail"
                errorMessage={emailError}
              />

              <AppInput
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(undefined);
                  if (generalError) setGeneralError(null);
                }}
                isPassword
                autoCapitalize="none"
                leftIcon="lock"
                errorMessage={passwordError}
              />

              {/* ── Esqueci minha senha ── */}
              <View style={styles.forgotPasswordRow}>
                <Pressable
                  onPress={() =>
                    navigation.navigate('ForgotPassword', {
                      initialEmail: email.trim() || undefined,
                    })
                  }
                  accessibilityRole="link"
                  accessibilityLabel="Esqueci minha senha"
                  hitSlop={8}
                >
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      {
                        color: isDark
                          ? themeColors.primary
                          : themeColors.accent,
                      },
                    ]}
                  >
                    Esqueci minha senha
                  </Text>
                </Pressable>
              </View>

              {/* ── Botão Entrar com Micro-interações ── */}
              <View style={styles.submitButtonWrapper}>
                <AnimatedPressable
                  accessibilityRole="button"
                  accessibilityLabel={isLoading ? 'Entrando na sua conta...' : 'Entrar na conta'}
                  accessibilityState={{ disabled: isLoading, busy: isLoading }}
                  disabled={isLoading}
                  onPress={() => void handleValidateAndSubmit(email, password)}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: themeColors.accent,
                    },
                    animatedButtonStyle,
                  ]}
                >
                  {/* Indicador de carregamento com fade/scale in */}
                  <Animated.View
                    style={[styles.buttonLoaderWrapper, animatedLoaderStyle]}
                    pointerEvents="none"
                  >
                    <ActivityIndicator size="small" color="#081F4D" />
                  </Animated.View>

                  {/* Texto com fade out suave */}
                  <Animated.View
                    style={[styles.buttonTextWrapper, animatedTextStyle]}
                    pointerEvents="none"
                  >
                    <Text style={styles.submitButtonText}>Entrar</Text>
                  </Animated.View>
                </AnimatedPressable>
              </View>
            </View>
          </AppCard>

          {/* ── Link Criar Conta ── */}
          <View style={styles.registerFooter}>
            <Text style={[styles.registerPrompt, { color: themeColors.textSecondary }]}>Ainda não tem uma conta? </Text>
            <Pressable
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="link"
              accessibilityLabel="Criar conta"
              hitSlop={8}
            >
              <Text
                style={[
                  styles.registerLink,
                  {
                    color: isDark
                      ? themeColors.primary
                      : themeColors.accent,
                  },
                ]}
              >
                Criar conta
              </Text>
            </Pressable>
          </View>

          {/* ── Rodapé nexo ── */}
          <View style={styles.academicFooter}>
            <Text style={[styles.academicText, { color: themeColors.textPlaceholder }]}>
              nexo • Controle Financeiro Pessoal
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  logoWrapper: {
    width: '100%',
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullLogo: {
    width: 280,
    height: 60,
  },
  brandTagline: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  formCard: {
    padding: spacing.lg,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginBottom: spacing.xxs,
  },
  leadText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.expenseBg,
    borderWidth: 1,
    borderColor: colors.expense,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.expenseText,
  },
  form: {
    gap: spacing.lg,
  },
  forgotPasswordRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.accent,
  },
  submitButtonWrapper: {
    marginTop: spacing.xs,
  },
  submitButton: {
    width: '100%',
    minHeight: RECOMMENDED_TOUCH_TARGET,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  buttonLoaderWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: '#081F4D',
    textAlign: 'center',
  },
  registerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  registerPrompt: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  registerLink: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  academicFooter: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  academicText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
  },
});

export default LoginScreen;
