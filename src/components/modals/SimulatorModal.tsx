import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, typography } from '../../theme';
import { CATEGORIES, getCategoryById } from '../../constants/categories';
import { CategoryId } from '../../models';
import { useFinance } from '../../contexts/FinanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currency';
import { CategoryBadge } from '../common/CategoryBadge';
import { ProgressBar } from '../common/ProgressBar';
import { KeyboardDoneAccessory, KEYBOARD_DISMISS_ACCESSORY_ID } from '../common/KeyboardDoneAccessory';

interface SimulatorModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordedSuccess?: (message: string) => void;
}

const QUICK_INSTALLMENTS = [2, 3, 6, 10, 12, 18, 24] as const;

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  visible,
  onClose,
  onRecordedSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    monthlyExpenses,
    monthlyIncome,
    budgets,
    expensesByCategory,
    addTransaction,
    triggerSuccessFeedback,
  } = useFinance();

  const [title, setTitle] = useState('Compra Parcelada');
  const [rawAmount, setRawAmount] = useState('1.200,00');
  const [installments, setInstallments] = useState<number>(6);
  const [categoryId, setCategoryId] = useState<CategoryId>('compras');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = useMemo(
    () => CATEGORIES.filter((cat) => cat.id !== 'receita'),
    [],
  );

  const totalAmount = useMemo(() => parseCurrencyInput(rawAmount), [rawAmount]);
  const installmentValue = useMemo(
    () => (installments > 0 ? totalAmount / installments : totalAmount),
    [totalAmount, installments],
  );

  const globalLimit = user?.monthlyGlobalLimit || 4689.2;
  const projectedGlobalExpenses = monthlyExpenses + installmentValue;
  const projectedGlobalPercent =
    globalLimit > 0
      ? Math.round((projectedGlobalExpenses / globalLimit) * 100)
      : 0;
  const globalOverflow = Math.max(0, projectedGlobalExpenses - globalLimit);

  const categorySummary = expensesByCategory[categoryId];
  const categoryBudget = useMemo(
    () => budgets.find((b) => b.categoryId === categoryId),
    [budgets, categoryId],
  );
  const currentCategorySpent = categorySummary ? categorySummary.spent : 0;
  const projectedCategorySpent = currentCategorySpent + installmentValue;
  const categoryLimit =
    categoryBudget?.limitAmount ?? (categorySummary ? categorySummary.limit : 0);
  const projectedCategoryPercent =
    categoryLimit > 0
      ? Math.round((projectedCategorySpent / categoryLimit) * 100)
      : 0;
  const categoryOverflow =
    categoryLimit > 0 ? Math.max(0, projectedCategorySpent - categoryLimit) : 0;

  const projectedRemainingIncome = monthlyIncome - projectedGlobalExpenses;

  const hasDangerImpact =
    globalOverflow > 0 ||
    categoryOverflow > 0 ||
    (monthlyIncome > 0 && projectedRemainingIncome < 0);

  const handleAmountChange = (text: string) => {
    setRawAmount(formatCurrencyInput(text));
  };

  const adjustInstallments = (delta: number) => {
    setInstallments((prev) => Math.max(2, Math.min(24, prev + delta)));
  };

  const handleConfirmFirstInstallment = async () => {
    if (totalAmount <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const cleanTitle = title.trim() || 'Compra Parcelada';
      const todayIso = new Date().toISOString().split('T')[0];
      await addTransaction({
        title: `${cleanTitle} (1/${installments})`,
        description: `Simulador: Total de ${formatCurrency(
          totalAmount,
        )} em ${installments}x de ${formatCurrency(installmentValue)}`,
        amount: Number(installmentValue.toFixed(2)),
        type: 'expense',
        categoryId,
        date: todayIso,
        isRecurring: true,
        isFrequent: false,
        installments,
      });
      onClose();
      const msg = `1ª parcela (${formatCurrency(
        installmentValue,
      )}) registrada com sucesso!`;
      triggerSuccessFeedback(msg);
      if (onRecordedSuccess) {
        onRecordedSuccess(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = getCategoryById(categoryId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
        >
          {/* Cabeçalho */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.headerIconBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 159, 227, 0.2)'
                      : '#CCFBF1',
                  },
                ]}
              >
                <Feather
                  name="percent"
                  size={20}
                  color={isDark ? colors.accent : colors.headerBg}
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Simulador de Parcelas
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Avalie o impacto no orçamento antes de comprar
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar simulador de parcelas"
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Descrição da Compra */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              O que você pretende comprar?
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderLight,
                  color: colors.textPrimary,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Notebook, Geladeira, Curso..."
              placeholderTextColor={colors.textPlaceholder}
              accessibilityLabel="Descrição da compra"
            />

            {/* Valor Total */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Valor Total da Compra (R$)
            </Text>
            <View
              style={[
                styles.amountInputBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>
                R$
              </Text>
              <TextInput
                style={[styles.amountInput, { color: colors.textPrimary }]}
                value={rawAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                placeholder="0,00"
                placeholderTextColor={colors.textPlaceholder}
                accessibilityLabel="Valor total da compra"
              />
            </View>

            {/* Número de Parcelas (2x a 24x) */}
            <View style={styles.installmentHeaderRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Número de Parcelas (2x a 24x)
              </Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => adjustInstallments(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir número de parcelas"
                  hitSlop={8}
                >
                  <Feather name="minus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>
                  {installments}x
                </Text>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => adjustInstallments(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar número de parcelas"
                  hitSlop={8}
                >
                  <Feather name="plus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chipsRow}>
              {QUICK_INSTALLMENTS.map((n) => {
                const isSelected = installments === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderLight,
                      },
                      isSelected && [
                        styles.chipActive,
                        {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        },
                      ],
                    ]}
                    onPress={() => setInstallments(n)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Parcelar em ${n} vezes`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.textSecondary },
                        isSelected && [
                          styles.chipTextActive,
                          { color: '#081F4D' },
                        ],
                      ]}
                    >
                      {n}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Seleção de Categoria */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Categoria de Orçamento Impactada
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {expenseCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderLight,
                      },
                      isSelected && [
                        styles.categoryChipSelected,
                        {
                          backgroundColor: isDark
                            ? 'rgba(0, 159, 227, 0.2)'
                            : colors.accentLight,
                          borderColor: colors.accent,
                        },
                      ],
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Categoria ${cat.label}`}
                  >
                    <CategoryBadge categoryId={cat.id} variant="icon" size="sm" />
                    <Text
                      style={[
                        styles.categoryChipLabel,
                        { color: colors.textPrimary },
                        isSelected && [
                          styles.categoryChipLabelSelected,
                          { color: isDark ? colors.accent : colors.primary },
                        ],
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Card Principal de Resultado da Parcela */}
            <View style={styles.resultHighlightCard}>
              <View style={styles.resultTopRow}>
                <Text style={styles.resultLabel}>Valor da Parcela Mensal</Text>
                <Text style={styles.resultTotalSub}>
                  Total: {formatCurrency(totalAmount)}
                </Text>
              </View>
              <Text style={styles.resultInstallmentValue}>
                {installments}x de {formatCurrency(installmentValue)}
                <Text style={styles.perMonthSuffix}>/mês</Text>
              </Text>
            </View>

            {/* Diagnóstico de Impacto no Orçamento */}
            <View
              style={[
                styles.impactCard,
                {
                  backgroundColor: hasDangerImpact
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : colors.expenseBg
                    : isDark
                      ? 'rgba(16, 185, 129, 0.15)'
                      : colors.incomeBg,
                  borderColor: hasDangerImpact
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.35)'
                      : '#FCA5A5'
                    : isDark
                      ? 'rgba(16, 185, 129, 0.35)'
                      : '#86EFAC',
                },
              ]}
            >
              <View style={styles.impactHeaderRow}>
                <Feather
                  name={hasDangerImpact ? 'alert-triangle' : 'check-circle'}
                  size={20}
                  color={hasDangerImpact ? colors.expense : colors.income}
                />
                <Text
                  style={[
                    styles.impactTitle,
                    { color: hasDangerImpact ? colors.expense : colors.income },
                  ]}
                >
                  {hasDangerImpact
                    ? 'Atenção: Risco de estouro no orçamento!'
                    : 'Compra compatível com seu planejamento'}
                </Text>
              </View>

              {/* Impacto no Limite Global */}
              <View style={[styles.impactSection, { borderTopColor: colors.borderLight }]}>
                <View style={styles.impactRowBetween}>
                  <Text style={[styles.impactItemLabel, { color: colors.textPrimary }]}>
                    Impacto no Limite Mensal Global:
                  </Text>
                  <Text style={[styles.impactItemPercent, { color: colors.textPrimary }]}>
                    {projectedGlobalPercent}%
                  </Text>
                </View>
                <ProgressBar
                  current={projectedGlobalExpenses}
                  target={globalLimit}
                  height={8}
                />
                <Text style={[styles.impactSubtext, { color: colors.textSecondary }]}>
                  Seus gastos mensais irão de {formatCurrency(monthlyExpenses)}{' '}
                  para {formatCurrency(projectedGlobalExpenses)} (Limite:{' '}
                  {formatCurrency(globalLimit)}).
                  {globalOverflow > 0
                    ? ` Estouro de ${formatCurrency(globalOverflow)}!`
                    : ''}
                </Text>
              </View>

              {/* Impacto no Orçamento da Categoria */}
              <View style={[styles.impactSection, { borderTopColor: colors.borderLight }]}>
                <View style={styles.impactRowBetween}>
                  <Text style={[styles.impactItemLabel, { color: colors.textPrimary }]}>
                    Categoria {selectedCategoryMeta.label}:
                  </Text>
                  <Text style={[styles.impactItemPercent, { color: colors.textPrimary }]}>
                    {categoryLimit > 0
                      ? `${projectedCategoryPercent}% do limite`
                      : 'Sem teto cadastrado'}
                  </Text>
                </View>
                {categoryLimit > 0 ? (
                  <>
                    <ProgressBar
                      current={projectedCategorySpent}
                      target={categoryLimit}
                      height={8}
                    />
                    <Text style={[styles.impactSubtext, { color: colors.textSecondary }]}>
                      Passará de {formatCurrency(currentCategorySpent)} para{' '}
                      {formatCurrency(projectedCategorySpent)} (Teto:{' '}
                      {formatCurrency(categoryLimit)}).
                      {categoryOverflow > 0
                        ? ` Excede a categoria em ${formatCurrency(
                            categoryOverflow,
                          )}!`
                        : ' Dentro do limite da categoria.'}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.impactSubtext, { color: colors.textSecondary }]}>
                    Gasto acumulado na categoria passará para{' '}
                    {formatCurrency(projectedCategorySpent)}.
                  </Text>
                )}
              </View>
            </View>

            {/* Botões de Ação (Heurística 3 — Saída claramente identificada) */}
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancelar e fechar simulador"
              >
                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.accent },
                  totalAmount <= 0 && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirmFirstInstallment}
                disabled={totalAmount <= 0 || isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Confirmar e lançar primeira parcela no banco de dados"
              >
                <Feather name="check-circle" size={16} color="#081F4D" />
                <Text style={[styles.confirmButtonText, { color: '#081F4D' }]}>
                  Lançar 1ª Parcela
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <KeyboardDoneAccessory />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 34,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: typography.fontFamily.regular,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  installmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.headerBg,
    minWidth: 32,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  chipTextActive: {
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  categoryChipLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryChipLabelSelected: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  resultHighlightCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resultTotalSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  resultInstallmentValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  perMonthSuffix: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  impactCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  impactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  impactTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  impactSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  impactRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  impactItemLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  impactItemPercent: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  impactSubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 6,
    lineHeight: 17,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 1.3,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
