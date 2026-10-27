import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { AppCard } from '../../components/common/AppCard';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { KeyboardDoneAccessory } from '../../components/common/KeyboardDoneAccessory';
import { ProgressBar } from '../../components/common/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState';
import { AnimatedEntrance } from '../../components/animated';
import { motion } from '../../theme/motion';
import {
  GoalModal,
  getGoalPresetByIcon,
} from '../../components/modals/GoalModal';
import { BudgetModal } from '../../components/modals/BudgetModal';
import { SimulatorModal } from '../../components/modals/SimulatorModal';
import { getCategoryById } from '../../constants/categories';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance, type CategoryExpenseSummary } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  formatCurrency,
  formatCurrencyInput,
  numberToCurrencyInput,
  parseCurrencyInput,
} from '../../utils/currency';
import {
  formatDateShort,
  isoToBRDate,
} from '../../utils/date';
import type { MainTabScreenProps } from '../../@types/navigation';
import type { CategoryId, FinancialGoal } from '../../models';

type Props = MainTabScreenProps<'Planning'>;

export const PlanningScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, updateMonthlyLimit } = useAuth();
  const {
    goals,
    transactions,
    monthlyExpenses,
    expensesByCategory,
    openTransactionModal,
  } = useFinance();

  // Estado do GoalModal (Criar / Editar / Aportar / Excluir Meta)
  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Estado do BudgetModal (Criar / Editar / Excluir Limite por Categoria)
  const [budgetModalVisible, setBudgetModalVisible] = useState<boolean>(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] =
    useState<CategoryId | null>(null);

  // Estado do Simulador de Parcelas (SimulatorModal)
  const [simulatorModalVisible, setSimulatorModalVisible] =
    useState<boolean>(false);

  // Estado do Modal de Alerta Instrutivo da Heurística 9 (ícone !)
  const [alertCategorySummary, setAlertCategorySummary] =
    useState<CategoryExpenseSummary | null>(null);

  // Estado do Modal para Editar a Meta Mensal Global
  const [globalLimitModalVisible, setGlobalLimitModalVisible] =
    useState<boolean>(false);
  const [globalLimitInput, setGlobalLimitInput] = useState<string>('');
  const [globalLimitError, setGlobalLimitError] = useState<string | null>(null);
  const [savingGlobalLimit, setSavingGlobalLimit] = useState<boolean>(false);

  const globalMonthlyTarget = user?.monthlyGlobalLimit ?? 5000.0;
  // Cálculo real do percentual de uso do orçamento mensal (sem trava em 100% — Heurística 1)
  const globalRealPercentage =
    globalMonthlyTarget > 0
      ? (monthlyExpenses / globalMonthlyTarget) * 100
      : 0;
  const globalVisualBarPercent = Math.min(Math.max(globalRealPercentage, 0), 100);
  const isGlobalOverLimit = monthlyExpenses > globalMonthlyTarget;

  // Categorias com orçamento definido ou gasto registrado
  const budgetedCategories = useMemo(() => {
    const order: CategoryId[] = [
      'alimentacao',
      'transporte',
      'compras',
      'casa',
      'lazer',
      'saude',
      'viagem',
      'educacao',
    ];
    return order
      .map((catId) => expensesByCategory[catId])
      .filter(
        (item): item is CategoryExpenseSummary =>
          Boolean(item) && (item.limit > 0 || item.spent > 0),
      );
  }, [expensesByCategory]);

  // Transações recorrentes reais do banco SQLite
  const recurringExpenses = useMemo(
    () =>
      transactions.filter((tx) => tx.isRecurring && tx.type === 'expense'),
    [transactions],
  );
  const totalRecurringAmount = useMemo(
    () => recurringExpenses.reduce((acc, item) => acc + item.amount, 0),
    [recurringExpenses],
  );

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setGoalModalVisible(true);
  };

  const handleOpenEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setGoalModalVisible(true);
  };

  const handleOpenBudgetModal = (categoryId?: CategoryId) => {
    setSelectedBudgetCategory(categoryId ?? null);
    setBudgetModalVisible(true);
  };

  const handleOpenGlobalLimitModal = () => {
    setGlobalLimitError(null);
    setGlobalLimitInput(numberToCurrencyInput(globalMonthlyTarget));
    setGlobalLimitModalVisible(true);
  };

  const handleSaveGlobalLimit = async (): Promise<void> => {
    setGlobalLimitError(null);
    const parsed = parseCurrencyInput(globalLimitInput);
    if (parsed <= 0) {
      setGlobalLimitError('Informe uma meta mensal maior que R$ 0,00.');
      return;
    }

    setSavingGlobalLimit(true);
    try {
      const result = await updateMonthlyLimit(parsed);
      if (!result.success) {
        setGlobalLimitError(
          result.error ?? 'Erro ao atualizar a meta mensal.',
        );
        return;
      }
      setGlobalLimitModalVisible(false);
    } finally {
      setSavingGlobalLimit(false);
    }
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
      >
        {/* ── Cabeçalho Global com Card de Orçamento Mensal (Heurística 1 e 8) ── */}
        <GlobalHeader
          variant="internal"
          title="Planejamento financeiro"
          avatarUri={user?.avatarUri}
          onPressSettings={() => navigation.navigate('Settings')}
          onPressProfile={() => navigation.navigate('ProfileEdit')}
        >
          <View style={styles.headerBudgetBox}>
            <View style={styles.headerBudgetTopRow}>
              <Text style={styles.headerBudgetTitle}>Orçamento mensal</Text>

              <View
                style={[
                  styles.headerUsageBadge,
                  isGlobalOverLimit && styles.headerUsageBadgeOver,
                ]}
              >
                <Text
                  style={[
                    styles.headerUsageBadgeText,
                    isGlobalOverLimit && styles.headerUsageBadgeTextOver,
                  ]}
                >
                  {Math.round(globalRealPercentage)}% utilizado
                  {isGlobalOverLimit ? ' — Limite ultrapassado' : ''}
                </Text>
              </View>
            </View>

            <ProgressBar
              current={monthlyExpenses}
              target={globalMonthlyTarget}
              barColor={isGlobalOverLimit ? colors.expense : colors.surface}
              trackColor="rgba(255, 255, 255, 0.28)"
              showPercentageLabel={false}
              height={8}
              style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}
            />

            <View style={styles.headerBudgetBottomRow}>
              <Text style={styles.headerAmountCaption}>
                Gasto:{' '}
                <Text style={styles.headerAmountStrong}>
                  {formatCurrency(monthlyExpenses)}
                </Text>
              </Text>

              <Pressable
                onPress={handleOpenGlobalLimitModal}
                accessibilityRole="button"
                accessibilityLabel={`Meta mensal ${formatCurrency(globalMonthlyTarget)}. Toque para editar a meta mensal.`}
                style={styles.editMetaButton}
                hitSlop={8}
              >
                <Text style={styles.headerAmountCaption}>
                  Meta:{' '}
                  <Text style={styles.headerAmountStrong}>
                    {formatCurrency(globalMonthlyTarget)}
                  </Text>
                </Text>
                <Feather
                  name="edit-2"
                  size={12}
                  color={colors.textInverse}
                />
              </Pressable>
            </View>
          </View>
        </GlobalHeader>

        <View style={styles.body}>
          {/* ── Seção 1: Metas Financeiras (CRUD Completo no SQLite — Figura 2) ── */}
          <AnimatedEntrance delay={motion.duration.stagger * 1}>
            <AppCard>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0, 159, 227, 0.2)'
                        : colors.primaryLight,
                    },
                  ]}
                >
                  <Feather
                    name="target"
                    size={16}
                    color={isDark ? colors.accent : colors.primary}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Metas Financeiras
                </Text>
              </View>

              <Pressable
                onPress={handleOpenCreateGoal}
                accessibilityRole="button"
                accessibilityLabel="Nova meta financeira"
                style={({ pressed }) => [
                  styles.addPillButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 159, 227, 0.2)'
                      : colors.primaryLight,
                  },
                  pressed && { opacity: 0.78 },
                ]}
              >
                <Text
                  style={[
                    styles.addPillButtonText,
                    { color: isDark ? colors.accent : colors.primary },
                  ]}
                >
                  + Nova meta
                </Text>
              </Pressable>
            </View>

            {goals.length > 0 ? (
              <View style={styles.goalsList}>
                {goals.map((goal) => {
                  const preset = getGoalPresetByIcon(goal.icon);
                  const realPct =
                    goal.targetAmount > 0
                      ? (goal.currentAmount / goal.targetAmount) * 100
                      : 0;
                  const remaining = Math.max(
                    0,
                    goal.targetAmount - goal.currentAmount,
                  );
                  const isCompleted = realPct >= 100;

                  return (
                    <Pressable
                      key={goal.id}
                      onPress={() => handleOpenEditGoal(goal)}
                      accessibilityRole="button"
                      accessibilityLabel={`Meta ${goal.title}, acumulado ${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)}, ${Math.round(realPct)}% concluído. Toque para editar, aportar ou excluir.`}
                      style={({ pressed }) => [
                        styles.goalCard,
                        {
                          backgroundColor: isDark ? '#1E293B' : colors.surfaceSubtle,
                          borderColor: isDark ? colors.border : colors.borderLight,
                        },
                        pressed && {
                          backgroundColor: isDark ? '#243248' : colors.borderLight,
                          opacity: 0.9,
                        },
                      ]}
                    >
                      <View style={styles.goalCardRow}>
                        <View
                          style={[
                            styles.goalIconCircle,
                            {
                              backgroundColor: isDark
                                ? `${goal.color || preset.color}25`
                                : preset.bgColor,
                            },
                          ]}
                        >
                          <Feather
                            name={preset.iconName}
                            size={18}
                            color={goal.color || preset.color}
                          />
                        </View>

                        <View style={styles.goalContentCol}>
                          <View style={styles.goalTopRow}>
                            <Text
                              style={[
                                styles.goalTitle,
                                { color: isDark ? '#F8FAFC' : colors.textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {goal.title}
                            </Text>
                            <View
                              style={[
                                styles.goalPctPill,
                                {
                                  backgroundColor: isCompleted
                                    ? colors.incomeBg
                                    : isDark
                                    ? `${goal.color || preset.color}25`
                                    : preset.bgColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.goalPctText,
                                  {
                                    color: isCompleted
                                      ? colors.income
                                      : goal.color || preset.color,
                                  },
                                ]}
                              >
                                {Math.round(realPct)}%
                              </Text>
                            </View>
                          </View>

                          <ProgressBar
                            current={goal.currentAmount}
                            target={goal.targetAmount}
                            mode="goal"
                            barColor={
                              isCompleted
                                ? colors.income
                                : goal.color || preset.color
                            }
                            showPercentageLabel={false}
                            height={8}
                            style={styles.goalProgressBar}
                          />

                          <View style={styles.goalAmountsRow}>
                            <Text
                              style={[
                                styles.goalCurrentText,
                                { color: isDark ? '#CBD5E1' : colors.textSecondary },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.goalSavedStrong,
                                  { color: goal.color || preset.color },
                                ]}
                              >
                                {formatCurrency(goal.currentAmount)}
                              </Text>{' '}
                              / {formatCurrency(goal.targetAmount)}
                            </Text>

                            {isCompleted ? (
                              <Text
                                style={[
                                  styles.goalCompletedText,
                                  { color: colors.income },
                                ]}
                              >
                                Concluída!
                              </Text>
                            ) : (
                              <Text
                                style={[
                                  styles.goalRemainingText,
                                  { color: isDark ? '#CBD5E1' : colors.textSecondary },
                                ]}
                              >
                                Faltam {formatCurrency(remaining)}
                              </Text>
                            )}
                          </View>

                          {goal.deadline ? (
                            <Text
                              style={[
                                styles.goalDeadlineText,
                                { color: isDark ? '#94A3B8' : colors.textMuted },
                              ]}
                            >
                              Prazo: {isoToBRDate(goal.deadline)}
                            </Text>
                          ) : null}
                        </View>

                        <Feather
                          name="chevron-right"
                          size={16}
                          color={isDark ? '#94A3B8' : colors.textSecondary}
                          style={styles.goalChevron}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                iconName="target"
                title="Nenhuma meta criada ainda"
                description='Toque em "+ Nova meta" para criar seu primeiro objetivo financeiro.'
              />
            )}
          </AppCard>
        </AnimatedEntrance>

        {/* ── Seção 2: Orçamento por Categoria (Heurística 1 e Heurística 9 — Ícone ! Interativo) ── */}
        <AnimatedEntrance delay={motion.duration.stagger * 2}>
          <AppCard>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0, 159, 227, 0.2)'
                        : colors.primaryLight,
                    },
                  ]}
                >
                  <Feather
                    name="shopping-cart"
                    size={16}
                    color={isDark ? colors.accent : colors.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Orçamento por categoria
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Limites mensais por categoria de gasto
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleOpenBudgetModal()}
                accessibilityRole="button"
                accessibilityLabel="Definir ou editar limite por categoria"
                style={({ pressed }) => [
                  styles.addPillButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 159, 227, 0.2)'
                      : colors.primaryLight,
                  },
                  pressed && { opacity: 0.78 },
                ]}
              >
                <Feather
                  name="sliders"
                  size={13}
                  color={isDark ? colors.accent : colors.primary}
                />
                <Text
                  style={[
                    styles.addPillButtonText,
                    { color: isDark ? colors.accent : colors.primary },
                  ]}
                >
                  Limites
                </Text>
              </Pressable>
            </View>

            <View style={styles.budgetCategoriesList}>
              {budgetedCategories.map((item, idx) => {
                const catMeta = getCategoryById(item.categoryId);
                const realPct = item.percentageOfLimit;
                const isOver = item.spent > item.limit && item.limit > 0;
                const isWarning = realPct >= 80 && !isOver;
                const showAlertIcon = isOver || isWarning;

                return (
                  <Pressable
                    key={item.categoryId}
                    onPress={() => handleOpenBudgetModal(item.categoryId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Orçamento de ${catMeta.label}: gasto ${formatCurrency(item.spent)} de ${formatCurrency(item.limit)}, ${Math.round(realPct)}% utilizado. Toque para editar limite.`}
                    style={({ pressed }) => [
                      styles.budgetCategoryRow,
                      idx < budgetedCategories.length - 1 && [
                        styles.budgetCategoryBorder,
                        { borderBottomColor: colors.borderLight },
                      ],
                      pressed && styles.budgetCategoryPressed,
                    ]}
                  >
                    <View style={styles.budgetCategoryTop}>
                      <View style={styles.budgetCategoryLeft}>
                        <View
                          style={[
                            styles.catSmallIconCircle,
                            { backgroundColor: catMeta.bgColor },
                          ]}
                        >
                          <Feather
                            name={catMeta.iconName}
                            size={15}
                            color={catMeta.color}
                          />
                        </View>
                        <Text style={[styles.budgetCategoryLabel, { color: colors.textPrimary }]}>
                          {catMeta.label}
                        </Text>
                      </View>

                      <View style={styles.budgetCategoryRight}>
                        {/* ── Ícone (!) Interativo de Aviso / Estouro (Heurística 9) ── */}
                        {showAlertIcon ? (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              setAlertCategorySummary(item);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Alerta de orçamento em ${catMeta.label}: ${Math.round(realPct)}% atingido. Toque para ver orientação.`}
                            hitSlop={10}
                            style={[
                              styles.warningInteractiveBadge,
                              {
                                backgroundColor: isOver
                                  ? colors.expenseBg
                                  : colors.warningBg,
                              },
                            ]}
                          >
                            <Feather
                              name="alert-circle"
                              size={15}
                              color={
                                isOver ? colors.expense : colors.warningDark
                              }
                            />
                          </Pressable>
                        ) : null}

                        <Text
                          style={[
                            styles.budgetCategorySpentText,
                            { color: colors.textPrimary },
                            isOver && { color: colors.expense },
                            isWarning && { color: colors.warningDark },
                          ]}
                        >
                          {formatCurrency(item.spent)}{' '}
                          <Text style={[styles.budgetCategoryLimitText, { color: colors.textSecondary }]}>
                            / {formatCurrency(item.limit)}
                          </Text>
                        </Text>
                      </View>
                    </View>

                    {/* Barra de progresso sem trava em 100% no rótulo (Heurística 1) */}
                    <ProgressBar
                      current={item.spent}
                      target={item.limit}
                      mode="budget"
                      barColor={catMeta.color}
                      height={8}
                    />
                  </Pressable>
                );
              })}
            </View>
          </AppCard>
        </AnimatedEntrance>

        {/* ── Atalho para o Simulador de Compra Parcelada ── */}
        <AnimatedEntrance delay={motion.duration.stagger * 3}>
          <AppCard>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0, 159, 227, 0.2)'
                        : colors.primaryLight,
                    },
                  ]}
                >
                  <Feather
                    name="percent"
                    size={16}
                    color={isDark ? colors.accent : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Simulador de Compra Parcelada
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Veja o impacto de parcelas (2x a 24x) nos seus limites antes de comprar
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: spacing.sm }}>
              <AppButton
                title="Abrir Simulador de Parcelas"
                tone="accent"
                leftIcon="percent"
                onPress={() => setSimulatorModalVisible(true)}
              />
            </View>
          </AppCard>
        </AnimatedEntrance>

        {/* ── Seção 4: Gerenciar Gastos Recorrentes ── */}
        <AnimatedEntrance delay={motion.duration.stagger * 4}>
          <AppCard>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.2)'
                        : colors.warningBg,
                    },
                  ]}
                >
                  <Feather
                    name="refresh-cw"
                    size={16}
                    color={isDark ? colors.warning : colors.warningDark}
                  />
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Gerenciar gastos recorrentes
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Assinaturas e pagamentos mensais fixos
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.recurringList}>
              {recurringExpenses.map((sub) => {
                const meta = getCategoryById(sub.categoryId);
                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => openTransactionModal(sub)}
                    accessibilityRole="button"
                    accessibilityLabel={`Gasto recorrente ${sub.title}, valor ${formatCurrency(sub.amount)}, vencimento ${formatDateShort(sub.date)}. Toque para gerenciar.`}
                    style={({ pressed }) => [
                      styles.recurringItem,
                      { backgroundColor: isDark ? '#1E293B' : colors.surfaceSubtle },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={styles.recurringItemLeft}>
                      <View
                        style={[
                          styles.catSmallIconCircle,
                          { backgroundColor: meta.bgColor },
                        ]}
                      >
                        <Feather
                          name={meta.iconName}
                          size={15}
                          color={meta.color}
                        />
                      </View>
                      <View>
                        <Text style={[styles.recurringItemTitle, { color: isDark ? '#F8FAFC' : colors.textPrimary }]}>
                          {sub.title}
                        </Text>
                        <Text style={[styles.recurringItemSub, { color: isDark ? '#CBD5E1' : colors.textSecondary }]}>
                          Próximo vencimento: {formatDateShort(sub.date)}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.recurringItemAmount, { color: isDark ? '#F8FAFC' : colors.textPrimary }]}>
                      {formatCurrency(sub.amount)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.recurringFooterRow, { borderTopColor: colors.borderLight }]}>
              <Text style={[styles.recurringFooterLabel, { color: colors.textSecondary }]}>
                Total mensal
              </Text>
              <Text style={styles.recurringFooterTotal}>
                {formatCurrency(totalRecurringAmount)}
              </Text>
            </View>
          </AppCard>
        </AnimatedEntrance>
        </View>
      </ScrollView>

      {/* ── Modal Simulador de Parcelas ── */}
      <SimulatorModal
        visible={simulatorModalVisible}
        onClose={() => setSimulatorModalVisible(false)}
      />

      {/* ── Modal CRUD de Metas Financeiras ── */}
      <GoalModal
        visible={goalModalVisible}
        editingGoal={editingGoal}
        onClose={() => setGoalModalVisible(false)}
      />

      {/* ── Modal CRUD de Orçamento por Categoria ── */}
      <BudgetModal
        visible={budgetModalVisible}
        initialCategoryId={selectedBudgetCategory}
        onClose={() => setBudgetModalVisible(false)}
      />

      {/* ── Modal de Alerta Instrutivo de Orçamento (Heurística 9 — Ícone !) ── */}
      <Modal
        visible={Boolean(alertCategorySummary)}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertCategorySummary(null)}
      >
        <View style={styles.alertBackdrop}>
          <View style={[styles.alertDialog, { backgroundColor: colors.surface }]}>
            <Pressable
              onPress={() => setAlertCategorySummary(null)}
              accessibilityRole="button"
              accessibilityLabel="Fechar diagnóstico de orçamento"
              style={[styles.alertCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>

            <View
              style={[
                styles.alertIconCircle,
                {
                  backgroundColor: alertCategorySummary?.isOverLimit
                    ? colors.expenseBg
                    : colors.warningBg,
                },
              ]}
            >
              <Feather
                name="alert-triangle"
                size={28}
                color={
                  alertCategorySummary?.isOverLimit
                    ? colors.expense
                    : colors.warningDark
                }
              />
            </View>

            <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
              {alertCategorySummary?.isOverLimit
                ? `Limite de ${alertCategorySummary?.label} ultrapassado`
                : `Acompanhamento de ${alertCategorySummary?.label}`}
            </Text>

            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              Você utilizou{' '}
              <Text style={[styles.alertBold, { color: colors.textPrimary }]}>
                {Math.round(alertCategorySummary?.percentageOfLimit ?? 0)}%
              </Text>{' '}
              do orçamento definido para a categoria{' '}
              <Text style={[styles.alertBold, { color: colors.textPrimary }]}>
                {alertCategorySummary?.label}
              </Text>{' '}
              neste mês.
            </Text>

            {alertCategorySummary ? (
              <View style={[styles.alertSummaryBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.alertSummaryLine, { color: colors.textSecondary }]}>
                  Gasto acumulado:{' '}
                  <Text style={[styles.alertBold, { color: colors.textPrimary }]}>
                    {formatCurrency(alertCategorySummary.spent)}
                  </Text>
                </Text>
                <Text style={[styles.alertSummaryLine, { color: colors.textSecondary }]}>
                  Limite definido:{' '}
                  <Text style={[styles.alertBold, { color: colors.textPrimary }]}>
                    {formatCurrency(alertCategorySummary.limit)}
                  </Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.alertButtonsRow}>
              <View style={styles.alertBtnCol}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setAlertCategorySummary(null)}
                />
              </View>
              <View style={styles.alertBtnCol}>
                <AppButton
                  title="Ajustar Limite"
                  tone="accent"
                  onPress={() => {
                    const cat = alertCategorySummary?.categoryId;
                    setAlertCategorySummary(null);
                    if (cat) {
                      handleOpenBudgetModal(cat);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal para Editar Meta Global Mensal ── */}
      <Modal
        visible={globalLimitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGlobalLimitModalVisible(false)}
      >
        <View style={styles.alertBackdrop}>
          <View style={[styles.alertDialog, { backgroundColor: colors.surface }]}>
            <Pressable
              onPress={() => setGlobalLimitModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar edição de meta mensal"
              style={[styles.alertCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>

            <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
              Editar Meta Mensal Global
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              Defina o teto total de gastos planejados para o mês.
            </Text>

            <View style={styles.globalLimitInputWrap}>
              <AppInput
                label="Meta mensal (R$)"
                placeholder="0,00"
                value={globalLimitInput}
                onChangeText={(txt) =>
                  setGlobalLimitInput(formatCurrencyInput(txt))
                }
                keyboardType="numeric"
                prefixText="R$"
                errorMessage={globalLimitError ?? undefined}
              />
            </View>

            <View style={styles.alertButtonsRow}>
              <View style={styles.alertBtnCol}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setGlobalLimitModalVisible(false)}
                />
              </View>
              <View style={styles.alertBtnCol}>
                <AppButton
                  title="Salvar"
                  tone="accent"
                  loading={savingGlobalLimit}
                  onPress={() => void handleSaveGlobalLimit()}
                />
              </View>
            </View>
          </View>
        </View>
        <KeyboardDoneAccessory />
      </Modal>
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
  headerBudgetBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  headerBudgetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerBudgetTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    ...typography.headerTitleShadow,
  },
  headerUsageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  headerUsageBadgeOver: {
    backgroundColor: colors.expense,
  },
  headerUsageBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerUsageBadgeTextOver: {
    color: colors.textInverse,
  },
  headerProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  headerBudgetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  headerAmountCaption: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  headerAmountStrong: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  editMetaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
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
  addPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  addPillButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  goalsList: {
    gap: spacing.md,
  },
  goalCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  goalCardPressed: {
    opacity: 0.9,
  },
  goalCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  goalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  goalContentCol: {
    flex: 1,
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  goalTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  goalPctPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  goalPctText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  goalProgressBar: {
    marginBottom: spacing.xs + 2,
  },
  goalAmountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalCurrentText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  goalDeadlineText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  goalSavedStrong: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  },
  goalRemainingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  goalCompletedText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.income,
  },
  goalChevron: {
    marginTop: 12,
  },
  budgetCategoriesList: {
    gap: 2,
  },
  budgetCategoryRow: {
    paddingVertical: spacing.md,
    gap: spacing.xs + 2,
  },
  budgetCategoryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  budgetCategoryPressed: {
    opacity: 0.85,
  },
  budgetCategoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catSmallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCategoryLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  budgetCategoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  warningInteractiveBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCategorySpentText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  budgetCategoryLimitText: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  recurringList: {
    gap: spacing.sm,
  },
  recurringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  recurringItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recurringItemTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  recurringItemSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recurringItemAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
  },
  recurringFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  recurringFooterLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  recurringFooterTotal: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
  },
  alertBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  alertDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  alertCloseBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  alertMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  alertBold: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  alertSummaryBox: {
    width: '100%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 4,
  },
  alertSummaryLine: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  alertButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  alertBtnCol: {
    flex: 1,
  },
  globalLimitInputWrap: {
    width: '100%',
    marginBottom: spacing.lg,
  },
});

export default PlanningScreen;
