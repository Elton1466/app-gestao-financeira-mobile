import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { KeyboardDoneAccessory, KEYBOARD_DISMISS_ACCESSORY_ID } from '../common/KeyboardDoneAccessory';
import { OperationFeedback, OperationStatus } from '../animated';
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currency';
import {
  formatDateInputMask,
  isoToBRDate,
  brDateToISO,
  isValidBRDate,
  getTodayBRDate,
} from '../../utils/date';
import type { CategoryId, TransactionType } from '../../models';

interface QuickFrequentPreset {
  id: string;
  title: string;
  amount: number;
  categoryId: CategoryId;
  type: TransactionType;
}

const DEFAULT_FREQUENT_PRESETS: readonly QuickFrequentPreset[] = [
  {
    id: 'preset-lazer-50',
    title: 'Lazer',
    amount: 50.0,
    categoryId: 'lazer',
    type: 'expense',
  },
  {
    id: 'preset-almoco',
    title: 'Almoço / Restaurante',
    amount: 45.0,
    categoryId: 'alimentacao',
    type: 'expense',
  },
  {
    id: 'preset-ifood',
    title: 'iFood',
    amount: 65.9,
    categoryId: 'alimentacao',
    type: 'expense',
  },
  {
    id: 'preset-uber',
    title: 'Transporte / Combustível',
    amount: 80.0,
    categoryId: 'transporte',
    type: 'expense',
  },
];

const QUICK_AMOUNT_CHIPS: readonly number[] = [25, 50, 100, 200];

function centsStringFromAmount(amount: number): string {
  const cents = Math.round(amount * 100);
  return cents > 0 ? String(cents) : '';
}

function formatCentsToBrDisplay(centsDigits: string): string {
  return formatCurrencyInput(centsDigits);
}

export const TransactionModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  const {
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transactions,
  } = useFinance();

  const maxModalWidth = Math.min(windowWidth, 540);
  const horizontalPaddingTotal = spacing.xl * 2;
  const gapTotal = spacing.sm * 2;
  const categoryCardWidth = Math.floor(
    (maxModalWidth - horizontalPaddingTotal - gapTotal) / 3,
  );

  const isEditing = Boolean(editingTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [rawCents, setRawCents] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null,
  );
  const [title, setTitle] = useState<string>('');
  const [dateBR, setDateBR] = useState<string>(getTodayBRDate());
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [isFrequent, setIsFrequent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [operationStatus, setOperationStatus] = useState<OperationStatus>('idle');
  const [confirmDeleteVisible, setConfirmDeleteVisible] =
    useState<boolean>(false);

  // Sincroniza estado ao abrir o modal (criação vs edição)
  useEffect(() => {
    if (!isTransactionModalOpen) {
      return;
    }

    setErrorMessage(null);
    setOperationStatus('idle');
    setConfirmDeleteVisible(false);

    if (editingTransaction) {
      setType(editingTransaction.type);
      setRawCents(centsStringFromAmount(editingTransaction.amount));
      setSelectedCategory(editingTransaction.categoryId);
      setTitle(editingTransaction.title || '');
      setDateBR(isoToBRDate(editingTransaction.date) || getTodayBRDate());
      setIsRecurring(editingTransaction.isRecurring);
      setIsFrequent(editingTransaction.isFrequent);
    } else {
      setType('expense');
      setRawCents('');
      setSelectedCategory(null);
      setTitle('');
      setDateBR(getTodayBRDate());
      setIsRecurring(false);
      setIsFrequent(false);
    }
  }, [isTransactionModalOpen, editingTransaction]);

  // Atalhos rápidos combinando transações frequentes do SQLite + presets padrão (Heurística 7)
  const frequentShortcuts = useMemo<QuickFrequentPreset[]>(() => {
    const fromDb: QuickFrequentPreset[] = transactions
      .filter((t) => t.isFrequent)
      .slice(0, 4)
      .map((t) => ({
        id: `freq-${t.id}`,
        title: t.title,
        amount: t.amount,
        categoryId: t.categoryId,
        type: t.type,
      }));

    const combined = [...fromDb];
    for (const preset of DEFAULT_FREQUENT_PRESETS) {
      if (
        !combined.some(
          (item) => item.title.toLowerCase() === preset.title.toLowerCase(),
        )
      ) {
        combined.push(preset);
      }
    }
    return combined.slice(0, 5);
  }, [transactions]);

  const numericAmount = useMemo(() => {
    const cleaned = rawCents.replace(/\D/g, '');
    if (!cleaned) {
      return 0;
    }
    return parseInt(cleaned, 10) / 100;
  }, [rawCents]);

  const handleAmountTextChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setRawCents(digits);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSelectQuickAmount = (value: number) => {
    setRawCents(centsStringFromAmount(value));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleApplyFrequentShortcut = (shortcut: QuickFrequentPreset) => {
    setType(shortcut.type);
    setSelectedCategory(shortcut.categoryId);
    setRawCents(centsStringFromAmount(shortcut.amount));
    setTitle(shortcut.title);
    setErrorMessage(null);
  };

  const handleSelectCategory = (catId: CategoryId) => {
    setSelectedCategory(catId);
    if (catId === 'receita') {
      setType('income');
    } else if (type === 'income') {
      setType('expense');
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    setErrorMessage(null);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Informe um valor maior que R$ 0,00.');
      return;
    }

    if (!selectedCategory) {
      setErrorMessage('Selecione uma categoria para o lançamento.');
      return;
    }

    const effectiveType: TransactionType =
      selectedCategory === 'receita' ? 'income' : type;
    const categoryMeta = getCategoryById(selectedCategory);
    const effectiveTitle = title.trim() || categoryMeta.label;

    const trimmedDate = dateBR.trim();
    if (trimmedDate && !isValidBRDate(trimmedDate)) {
      setErrorMessage('Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }
    const safeDate = trimmedDate ? brDateToISO(trimmedDate) : brDateToISO(getTodayBRDate());

    setIsSaving(true);
    setOperationStatus('loading');
    try {
      if (isEditing && editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          title: effectiveTitle,
          description: effectiveTitle,
          amount: numericAmount,
          type: effectiveType,
          categoryId: selectedCategory,
          date: safeDate,
          isRecurring,
          isFrequent,
        });
      } else {
        await addTransaction({
          title: effectiveTitle,
          description: effectiveTitle,
          amount: numericAmount,
          type: effectiveType,
          categoryId: selectedCategory,
          date: safeDate,
          isRecurring,
          isFrequent,
          isDemoData: false,
        });
      }
      setOperationStatus('success');
      setTimeout(() => {
        closeTransactionModal();
      }, 200);
    } catch (err) {
      console.error('[TransactionModal] Erro ao salvar lançamento:', err);
      setOperationStatus('error');
      setErrorMessage('Não foi possível gravar o lançamento no banco local.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!editingTransaction) {
      return;
    }
    setConfirmDeleteVisible(false);
    setIsSaving(true);
    try {
      await deleteTransaction(editingTransaction.id);
      closeTransactionModal();
    } catch (err) {
      console.error('[TransactionModal] Erro ao excluir lançamento:', err);
      setErrorMessage('Não foi possível excluir o lançamento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={isTransactionModalOpen}
      transparent
      animationType="slide"
      onRequestClose={closeTransactionModal}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropTouchable}
            onPress={closeTransactionModal}
            accessibilityRole="button"
            accessibilityLabel="Fechar modal ao tocar fora"
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                borderTopWidth: 1,
                paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
              },
            ]}
          >
            {/* ── Cabeçalho com Título e Botão Fechar (X) — Heurística 3 ── */}
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
              </Text>
              <Pressable
                onPress={closeTransactionModal}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de lançamento"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeIconButton,
                  { backgroundColor: colors.surfaceSubtle },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── Seletor em Pílula: Despesa vs Receita (Figura 2) ── */}
              <View style={styles.typeToggleRow}>
                <Pressable
                  onPress={() => {
                    setType('expense');
                    if (selectedCategory === 'receita') {
                      setSelectedCategory(null);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected:
                      type === 'expense' && selectedCategory !== 'receita',
                  }}
                  accessibilityLabel="Tipo Despesa"
                  style={[
                    styles.typePill,
                    { backgroundColor: colors.surfaceSubtle },
                    type === 'expense' &&
                      selectedCategory !== 'receita' &&
                      styles.typePillExpenseActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      { color: colors.textSecondary },
                      type === 'expense' &&
                        selectedCategory !== 'receita' &&
                        styles.typePillTextActive,
                    ]}
                  >
                    Despesa
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setType('income');
                    setSelectedCategory('receita');
                  }}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected:
                      type === 'income' || selectedCategory === 'receita',
                  }}
                  accessibilityLabel="Tipo Receita"
                  style={[
                    styles.typePill,
                    { backgroundColor: colors.surfaceSubtle },
                    (type === 'income' || selectedCategory === 'receita') &&
                      styles.typePillIncomeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      { color: colors.textSecondary },
                      (type === 'income' || selectedCategory === 'receita') && [
                        styles.typePillTextActive,
                        isDark && { color: '#081F4D' },
                      ],
                    ]}
                  >
                    Receita
                  </Text>
                </Pressable>
              </View>

              {/* ── Campo Valor com Prefixo R$ em Fonte Grande (Figura 2) ── */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Valor</Text>
                <View style={[
                  styles.amountInputContainer,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderLight,
                  },
                ]}>
                  <Text style={[styles.amountCurrencyPrefix, { color: colors.textSecondary }]}>R$</Text>
                  <TextInput
                    value={formatCentsToBrDisplay(rawCents)}
                    onChangeText={handleAmountTextChange}
                    placeholder="0,00"
                    placeholderTextColor={colors.textPlaceholder}
                    keyboardType="numeric"
                    inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                    style={[styles.amountInput, { color: colors.textPrimary }]}
                    accessibilityLabel="Valor do lançamento em reais"
                  />
                  {rawCents.length > 0 ? (
                    <Pressable
                      onPress={() => setRawCents('')}
                      accessibilityRole="button"
                      accessibilityLabel="Limpar valor"
                      hitSlop={8}
                      style={styles.clearAmountBtn}
                    >
                      <Feather
                        name="x-circle"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {/* Chips rápidos de valor (facilita inserção rápida como R$ 50,00) */}
                <View style={styles.quickAmountRow}>
                  {QUICK_AMOUNT_CHIPS.map((val) => {
                    const isActive = Math.abs(numericAmount - val) < 0.001;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => handleSelectQuickAmount(val)}
                        accessibilityRole="button"
                        accessibilityLabel={`Preencher valor ${formatCurrency(val)}`}
                        style={[
                          styles.quickAmountChip,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: colors.borderLight,
                          },
                          isActive && [
                            styles.quickAmountChipActive,
                            {
                              backgroundColor: isDark ? 'rgba(0, 159, 227, 0.25)' : colors.accentLight,
                              borderColor: colors.accent,
                            },
                          ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickAmountChipText,
                            { color: colors.textSecondary },
                            isActive && [
                              styles.quickAmountChipTextActive,
                              { color: isDark ? colors.accent : colors.primary },
                            ],
                          ]}
                        >
                          {formatCurrency(val)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── Grade Categoria em 3 Colunas com os 9 Cards (Figura 2) ── */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Categoria</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const activeBgColor =
                      cat.id === 'receita'
                        ? colors.income
                        : colors.accent;

                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => handleSelectCategory(cat.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Categoria ${cat.label}`}
                        style={[
                          styles.categoryCard,
                          {
                            width: categoryCardWidth,
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: colors.borderLight,
                          },
                          isSelected && {
                            backgroundColor: activeBgColor,
                            borderColor: activeBgColor,
                          },
                        ]}
                      >
                        <Feather
                          name={cat.iconName}
                          size={22}
                          color={
                            isSelected
                              ? (cat.id === 'receita' && isDark ? '#081F4D' : colors.textInverse)
                              : colors.textPrimary
                          }
                        />
                        <Text
                          style={[
                            styles.categoryCardLabel,
                            { color: colors.textSecondary },
                            isSelected && [
                              styles.categoryCardLabelSelected,
                              cat.id === 'receita' && isDark && { color: '#081F4D' },
                            ],
                          ]}
                          numberOfLines={1}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── Atalhos Rápidos / Transações Frequentes (Heurística 7) ── */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Preenchimento Rápido (Frequentes)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.frequentRow}
                >
                  {frequentShortcuts.map((shortcut) => (
                    <Pressable
                      key={shortcut.id}
                      onPress={() => handleApplyFrequentShortcut(shortcut)}
                      accessibilityRole="button"
                      accessibilityLabel={`Preencher ${shortcut.title} ${formatCurrency(shortcut.amount)}`}
                      style={({ pressed }) => [
                        styles.frequentChip,
                        {
                          backgroundColor: isDark ? 'rgba(0, 159, 227, 0.2)' : colors.accentLight,
                          borderColor: isDark ? colors.accent : colors.accent,
                        },
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <Feather
                        name="zap"
                        size={12}
                        color={isDark ? colors.accent : colors.primary}
                      />
                      <Text style={[
                        styles.frequentChipText,
                        { color: isDark ? colors.accent : colors.primary },
                      ]}>
                        {shortcut.title} ({formatCurrency(shortcut.amount)})
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* ── Campos Opcionais: Descrição, Data e Opções de Recorrência ── */}
              <View style={styles.optionalFieldsBlock}>
                <View style={styles.optionalInputRow}>
                  <View style={styles.optionalDescCol}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Ex: Almoço, Cinema, Shopee..."
                      placeholderTextColor={colors.textPlaceholder}
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderLight,
                          color: colors.textPrimary,
                        },
                      ]}
                      accessibilityLabel="Descrição do lançamento"
                    />
                  </View>
                  <View style={styles.optionalDateCol}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Data</Text>
                    <TextInput
                      value={dateBR}
                      onChangeText={(txt) => setDateBR(formatDateInputMask(txt))}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.textPlaceholder}
                      keyboardType="numeric"
                      inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                      maxLength={10}
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderLight,
                          color: colors.textPrimary,
                        },
                      ]}
                      accessibilityLabel="Data do lançamento no formato dia mês e ano"
                    />
                  </View>
                </View>

                <View style={styles.checkboxRow}>
                  <Pressable
                    onPress={() => setIsRecurring((prev) => !prev)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isRecurring }}
                    accessibilityLabel="Marcar como Gasto Recorrente"
                    style={styles.checkboxItem}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderLight,
                        },
                        isRecurring && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {isRecurring ? (
                        <Feather
                          name="check"
                          size={13}
                          color={isDark ? '#081F4D' : colors.textInverse}
                        />
                      ) : null}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Gasto Recorrente</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIsFrequent((prev) => !prev)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isFrequent }}
                    accessibilityLabel="Salvar nos Frequentes"
                    style={styles.checkboxItem}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderLight,
                        },
                        isFrequent && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {isFrequent ? (
                        <Feather
                          name="check"
                          size={13}
                          color={isDark ? '#081F4D' : colors.textInverse}
                        />
                      ) : null}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Uso Frequente</Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Mensagem de Erro de Validação ── */}
              {errorMessage ? (
                <View style={[
                  styles.errorBox,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.expenseBg,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : undefined,
                    borderWidth: isDark ? 1 : 0,
                  },
                ]} accessibilityRole="alert">
                  <Feather
                    name="alert-circle"
                    size={16}
                    color={colors.expense}
                  />
                  <Text style={[styles.errorText, { color: colors.expense }]}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* ── Botão Primário com Feedback Operacional (Heurística 1 / Reanimated) ── */}
              <OperationFeedback
                status={operationStatus}
                idleTitle={isEditing ? 'Salvar Alterações' : 'Adicionar Lançamento'}
                loadingTitle="Salvando lançamento..."
                successTitle={isEditing ? 'Alterações salvas!' : 'Lançamento adicionado!'}
                errorTitle="Erro ao salvar"
                onPress={() => void handleSubmit()}
                disabled={!numericAmount || !selectedCategory}
              />

              {/* ── Botões Secundários: Excluir (em edição) e Cancelar (Heurística 3) ── */}
              <View style={styles.secondaryActionsRow}>
                {isEditing ? (
                  <Pressable
                    onPress={() => setConfirmDeleteVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Excluir Lançamento"
                    style={({ pressed }) => [
                      styles.deleteButton,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.expenseBg,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={colors.expense}
                    />
                    <Text style={[styles.deleteButtonText, { color: colors.expense }]}>
                      Excluir Lançamento
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={closeTransactionModal}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar e fechar modal"
                  style={({ pressed }) => [
                    styles.cancelButton,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderLight,
                      borderWidth: 1,
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Excluir transação?"
        description="Esta ação não pode ser desfeita. O valor será removido do seu saldo e histórico."
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
    paddingBottom: spacing.xl,
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconButtonPressed: {
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typePill: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
  },
  typePillExpenseActive: {
    backgroundColor: colors.expense,
  },
  typePillIncomeActive: {
    backgroundColor: colors.income,
  },
  typePillText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  typePillTextActive: {
    color: colors.textInverse,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  },
  sectionBlock: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  amountCurrencyPrefix: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginRight: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  amountInput: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    paddingVertical: 0,
    fontVariant: ['tabular-nums'],
  },
  clearAmountBtn: {
    padding: spacing.xs,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  quickAmountChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmountChipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  quickAmountChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  quickAmountChipTextActive: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  categoryCard: {
    width: '31.5%',
    minHeight: 78,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs + 2,
  },
  categoryCardLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryCardLabelSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  frequentRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  frequentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.full,
  },
  frequentChipText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  optionalFieldsBlock: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  optionalInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionalDescCol: {
    flex: 1.4,
  },
  optionalDateCol: {
    flex: 1,
  },
  textInputField: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.expenseBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.expenseDark,
  },
  submitButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md, // 12px conforme especificação da Figura 2
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonSubtle: {
    opacity: 0.88,
  },
  submitButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  deleteButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.expenseBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.expenseDark,
  },
  cancelButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});

export default TransactionModal;
