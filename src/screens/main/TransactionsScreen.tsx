import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { AppCard } from '../../components/common/AppCard';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { AnimatedEntrance } from '../../components/animated';
import { SimulatorModal } from '../../components/modals/SimulatorModal';
import { KeyboardDoneAccessory, KEYBOARD_DISMISS_ACCESSORY_ID } from '../../components/common/KeyboardDoneAccessory';
import { CATEGORIES, getCategoryById } from '../../constants/categories';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import {
  brDateToISO,
  formatDateFull,
  formatDateInputMask,
  isValidBRDate,
} from '../../utils/date';
import type { MainTabScreenProps } from '../../@types/navigation';
import type { CategoryId, Transaction } from '../../models';

type Props = MainTabScreenProps<'Transactions'>;

type TypeFilter = 'all' | 'expense' | 'income' | 'recurring';
type MonthFilter = 'all' | 'current' | 'custom' | '2026-06';

export const TransactionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    transactions,
    openTransactionModal,
    addTransaction,
    deleteTransaction,
    triggerSuccessFeedback,
  } = useFinance();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(
    'all',
  );
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulador de Compra Parcelada (Modal Completo)
  const [simulatorModalVisible, setSimulatorModalVisible] =
    useState<boolean>(false);

  // Confirmação de exclusão (Heurística 5 — Prevenção de Erros)
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  // Sincroniza filtro de categoria recebido por parâmetro de navegação (ex: vindo do Top 3 da Dashboard)
  useEffect(() => {
    if (route.params?.filterCategoryId) {
      setSelectedCategory(route.params.filterCategoryId);
      setTypeFilter('expense');
    }
  }, [route.params?.filterCategoryId]);

  const currentMonthPrefix = useMemo(
    () => new Date().toISOString().slice(0, 7),
    [],
  );

  // Transações frequentes para Repetição Rápida com 1 clique (Heurística 7)
  const frequentTransactions = useMemo(() => {
    const fromUser = transactions.filter((t) => t.isFrequent);
    if (fromUser.length > 0) {
      return fromUser.slice(0, 6);
    }
    return transactions.slice(0, 4);
  }, [transactions]);

  // Gastos recorrentes para visualização dedicada
  const recurringTransactions = useMemo(
    () => transactions.filter((t) => t.isRecurring),
    [transactions],
  );

  const totalRecurringMonthly = useMemo(
    () =>
      recurringTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0),
    [recurringTransactions],
  );

  // Lista filtrada por tipo, categoria, mês e busca textual
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter === 'expense' && tx.type !== 'expense') return false;
      if (typeFilter === 'income' && tx.type !== 'income') return false;
      if (typeFilter === 'recurring' && !tx.isRecurring) return false;

      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }

      if (monthFilter === '2026-06' && !tx.date.startsWith('2026-06')) {
        return false;
      }
      if (
        monthFilter === 'current' &&
        !tx.date.startsWith(currentMonthPrefix)
      ) {
        return false;
      }
      if (monthFilter === 'custom') {
        const txIso = tx.date.split('T')[0];
        if (customStartDate && isValidBRDate(customStartDate)) {
          const startIso = brDateToISO(customStartDate);
          if (txIso < startIso) return false;
        }
        if (customEndDate && isValidBRDate(customEndDate)) {
          const endIso = brDateToISO(customEndDate);
          if (txIso > endIso) return false;
        }
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const catLabel = getCategoryById(tx.categoryId).label.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(q);
        const matchesDesc = (tx.description ?? '').toLowerCase().includes(q);
        const matchesCat = catLabel.includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    selectedCategory,
    monthFilter,
    customStartDate,
    customEndDate,
    currentMonthPrefix,
    searchQuery,
  ]);

  // Repetir transação com 1 clique no SQLite (Heurística 7)
  const handleQuickRepeat = async (tx: Transaction): Promise<void> => {
    const todayIso = new Date().toISOString().slice(0, 10);
    await addTransaction({
      title: tx.title,
      description: tx.description ?? tx.title,
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
      date: todayIso,
      isRecurring: tx.isRecurring,
      isFrequent: true,
      installments: tx.installments,
      isDemoData: false,
    });
    triggerSuccessFeedback('Lançamento repetido com sucesso!');
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!transactionToDelete) {
      return;
    }
    const idToRemove = transactionToDelete.id;
    setTransactionToDelete(null);
    await deleteTransaction(idToRemove);
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setSelectedCategory('all');
    setMonthFilter('all');
    setSearchQuery('');
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header Global ── */}
        <GlobalHeader
          variant="internal"
          title="Lançamentos"
          avatarUri={user?.avatarUri}
          onPressSettings={() => navigation.navigate('Settings')}
          onPressProfile={() => navigation.navigate('ProfileEdit')}
        >
          <View style={styles.headerSimulatorRow}>
            <Pressable
              onPress={() => setSimulatorModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Simular Parcelas"
              style={({ pressed }) => [
                styles.headerSimulatorBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="percent" size={14} color="#FFFFFF" />
              <Text style={styles.headerSimulatorBtnText}>Simular Parcelas</Text>
            </Pressable>
          </View>
        </GlobalHeader>

        <View style={styles.body}>
          {/* ── Barra de Busca Textual e Atalho do Simulador ── */}
          <AppCard>
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchInputBox,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Feather
                  name="search"
                  size={16}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar por descrição ou categoria..."
                  placeholderTextColor={colors.textPlaceholder}
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  accessibilityLabel="Buscar lançamentos por descrição ou categoria"
                />
                {searchQuery.length > 0 ? (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar busca"
                    hitSlop={8}
                  >
                    <Feather
                      name="x-circle"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => setSimulatorModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Simular Parcelas"
                style={({ pressed }) => [
                  styles.simulatorToggleBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 159, 227, 0.2)'
                      : colors.primaryBlueBg,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather
                  name="percent"
                  size={16}
                  color={isDark ? colors.accent : colors.primaryBlue}
                />
              </Pressable>
            </View>

            {/* ── Filtro por Tipo (Todos | Despesas | Receitas | Recorrentes) ── */}
            <View style={styles.typeFilterRow}>
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'expense', label: 'Despesas' },
                  { id: 'income', label: 'Receitas' },
                  { id: 'recurring', label: 'Recorrentes' },
                ] as const
              ).map((tab) => {
                const active = typeFilter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setTypeFilter(tab.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.filterTabChip,
                      { backgroundColor: colors.surfaceSubtle },
                      active && [
                        styles.filterTabChipActive,
                        { backgroundColor: colors.primary },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabChipText,
                        { color: active ? colors.textInverse : colors.textSecondary },
                        active && styles.filterTabChipTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Filtro por Período / Mês ── */}
            <View style={styles.periodRow}>
              <Text style={[styles.filterMiniLabel, { color: isDark ? '#CBD5E1' : colors.textSecondary }]}>
                Período:
              </Text>
              {(
                [
                  { id: 'all', label: 'Todo período' },
                  { id: 'current', label: 'Mês atual' },
                  { id: 'custom', label: 'Intervalo customizado' },
                ] as const
              ).map((p) => {
                const active = monthFilter === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setMonthFilter(p.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.periodChip,
                      {
                        backgroundColor: isDark ? '#1E293B' : colors.surfaceSubtle,
                        borderColor: isDark ? '#334155' : colors.borderLight,
                      },
                      active && [
                        styles.periodChipActive,
                        {
                          backgroundColor: '#18A4E0',
                          borderColor: '#18A4E0',
                        },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        active && styles.periodChipTextActive,
                        {
                          color: active
                            ? '#081F4D'
                            : isDark
                              ? '#F8FAFC'
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Inputs Inline de Intervalo Customizado (De / Até) */}
            {monthFilter === 'custom' && (
              <AnimatedEntrance duration={220} distance={6}>
                <View
                  style={[
                    styles.customDateRangeRow,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={styles.customDateCol}>
                    <Text style={[styles.customDateLabel, { color: colors.textSecondary }]}>
                      De (DD/MM/AAAA):
                    </Text>
                    <TextInput
                      style={[
                        styles.customDateInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderLight,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={customStartDate}
                      onChangeText={(txt) =>
                        setCustomStartDate(formatDateInputMask(txt))
                      }
                      placeholder="01/01/2026"
                      placeholderTextColor={colors.textPlaceholder}
                      keyboardType="numeric"
                      inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                      maxLength={10}
                      accessibilityLabel="Data inicial do intervalo no formato DD/MM/AAAA"
                    />
                  </View>

                  <View style={styles.customDateCol}>
                    <Text style={[styles.customDateLabel, { color: colors.textSecondary }]}>
                      Até (DD/MM/AAAA):
                    </Text>
                    <TextInput
                      style={[
                        styles.customDateInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderLight,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={customEndDate}
                      onChangeText={(txt) =>
                        setCustomEndDate(formatDateInputMask(txt))
                      }
                      placeholder="31/12/2026"
                      placeholderTextColor={colors.textPlaceholder}
                      keyboardType="numeric"
                      inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                      maxLength={10}
                      accessibilityLabel="Data final do intervalo no formato DD/MM/AAAA"
                    />
                  </View>

                  {customStartDate || customEndDate ? (
                    <Pressable
                      onPress={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      style={[
                        styles.customDateClearBtn,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderLight,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Limpar datas do intervalo customizado"
                      hitSlop={8}
                    >
                      <Feather name="x" size={14} color={colors.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>
              </AnimatedEntrance>
            )}

            {/* ── Filtro Horizontal por Categoria ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterScroll}
            >
              <Pressable
                onPress={() => setSelectedCategory('all')}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCategory === 'all' }}
                style={[
                  styles.categoryFilterPill,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderLight,
                  },
                  selectedCategory === 'all' && [
                    styles.categoryFilterPillActive,
                    { backgroundColor: colors.primary, borderColor: colors.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.categoryFilterPillText,
                    {
                      color:
                        selectedCategory === 'all'
                          ? colors.textInverse
                          : colors.textSecondary,
                    },
                    selectedCategory === 'all' &&
                      styles.categoryFilterPillTextActive,
                  ]}
                >
                  Todas categorias
                </Text>
              </Pressable>

              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() =>
                      setSelectedCategory((prev) =>
                        prev === cat.id ? 'all' : cat.id,
                      )
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.categoryFilterPill,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderLight,
                      },
                      isSelected && {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                      },
                    ]}
                  >
                    <Feather
                      name={cat.iconName}
                      size={12}
                      color={isSelected ? colors.textInverse : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryFilterPillText,
                        {
                          color: isSelected
                            ? colors.textInverse
                            : colors.textSecondary,
                        },
                        isSelected && styles.categoryFilterPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </AppCard>


          {/* ── Seção: Transações Frequentes / Repetir Rápido (Heurística 7) ── */}
          {frequentTransactions.length > 0 ? (
            <AppCard>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <View
                    style={[
                      styles.sectionIconCircle,
                      { backgroundColor: isDark ? 'rgba(0, 159, 227, 0.2)' : colors.brandTurquoiseLight },
                    ]}
                  >
                    <Feather name="zap" size={16} color={isDark ? colors.accent : colors.headerBg} />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      Transações Frequentes • Repetir Rápido
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                      Toque em 1 clique para registrar novamente hoje
                    </Text>
                  </View>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.frequentCardsRow}
              >
                {frequentTransactions.map((freqTx) => {
                  const meta = getCategoryById(freqTx.categoryId);
                  return (
                    <Pressable
                      key={`freq-card-${freqTx.id}`}
                      onPress={() => void handleQuickRepeat(freqTx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Repetir lançamento ${freqTx.title}, valor ${formatCurrency(freqTx.amount)}`}
                      style={({ pressed }) => [
                        styles.frequentQuickCard,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderLight,
                        },
                        pressed && { opacity: 0.78 },
                      ]}
                    >
                      <View style={styles.frequentQuickCardTop}>
                        <CategoryBadge
                          categoryId={freqTx.categoryId}
                          variant="icon"
                          size="sm"
                        />
                        <View style={[
                          styles.repeatTag,
                          { backgroundColor: isDark ? 'rgba(0, 159, 227, 0.2)' : colors.primaryLight },
                        ]}>
                          <Feather
                            name="refresh-cw"
                            size={11}
                            color={isDark ? colors.accent : colors.primary}
                          />
                          <Text style={[
                            styles.repeatTagText,
                            { color: isDark ? colors.accent : colors.primary },
                          ]}>1 clique</Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.frequentQuickTitle,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {freqTx.title || meta.label}
                      </Text>
                      <Text
                        style={[
                          styles.frequentQuickAmount,
                          {
                            color:
                              freqTx.type === 'income'
                                ? colors.income
                                : colors.expense,
                          },
                        ]}
                      >
                        {formatCurrency(freqTx.amount, true, freqTx.type)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </AppCard>
          ) : null}

          {/* ── Resumo de Gastos Recorrentes quando a aba "Recorrentes" estiver ativa ── */}
          {typeFilter === 'recurring' ? (
            <AppCard>
              <View style={styles.recurringSummaryRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Total de Gastos Recorrentes
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    {recurringTransactions.length} assinatura(s) / conta(s)
                    fixa(s)
                  </Text>
                </View>
                <Text style={[styles.recurringTotalValue, { color: colors.expense }]}>
                  {formatCurrency(totalRecurringMonthly)}/mês
                </Text>
              </View>
            </AppCard>
          ) : null}

          {/* ── Histórico Completo de Lançamentos com Editar, Repetir e Excluir ── */}
          <AppCard>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    { backgroundColor: isDark ? 'rgba(0, 159, 227, 0.2)' : colors.brandTurquoiseLight },
                  ]}
                >
                  <Feather name="list" size={16} color={isDark ? colors.accent : colors.headerBg} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Todos os Lançamentos ({filteredTransactions.length})
                </Text>
              </View>

              {typeFilter !== 'all' ||
              selectedCategory !== 'all' ||
              monthFilter !== 'all' ||
              searchQuery.length > 0 ? (
                <Pressable
                  onPress={handleClearFilters}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar filtros"
                >
                  <Text style={[styles.clearFiltersText, { color: colors.accent }]}>Limpar filtros</Text>
                </Pressable>
              ) : null}
            </View>

            {filteredTransactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {filteredTransactions.map((tx, idx) => {
                  const meta = getCategoryById(tx.categoryId);
                  return (
                    <View
                      key={tx.id}
                      style={[
                        styles.txItemContainer,
                        idx < filteredTransactions.length - 1 && [
                          styles.txItemBorder,
                          { borderBottomColor: colors.borderLight },
                        ],
                      ]}
                    >
                      <View style={styles.txMainRow}>
                        <CategoryBadge
                          categoryId={tx.categoryId}
                          variant="icon"
                          size="md"
                        />

                        <View style={styles.txInfoCol}>
                          <Text style={[styles.txTitleText, { color: colors.textPrimary }]} numberOfLines={1}>
                            {tx.title || meta.label}
                          </Text>
                          <View style={styles.txMetaRow}>
                            <Text style={[styles.txDateText, { color: colors.textSecondary }]}>
                              {formatDateFull(tx.date)}
                            </Text>
                            {tx.isRecurring ? (
                              <View style={[
                                styles.recurringBadge,
                                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : colors.warningBg }
                              ]}>
                                <Feather
                                  name="repeat"
                                  size={10}
                                  color={isDark ? colors.warning : colors.warningDark}
                                />
                                <Text style={[
                                  styles.recurringBadgeText,
                                  { color: isDark ? colors.warning : colors.warningDark }
                                ]}>
                                  Fixo
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <CategoryBadge
                          categoryId={tx.categoryId}
                          variant="pill"
                          size="sm"
                        />

                        <Text
                          style={[
                            styles.txAmountText,
                            {
                              color:
                                tx.type === 'income'
                                  ? colors.income
                                  : colors.expense,
                            },
                          ]}
                        >
                          {formatCurrency(tx.amount, true, tx.type)}
                        </Text>
                      </View>

                      {/* Botões de Ação com área mínima de toque de 44px (WCAG 2.5.5) */}
                      <View style={styles.txActionsRow}>
                        <Pressable
                          onPress={() => openTransactionModal(tx)}
                          accessibilityRole="button"
                          accessibilityLabel={`Editar lançamento ${tx.title}`}
                          style={({ pressed }) => [
                            styles.actionBtnNeutral,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.borderLight,
                            },
                            pressed && styles.actionBtnNeutralPressed,
                          ]}
                        >
                          <Feather
                            name="edit-2"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={[styles.actionBtnNeutralText, { color: colors.textSecondary }]}>
                            Editar
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => void handleQuickRepeat(tx)}
                          accessibilityRole="button"
                          accessibilityLabel={`Repetir lançamento ${tx.title}`}
                          style={({ pressed }) => [
                            styles.actionBtnNeutral,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.borderLight,
                            },
                            pressed && styles.actionBtnNeutralPressed,
                          ]}
                        >
                          <Feather
                            name="refresh-cw"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={[styles.actionBtnNeutralText, { color: colors.textSecondary }]}>
                            Repetir
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setTransactionToDelete(tx)}
                          accessibilityRole="button"
                          accessibilityLabel={`Excluir lançamento ${tx.title}`}
                          style={({ pressed }) => [
                            styles.actionBtnDanger,
                            {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : colors.expenseBg,
                            },
                            pressed && styles.actionBtnDangerPressed,
                          ]}
                        >
                          <Feather
                            name="trash-2"
                            size={14}
                            color={colors.expense}
                          />
                          <Text style={[styles.actionBtnDangerText, { color: colors.expense }]}>
                            Excluir
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                iconName="search"
                title="Nenhum lançamento encontrado"
                description="Não há transações correspondentes aos filtros aplicados. Limpe os filtros ou adicione um novo lançamento pelo botão +."
              />
            )}
          </AppCard>
        </View>
      </ScrollView>

      {/* ── Modal Simulador de Parcelas Completo ── */}
      <SimulatorModal
        visible={simulatorModalVisible}
        onClose={() => setSimulatorModalVisible(false)}
      />

      {/* ── Modal de Confirmação de Exclusão (Heurística 5 — Prevenção de Erros) ── */}
      <ConfirmDialog
        visible={Boolean(transactionToDelete)}
        title="Excluir transação?"
        description="Esta ação não pode ser desfeita. O valor será removido do seu saldo e histórico."
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <KeyboardDoneAccessory />
    </View>
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
    paddingBottom: spacing.xxl + 20,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    gap: spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  simulatorToggleBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBlueBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatorToggleBtnActive: {
    backgroundColor: colors.primaryBlue,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterTabChip: {
    flex: 1,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabChipActive: {
    backgroundColor: colors.primary,
  },
  filterTabChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  filterTabChipTextActive: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterMiniLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 2,
  },
  periodChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: '#18A4E0',
    borderColor: '#18A4E0',
  },
  periodChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  periodChipTextActive: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: '#081F4D',
  },
  customDateRangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  customDateCol: {
    flex: 1,
  },
  customDateLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  customDateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    minHeight: 36,
  },
  customDateClearBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFilterScroll: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  categoryFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryFilterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryFilterPillText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  categoryFilterPillTextActive: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  clearFiltersText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  headerSimulatorRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  headerSimulatorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    minHeight: 38,
  },
  headerSimulatorBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
  frequentCardsRow: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  frequentQuickCard: {
    width: 152,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  frequentQuickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  repeatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  repeatTagText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  frequentQuickTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  frequentQuickAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  recurringSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurringTotalValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
    fontVariant: ['tabular-nums'],
  },
  transactionsList: {
    gap: 4,
  },
  txItemContainer: {
    paddingVertical: spacing.md,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  txMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  txInfoCol: {
    flex: 1,
  },
  txTitleText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  txDateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  txCategoryDot: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  txCategoryLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    marginLeft: 4,
  },
  recurringBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.warningDark,
  },
  txAmountText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  txActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
    paddingLeft: 52,
  },
  actionBtnNeutral: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  actionBtnNeutralPressed: {
    backgroundColor: colors.border,
  },
  actionBtnNeutralText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  actionBtnDanger: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.expenseBg,
    marginLeft: 'auto',
  },
  actionBtnDangerPressed: {
    opacity: 0.8,
  },
  actionBtnDangerText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.expenseDark,
  },
});

export default TransactionsScreen;
