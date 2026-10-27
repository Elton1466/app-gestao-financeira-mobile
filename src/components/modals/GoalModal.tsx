import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { KeyboardDoneAccessory } from '../common/KeyboardDoneAccessory';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  formatCurrency,
  formatCurrencyInput,
  numberToCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currency';
import {
  formatDateInputMask,
  isoToBRDate,
  brDateToISO,
  isValidBRDate,
} from '../../utils/date';
import type { FinancialGoal } from '../../models';
import type { FeatherIconName } from '../../constants/categories';

export interface GoalIconPreset {
  key: string;
  iconName: FeatherIconName;
  label: string;
  color: string;
  bgColor: string;
}

export const GOAL_ICON_PRESETS: readonly GoalIconPreset[] = [
  {
    key: 'shield',
    iconName: 'shield',
    label: 'Reserva',
    color: '#009FE3',
    bgColor: '#E0F4FC',
  },
  {
    key: 'send',
    iconName: 'send',
    label: 'Viagem',
    color: '#6366F1',
    bgColor: '#EEF2FF',
  },
  {
    key: 'monitor',
    iconName: 'monitor',
    label: 'Tecnologia',
    color: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    key: 'target',
    iconName: 'target',
    label: 'Meta',
    color: '#EC4899',
    bgColor: '#FDF2F8',
  },
  {
    key: 'book',
    iconName: 'book',
    label: 'Educação',
    color: '#16A34A',
    bgColor: '#F0FDF4',
  },
  {
    key: 'star',
    iconName: 'star',
    label: 'Outro',
    color: '#FDB913',
    bgColor: '#FEF8E7',
  },
];

export function getGoalPresetByIcon(iconKey: string): GoalIconPreset {
  const found = GOAL_ICON_PRESETS.find((item) => item.key === iconKey);
  return found ?? GOAL_ICON_PRESETS[0];
}

export interface GoalModalProps {
  visible: boolean;
  editingGoal: FinancialGoal | null;
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  visible,
  editingGoal,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { addGoal, updateGoal, addGoalContribution, deleteGoal } =
    useFinance();

  const isEditing = Boolean(editingGoal);

  const [title, setTitle] = useState<string>('');
  const [targetInput, setTargetInput] = useState<string>('');
  const [currentInput, setCurrentInput] = useState<string>('');
  const [contributionInput, setContributionInput] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [selectedIconKey, setSelectedIconKey] = useState<string>('shield');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] =
    useState<boolean>(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setErrorMsg(null);
    setContributionInput('');
    setConfirmDeleteVisible(false);

    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetInput(numberToCurrencyInput(editingGoal.targetAmount));
      setCurrentInput(numberToCurrencyInput(editingGoal.currentAmount));
      setDeadline(isoToBRDate(editingGoal.deadline));
      const matchingPreset = GOAL_ICON_PRESETS.find(
        (p) => p.key === editingGoal.icon || p.iconName === editingGoal.icon,
      );
      setSelectedIconKey(matchingPreset ? matchingPreset.key : 'shield');
    } else {
      setTitle('');
      setTargetInput('');
      setCurrentInput('');
      setDeadline('');
      setSelectedIconKey('target');
    }
  }, [visible, editingGoal]);

  const handleSaveGoal = async (): Promise<void> => {
    setErrorMsg(null);
    const trimmedTitle = title.trim();
    const targetVal = parseCurrencyInput(targetInput);
    const currentVal = currentInput.trim()
      ? parseCurrencyInput(currentInput)
      : 0;

    if (!trimmedTitle) {
      setErrorMsg('Informe o nome da meta financeira.');
      return;
    }

    if (targetVal <= 0) {
      setErrorMsg('Informe um valor alvo maior que R$ 0,00.');
      return;
    }

    if (currentVal < 0) {
      setErrorMsg('O valor acumulado não pode ser negativo.');
      return;
    }

    let isoDeadline: string | null | undefined = undefined;
    const trimmedDeadline = deadline.trim();
    if (trimmedDeadline) {
      if (!isValidBRDate(trimmedDeadline)) {
        setErrorMsg('Informe uma data limite válida no formato DD/MM/AAAA.');
        return;
      }
      isoDeadline = brDateToISO(trimmedDeadline);
    }

    const preset = getGoalPresetByIcon(selectedIconKey);

    setIsSaving(true);
    try {
      if (isEditing && editingGoal) {
        await updateGoal(editingGoal.id, {
          title: trimmedTitle,
          targetAmount: targetVal,
          currentAmount: currentVal,
          icon: preset.key,
          color: preset.color,
          deadline: isoDeadline ?? null,
        });
      } else {
        await addGoal({
          title: trimmedTitle,
          targetAmount: targetVal,
          currentAmount: currentVal,
          icon: preset.key,
          color: preset.color,
          deadline: isoDeadline ?? undefined,
          isDemoData: false,
        });
      }
      onClose();
    } catch (err) {
      console.error('[GoalModal] Erro ao salvar meta:', err);
      setErrorMsg('Não foi possível salvar a meta financeira.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContribution = async (): Promise<void> => {
    if (!editingGoal) {
      return;
    }
    setErrorMsg(null);
    const contributionAmount = parseCurrencyInput(contributionInput);
    if (contributionAmount <= 0) {
      setErrorMsg('Informe um valor de aporte maior que R$ 0,00.');
      return;
    }

    setIsSaving(true);
    try {
      await addGoalContribution(editingGoal.id, contributionAmount);
      onClose();
    } catch (err) {
      console.error('[GoalModal] Erro ao adicionar aporte:', err);
      setErrorMsg('Não foi possível registrar o aporte na meta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!editingGoal) {
      return;
    }
    setConfirmDeleteVisible(false);
    setIsSaving(true);
    try {
      await deleteGoal(editingGoal.id);
      onClose();
    } catch (err) {
      console.error('[GoalModal] Erro ao excluir meta:', err);
      setErrorMsg('Não foi possível excluir a meta.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropTouchable}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar modal de meta"
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {isEditing ? 'Editar Meta Financeira' : 'Nova Meta'}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── Seção Rápida de Aporte quando em Modo de Edição ── */}
              {isEditing && editingGoal ? (
                <View
                  style={[
                    styles.contributionBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0, 159, 227, 0.15)'
                        : colors.primaryLight,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.contributionTitle,
                      { color: isDark ? colors.accent : colors.primary },
                    ]}
                  >
                    Adicionar Aporte Rápido
                  </Text>
                  <Text style={[styles.contributionSub, { color: colors.textSecondary }]}>
                    Saldo atual na meta:{' '}
                    {formatCurrency(editingGoal.currentAmount)} de{' '}
                    {formatCurrency(editingGoal.targetAmount)}
                  </Text>
                  <View style={styles.contributionRow}>
                    <View style={styles.contributionInputWrap}>
                      <AppInput
                        placeholder="0,00"
                        value={contributionInput}
                        onChangeText={(txt) =>
                          setContributionInput(formatCurrencyInput(txt))
                        }
                        keyboardType="numeric"
                        prefixText="R$"
                      />
                    </View>
                    <AppButton
                      title="+ Aportar"
                      tone="accent"
                      fullWidth={false}
                      loading={isSaving}
                      onPress={() => void handleAddContribution()}
                    />
                  </View>
                </View>
              ) : null}

              {/* ── Seletor de Ícone ── */}
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Ícone
              </Text>
              <View style={styles.iconGrid}>
                {GOAL_ICON_PRESETS.map((preset) => {
                  const selected = selectedIconKey === preset.key;
                  return (
                    <Pressable
                      key={preset.key}
                      onPress={() => setSelectedIconKey(preset.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Ícone ${preset.label}`}
                      style={[
                        styles.iconOption,
                        { backgroundColor: colors.surfaceSubtle },
                        selected && {
                          backgroundColor: isDark
                            ? `${preset.color}25`
                            : preset.bgColor,
                          borderColor: preset.color,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor: isDark
                              ? `${preset.color}20`
                              : preset.bgColor,
                          },
                        ]}
                      >
                        <Feather
                          name={preset.iconName}
                          size={16}
                          color={preset.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.iconOptionLabel,
                          {
                            color: selected
                              ? (isDark ? '#FFFFFF' : preset.color)
                              : colors.textSecondary,
                            fontWeight: selected
                              ? typography.fontWeight.bold
                              : typography.fontWeight.medium,
                          },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ── Campos da Meta ── */}
              <View style={styles.form}>
                <AppInput
                  label="Nome da meta"
                  placeholder="Ex: Reserva de emergência"
                  value={title}
                  onChangeText={setTitle}
                />

                <View style={styles.twoColumns}>
                  <View style={styles.col}>
                    <AppInput
                      label="Valor alvo (R$)"
                      placeholder="0,00"
                      value={targetInput}
                      onChangeText={(txt) =>
                        setTargetInput(formatCurrencyInput(txt))
                      }
                      keyboardType="numeric"
                      prefixText="R$"
                    />
                  </View>
                  <View style={styles.col}>
                    <AppInput
                      label="Já guardei (R$)"
                      placeholder="0,00"
                      value={currentInput}
                      onChangeText={(txt) =>
                        setCurrentInput(formatCurrencyInput(txt))
                      }
                      keyboardType="numeric"
                      prefixText="R$"
                    />
                  </View>
                </View>

                <AppInput
                  label="Prazo / Data limite (opcional)"
                  placeholder="Ex: 31/12/2026"
                  value={deadline}
                  onChangeText={(txt) => setDeadline(formatDateInputMask(txt))}
                  keyboardType="numeric"
                  maxLength={10}
                  leftIcon="calendar"
                />

                {errorMsg ? (
                  <View style={styles.errorBanner} accessibilityRole="alert">
                    <Feather
                      name="alert-circle"
                      size={16}
                      color={colors.expense}
                    />
                    <Text style={[styles.errorText, { color: colors.expense }]}>{errorMsg}</Text>
                  </View>
                ) : null}

                <AppButton
                  title={isEditing ? 'Salvar Alterações' : 'Criar Meta'}
                  tone="accent"
                  loading={isSaving}
                  onPress={() => void handleSaveGoal()}
                />

                {isEditing ? (
                  <AppButton
                    title="Excluir Meta"
                    variant="danger"
                    leftIcon="trash-2"
                    onPress={() => setConfirmDeleteVisible(true)}
                  />
                ) : null}

                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={onClose}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Excluir meta financeira?"
        description="Esta ação removerá a meta permanentemente do seu planejamento."
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmDeleteVisible(false)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <KeyboardDoneAccessory />
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  contributionBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  contributionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  contributionSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contributionInputWrap: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconOption: {
    minWidth: 74,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.expenseBg,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.expenseDark,
  },
});

export default GoalModal;
