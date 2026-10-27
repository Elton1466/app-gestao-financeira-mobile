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
import { CATEGORIES, getCategoryById } from '../../constants/categories';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { KeyboardDoneAccessory } from '../common/KeyboardDoneAccessory';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  formatCurrency,
  formatCurrencyInput,
  numberToCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currency';
import type { CategoryId } from '../../models';

export interface BudgetModalProps {
  visible: boolean;
  initialCategoryId?: CategoryId | null;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = CATEGORIES.filter((cat) => cat.id !== 'receita');

export const BudgetModal: React.FC<BudgetModalProps> = ({
  visible,
  initialCategoryId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { expensesByCategory, upsertBudget } = useFinance();

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryId>('alimentacao');
  const [limitInput, setLimitInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setErrorMsg(null);

    const targetCat: CategoryId =
      initialCategoryId && initialCategoryId !== 'receita'
        ? initialCategoryId
        : 'alimentacao';

    setSelectedCategory(targetCat);
    const summary = expensesByCategory[targetCat];
    if (summary && summary.limit > 0) {
      setLimitInput(numberToCurrencyInput(summary.limit));
    } else {
      setLimitInput('');
    }
  }, [visible, initialCategoryId, expensesByCategory]);

  const handleSelectCategory = (catId: CategoryId) => {
    setSelectedCategory(catId);
    const summary = expensesByCategory[catId];
    if (summary && summary.limit > 0) {
      setLimitInput(numberToCurrencyInput(summary.limit));
    } else {
      setLimitInput('');
    }
    setErrorMsg(null);
  };

  const handleSaveBudget = async (): Promise<void> => {
    setErrorMsg(null);
    const parsedLimit = parseCurrencyInput(limitInput);

    if (parsedLimit <= 0) {
      setErrorMsg('Informe um limite mensal maior que R$ 0,00.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertBudget(selectedCategory, parsedLimit);
      onClose();
    } catch (err) {
      console.error('[BudgetModal] Erro ao salvar limite:', err);
      setErrorMsg('Não foi possível salvar o limite de orçamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentSummary = expensesByCategory[selectedCategory];
  const catMeta = getCategoryById(selectedCategory);

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
            accessibilityLabel="Fechar modal de orçamento"
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
                Limite Mensal por Categoria
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
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Selecione a Categoria
              </Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleSelectCategory(cat.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Categoria ${cat.label}`}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderLight,
                        },
                        isSelected && {
                          backgroundColor: isDark ? `${cat.color}25` : cat.bgColor,
                          borderColor: cat.color,
                        },
                      ]}
                    >
                      <Feather
                        name={cat.iconName}
                        size={15}
                        color={cat.color}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: isSelected ? (isDark ? '#FFFFFF' : cat.color) : colors.textSecondary },
                          isSelected && {
                            fontWeight: typography.fontWeight.bold,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {currentSummary ? (
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[styles.statusBannerText, { color: colors.textSecondary }]}>
                    Gasto atual em <Text style={[styles.bold, { color: colors.textPrimary }]}>{catMeta.label}</Text>:{' '}
                    <Text style={[styles.bold, { color: colors.textPrimary }]}>
                      {formatCurrency(currentSummary.spent)}
                    </Text>{' '}
                    ({Math.round(currentSummary.percentageOfLimit)}% do limite
                    de {formatCurrency(currentSummary.limit)})
                  </Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <AppInput
                  label={`Limite mensal para ${catMeta.label} (R$)`}
                  placeholder="0,00"
                  value={limitInput}
                  onChangeText={(txt) => setLimitInput(formatCurrencyInput(txt))}
                  keyboardType="numeric"
                  prefixText="R$"
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
                  title="Salvar Limite da Categoria"
                  tone="accent"
                  loading={isSaving}
                  onPress={() => void handleSaveBudget()}
                />

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
    maxHeight: '88%',
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
  sectionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    minHeight: MIN_TOUCH_TARGET - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statusBanner: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statusBannerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  form: {
    gap: spacing.md,
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

export default BudgetModal;
