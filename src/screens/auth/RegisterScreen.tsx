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
import { KeyboardDoneAccessory } from '../../components/common/KeyboardDoneAccessory';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  isRequired,
  validateEmailField,
  validatePasswordField,
  formatPhoneInputMask,
  isValidBRPhone,
} from '../../utils/validators';
import { formatDateInputMask, isValidBRDate } from '../../utils/date';
import type { AuthStackScreenProps } from '../../@types/navigation';

type Props = AuthStackScreenProps<'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { colors: themeColors, isDark } = useTheme();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [birthDateError, setBirthDateError] = useState<string | undefined>(
    undefined,
  );
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >(undefined);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRegister = async (): Promise<void> => {
    setGeneralError(null);

    const nErr = !isRequired(name)
      ? 'Informe o seu nome completo.'
      : name.trim().length < 2
        ? 'O nome deve ter pelo menos 2 caracteres.'
        : undefined;
    const eErr = validateEmailField(email);
    const bErr = !isRequired(birthDate)
      ? 'Informe a sua data de nascimento.'
      : !isValidBRDate(birthDate)
        ? 'Informe uma data válida no formato DD/MM/AAAA.'
        : undefined;
    const phErr = !isRequired(phone)
      ? 'Informe o seu telefone/celular.'
      : !isValidBRPhone(phone)
        ? 'Informe um telefone válido com DDD (ex: (11) 98765-4321).'
        : undefined;
    const pErr = validatePasswordField(password, 6);
    const cErr = !isRequired(confirmPassword)
      ? 'Confirme a sua senha.'
      : confirmPassword.trim() !== password.trim()
        ? 'As senhas informadas não coincidem.'
        : undefined;

    setNameError(nErr);
    setEmailError(eErr);
    setBirthDateError(bErr);
    setPhoneError(phErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cErr);

    if (nErr || eErr || bErr || phErr || pErr || cErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(
        name.trim(),
        email.trim().toLowerCase(),
        password.trim(),
        birthDate.trim(),
        phone.trim(),
      );
      if (!result.success) {
        setGeneralError(
          result.error ?? 'Não foi possível criar a sua conta.',
        );
      }
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
          <Text style={styles.topBarTitle}>Criar Conta</Text>
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
          <AppCard style={styles.formCard}>
            <Text style={[styles.leadText, { color: themeColors.textSecondary }]}>
              Preencha os dados abaixo para começar a organizar sua vida
              financeira.
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
                label="Nome completo"
                placeholder="Ex: Lucas Silva"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError(undefined);
                  if (generalError) setGeneralError(null);
                }}
                autoCapitalize="words"
                leftIcon="user"
                errorMessage={nameError}
              />

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
                label="Data de nascimento"
                placeholder="DD/MM/AAAA"
                value={birthDate}
                onChangeText={(text) => {
                  setBirthDate(formatDateInputMask(text));
                  if (birthDateError) setBirthDateError(undefined);
                  if (generalError) setGeneralError(null);
                }}
                keyboardType="numeric"
                maxLength={10}
                leftIcon="calendar"
                errorMessage={birthDateError}
              />

              <AppInput
                label="Telefone / Celular"
                placeholder="(11) 98765-4321"
                value={phone}
                onChangeText={(text) => {
                  setPhone(formatPhoneInputMask(text));
                  if (phoneError) setPhoneError(undefined);
                  if (generalError) setGeneralError(null);
                }}
                keyboardType="phone-pad"
                maxLength={15}
                leftIcon="phone"
                errorMessage={phoneError}
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

              <AppInput
                label="Confirmar senha"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError(undefined);
                  if (generalError) setGeneralError(null);
                }}
                isPassword
                autoCapitalize="none"
                leftIcon="check-circle"
                errorMessage={confirmPasswordError}
              />

              <View style={styles.submitButtonWrapper}>
                <AppButton
                  title="Criar conta"
                  tone="accent"
                  loading={isSubmitting}
                  onPress={() => void handleRegister()}
                  accessibilityLabel="Criar conta"
                />
              </View>
            </View>
          </AppCard>

          {/* ── Fazer Login ── */}
          <View style={styles.loginFooter}>
            <Text style={[styles.loginPrompt, { color: themeColors.textSecondary }]}>
              Já tem uma conta?{' '}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="link"
              accessibilityLabel="Fazer login"
              hitSlop={8}
            >
              <Text style={[styles.loginLink, { color: themeColors.accent }]}>Entrar</Text>
            </Pressable>
          </View>
        </ScrollView>
        <KeyboardDoneAccessory />
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
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginPrompt: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  loginLink: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

export default RegisterScreen;
