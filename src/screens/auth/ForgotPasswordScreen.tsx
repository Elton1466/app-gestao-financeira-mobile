import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  borderRadius,
  colors,
  headerTitleShadow,
  MIN_TOUCH_TARGET,
  radius,
  spacing,
  typography,
} from '../../theme';
import { AppCard } from '../../components/common/AppCard';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  isRequired,
  validateEmailField,
  validatePasswordField,
} from '../../utils/validators';
import type { AuthStackScreenProps } from '../../@types/navigation';

type Props = AuthStackScreenProps<'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();
  const { colors: themeColors, isDark } = useTheme();

  const [email, setEmail] = useState<string>(route.params?.initialEmail ?? '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [newPasswordError, setNewPasswordError] = useState<string | undefined>(
    undefined,
  );
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >(undefined);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    setGeneralError(null);

    const eErr = validateEmailField(email);
    const pErr = validatePasswordField(newPassword, 6);
    const cErr = !isRequired(confirmPassword)
      ? 'Confirme a sua nova senha.'
      : confirmPassword.trim() !== newPassword.trim()
        ? 'As senhas informadas não coincidem.'
        : undefined;

    setEmailError(eErr);
    setNewPasswordError(pErr);
    setConfirmPasswordError(cErr);

    if (eErr || pErr || cErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(email, newPassword);
      if (!result.success) {
        setGeneralError(
          result.error ?? 'Não foi possível redefinir a senha para este e-mail.',
        );
        return;
      }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      edges={['bottom']}
    >
      {/* ── Cabeçalho Ciano Global (Heurística 8 — Conforto Visual) ── */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: themeColors.headerBg,
            paddingTop: Math.max(insets.top, 16) + 12,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela de login"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.textInverse} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarSubtitle}>nexo • Controle Financeiro Pessoal</Text>
          <Text style={styles.topBarTitle}>Redefinição de Senha</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: themeColors.background }]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!submitted ? (
            <AppCard style={styles.formCard}>
              <Text style={[styles.leadText, { color: themeColors.textSecondary }]}>
                Informe o seu e-mail cadastrado e defina diretamente a sua nova
                senha de acesso.
              </Text>

              {generalError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.18)'
                        : themeColors.expenseBg,
                      borderColor: isDark
                        ? 'rgba(239, 68, 68, 0.3)'
                        : themeColors.expense,
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
                  <Text
                    style={[
                      styles.errorBannerText,
                      { color: themeColors.expense },
                    ]}
                  >
                    {generalError}
                  </Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <AppInput
                  label="E-mail cadastrado"
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
                  label="Nova senha"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) setNewPasswordError(undefined);
                    if (generalError) setGeneralError(null);
                  }}
                  isPassword
                  autoCapitalize="none"
                  leftIcon="lock"
                  errorMessage={newPasswordError}
                />

                <AppInput
                  label="Confirmar nova senha"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError)
                      setConfirmPasswordError(undefined);
                    if (generalError) setGeneralError(null);
                  }}
                  isPassword
                  autoCapitalize="none"
                  leftIcon="check-circle"
                  errorMessage={confirmPasswordError}
                />

                <View style={styles.submitButtonWrapper}>
                  <AppButton
                    title="Redefinir Senha"
                    tone="accent"
                    loading={isSubmitting}
                    onPress={() => void handleSubmit()}
                    accessibilityLabel="Redefinir Senha"
                  />
                </View>
              </View>
            </AppCard>
          ) : (
            /* ── Estado de Sucesso ── */
            <AppCard style={styles.successContainer}>
              <View
                style={[
                  styles.successIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(34, 197, 94, 0.18)'
                      : themeColors.incomeBg,
                  },
                ]}
              >
                <Feather
                  name="check-circle"
                  size={40}
                  color={themeColors.income}
                />
              </View>
              <Text style={[styles.successTitle, { color: themeColors.textPrimary }]}>
                Senha redefinida!
              </Text>
              <Text style={[styles.successMessage, { color: themeColors.textSecondary }]}>
                Senha redefinida com sucesso! Você já pode entrar com sua nova senha.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Voltar para o Login"
                style={({ pressed }) => [
                  styles.backToLoginButton,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={[styles.backToLoginText, { color: themeColors.accent }]}>
                  Voltar para o Login
                </Text>
              </Pressable>
            </AppCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.headerBg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  backButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  topBarSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  topBarTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    ...headerTitleShadow,
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
  formCard: {
    padding: spacing.lg,
  },
  leadText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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
  submitButtonWrapper: {
    paddingTop: spacing.sm,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.incomeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backToLoginButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backToLoginText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

export default ForgotPasswordScreen;
