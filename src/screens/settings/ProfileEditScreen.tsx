import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  borderRadius,
  colors,
  headerTitleShadow,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme';
import { AppCard } from '../../components/common/AppCard';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { KeyboardDoneAccessory } from '../../components/common/KeyboardDoneAccessory';
import { UserInitialsAvatar } from '../../components/common/UserInitialsAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  formatCurrencyInput,
  numberToCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currency';
import {
  isValidEmail,
  formatPhoneInputMask,
  isValidBRPhone,
} from '../../utils/validators';
import { formatDateInputMask, isValidBRDate } from '../../utils/date';
import type { RootStackScreenProps } from '../../@types/navigation';

type Props = RootStackScreenProps<'ProfileEdit'>;

export const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const { user, updateUserProfile, resetPassword, updateMonthlyLimit } =
    useAuth();
  const { triggerSuccessFeedback } = useFinance();

  const [name, setName] = useState<string>(user?.name ?? 'Carlos Roberto');
  const [email, setEmail] = useState<string>(
    user?.email ?? 'carlos.roberto@email.com',
  );
  const [birthDate, setBirthDate] = useState<string>(user?.birthDate ?? '');
  const [phone, setPhone] = useState<string>(user?.phone ?? '');
  const [monthlyLimit, setMonthlyLimit] = useState<string>(
    user?.monthlyGlobalLimit
      ? numberToCurrencyInput(user.monthlyGlobalLimit)
      : '3.000,00',
  );
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setName((prev) => (prev ? prev : user.name));
      setEmail((prev) => (prev ? prev : user.email));
      setBirthDate((prev) => (prev ? prev : (user.birthDate ?? '')));
      setPhone((prev) => (prev ? prev : (user.phone ?? '')));
      if (user.monthlyGlobalLimit != null) {
        setMonthlyLimit((prev) =>
          prev ? prev : numberToCurrencyInput(user.monthlyGlobalLimit),
        );
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setErrorMessage(null);
    setSuccessBanner(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanBirthDate = birthDate.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setErrorMessage('Informe seu nome completo (mínimo 2 caracteres).');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Informe um endereço de e-mail válido.');
      return;
    }

    if (cleanBirthDate.length > 0 && !isValidBRDate(cleanBirthDate)) {
      setErrorMessage(
        'Informe uma data de nascimento válida no formato DD/MM/AAAA.',
      );
      return;
    }

    if (cleanPhone.length > 0 && !isValidBRPhone(cleanPhone)) {
      setErrorMessage(
        'Informe um telefone válido com DDD (ex: (11) 98765-4321).',
      );
      return;
    }

    const parsedLimit = parseCurrencyInput(monthlyLimit);
    if (parsedLimit <= 0) {
      setErrorMessage(
        'Informe um limite máximo de gastos mensais válido maior que R$ 0,00.',
      );
      return;
    }

    if (newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('A confirmação de senha não coincide com a nova senha.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const profileResult = await updateUserProfile({
        name: cleanName,
        email: cleanEmail,
        birthDate: cleanBirthDate || null,
        phone: cleanPhone || null,
      });

      if (!profileResult.success) {
        setErrorMessage(
          profileResult.error ?? 'Não foi possível atualizar os dados.',
        );
        return;
      }

      const limitResult = await updateMonthlyLimit(parsedLimit);
      if (!limitResult.success) {
        setErrorMessage(
          limitResult.error ?? 'Não foi possível atualizar o limite mensal.',
        );
        return;
      }

      if (newPassword.trim().length >= 6) {
        const passResult = await resetPassword(cleanEmail, newPassword.trim());
        if (!passResult.success) {
          setErrorMessage(
            passResult.error ?? 'Erro ao atualizar a senha no banco de dados.',
          );
          return;
        }
        setNewPassword('');
        setConfirmPassword('');
      }

      setSuccessBanner(true);
      triggerSuccessFeedback('Dados cadastrais atualizados com sucesso!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screenRoot, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cabeçalho Ciano Compacto (Heurística 3 e 8) ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: themeColors.headerBg,
              paddingTop: Math.max(insets.top, 20) + 12,
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a tela anterior"
              style={styles.backBtn}
            >
              <Feather
                name="arrow-left"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Dados Cadastrais</Text>
            </View>
            <UserInitialsAvatar
              name={name}
              size={42}
              tone="header"
            />
          </View>
        </View>

        <View style={styles.body}>
          {/* Banner de Sucesso */}
          {successBanner ? (
            <View
              style={[
                styles.successBanner,
                {
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : themeColors.incomeBg,
                  borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : '#86EFAC',
                },
              ]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Feather name="check-circle" size={18} color={themeColors.income} />
              <Text style={[styles.successBannerText, { color: themeColors.income }]}>
                Dados cadastrais atualizados com sucesso!
              </Text>
            </View>
          ) : null}

          {/* Banner de Erro */}
          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : themeColors.expenseBg,
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                },
              ]}
              accessibilityRole="alert"
            >
              <Feather
                name="alert-triangle"
                size={18}
                color={themeColors.expense}
              />
              <Text style={[styles.errorBannerText, { color: themeColors.expense }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* ── 1. Dados da Conta ── */}
          <AppCard>
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Dados da Conta</Text>

            <View style={styles.formGap}>
              <AppInput
                label="Nome completo"
                value={name}
                onChangeText={(txt) => {
                  setName(txt);
                  if (successBanner) setSuccessBanner(false);
                }}
                leftIcon="user"
                placeholder="Seu nome completo"
              />

              <AppInput
                label="E-mail"
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (successBanner) setSuccessBanner(false);
                }}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu.email@exemplo.com"
              />

              <AppInput
                label="Data de nascimento"
                value={birthDate}
                onChangeText={(txt) => {
                  setBirthDate(formatDateInputMask(txt));
                  if (successBanner) setSuccessBanner(false);
                }}
                leftIcon="calendar"
                keyboardType="numeric"
                maxLength={10}
                placeholder="DD/MM/AAAA"
              />

              <AppInput
                label="Telefone / Celular"
                value={phone}
                onChangeText={(txt) => {
                  setPhone(formatPhoneInputMask(txt));
                  if (successBanner) setSuccessBanner(false);
                }}
                leftIcon="phone"
                keyboardType="phone-pad"
                maxLength={15}
                placeholder="(11) 98765-4321"
              />
            </View>
          </AppCard>

          {/* ── 2. Orçamento Mensal ── */}
          <AppCard>
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Orçamento Mensal</Text>

            <View style={styles.formGap}>
              <AppInput
                label="Limite máximo de gastos mensais"
                value={monthlyLimit}
                onChangeText={(txt) => {
                  setMonthlyLimit(formatCurrencyInput(txt));
                  if (successBanner) setSuccessBanner(false);
                }}
                leftIcon="sliders"
                prefixText="R$"
                keyboardType="numeric"
                placeholder="0,00"
              />
            </View>
          </AppCard>

          {/* ── 3. Alterar Senha (Opcional) ── */}
          <AppCard>
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Alterar Senha</Text>

            <View style={styles.formGap}>
              <AppInput
                label="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                leftIcon="lock"
                isPassword
                placeholder="Mínimo de 6 caracteres"
              />

              <AppInput
                label="Confirmar nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIcon="check-circle"
                isPassword
                placeholder="Repita a nova senha"
              />
            </View>
          </AppCard>

          {/* ── Botões de Ação ── */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Voltar"
                variant="outline"
                onPress={() => navigation.goBack()}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <AppButton
                title="Salvar Alterações"
                tone="accent"
                leftIcon="check"
                loading={isSaving}
                onPress={() => void handleSaveProfile()}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <KeyboardDoneAccessory />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    ...headerTitleShadow,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.incomeBg,
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  successBannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.income,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.expenseBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  formGap: {
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
