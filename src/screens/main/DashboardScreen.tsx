import React, { useMemo, useState } from 'react';
import {
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
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { TopExpensesPie } from '../../components/charts/TopExpensesPie';
import { AnimatedEntrance, AnimatedValue } from '../../components/animated';
import { motion } from '../../theme/motion';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import {
  extractYearMonth,
  formatDateShort,
  getMonthYearCompact,
  WEEK_DAYS_SHORT_PT_BR,
} from '../../utils/date';
import { getCategoryById } from '../../constants/categories';
import type { MainTabScreenProps } from '../../@types/navigation';
import type { CategoryId } from '../../models';

type Props = MainTabScreenProps<'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { user, toggleHideBalance } = useAuth();
  const {
    transactions,
    currentBalance,
    monthlyBalance,
    monthlyIncome,
    monthlyExpenses,
    top3Expenses,
    openTransactionModal,
  } = useFinance();

  const intensityStyles: Record<
    0 | 1 | 2 | 3,
    { bg: string; text: string; dot: string }
  > = useMemo(
    () => ({
      0: { bg: 'transparent', text: colors.textPrimary, dot: 'transparent' },
      1: {
        bg: isDark ? 'rgba(0, 159, 227, 0.20)' : '#EAF6FB',
        text: isDark ? colors.textPrimary : colors.primary,
        dot: colors.accent,
      },
      2: {
        bg: isDark ? 'rgba(0, 159, 227, 0.40)' : '#BCE5F6',
        text: isDark ? colors.textPrimary : colors.primary,
        dot: colors.accent,
      },
      3: { bg: colors.accent, text: '#FFFFFF', dot: '#FFFFFF' },
    }),
    [colors, isDark],
  );

  const isHidden = user?.hideBalance ?? false;
  const firstName = user?.name?.split(' ')[0] ?? 'Usuário';
  const recentTransactions = transactions.slice(0, 6);

  // Define o mês inicial do Calendário de Gastos com base na transação mais recente
  const initialCalendarMonth = useMemo(() => {
    const firstExpense = transactions.find((t) => t.type === 'expense');
    if (firstExpense) {
      const ym = extractYearMonth(firstExpense.date);
      if (ym) {
        return { year: ym.year, month: ym.month - 1 };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [transactions]);

  const [calendarCursor, setCalendarCursor] = useState<{
    year: number;
    month: number;
  }>(initialCalendarMonth);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(
    null,
  );

  // Mapa de gastos diários para o mês selecionado no Calendário de Gastos
  const { dailyExpensesMap, maxDailyExpense, calendarCells } = useMemo(() => {
    const { year, month } = calendarCursor;
    const firstWeekDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const map: Record<number, number> = {};

    for (const tx of transactions) {
      if (tx.type === 'expense') {
        const ym = extractYearMonth(tx.date);
        if (ym && ym.year === year && ym.month === month + 1) {
          const dayMatch = tx.date.match(/(?:^\d{4}-\d{2}-(\d{2}))|(?:^(\d{2})\/\d{2}\/\d{4})/);
          const dayStr = dayMatch ? (dayMatch[1] || dayMatch[2]) : null;
          const dayNum = dayStr ? parseInt(dayStr, 10) : new Date(tx.date).getDate();
          if (dayNum >= 1 && dayNum <= 31) {
            map[dayNum] = (map[dayNum] ?? 0) + tx.amount;
          }
        }
      }
    }

    const maxVal = Math.max(0, ...Object.values(map));
    const cells: Array<number | null> = [
      ...Array<null>(firstWeekDay).fill(null),
      ...Array.from({ length: totalDays }, (_, idx) => idx + 1),
    ];
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return {
      dailyExpensesMap: map,
      maxDailyExpense: maxVal,
      calendarCells: cells,
    };
  }, [calendarCursor, transactions]);

  const getDayIntensity = (day: number): 0 | 1 | 2 | 3 => {
    const amount = dailyExpensesMap[day] ?? 0;
    if (amount <= 0 || maxDailyExpense <= 0) {
      return 0;
    }
    const ratio = amount / maxDailyExpense;
    if (ratio >= 0.75) return 3;
    if (ratio >= 0.4) return 2;
    return 1;
  };

  const handlePrevMonth = () => {
    setSelectedCalendarDay(null);
    setCalendarCursor((prev) =>
      prev.month === 0
        ? { year: prev.year - 1, month: 11 }
        : { year: prev.year, month: prev.month - 1 },
    );
  };

  const handleNextMonth = () => {
    setSelectedCalendarDay(null);
    setCalendarCursor((prev) =>
      prev.month === 11
        ? { year: prev.year + 1, month: 0 }
        : { year: prev.year, month: prev.month + 1 },
    );
  };

  const handleSelectTopCategory = (categoryId: CategoryId) => {
    navigation.navigate('Transactions', { filterCategoryId: categoryId });
  };

  const maskValue = (value: number): string =>
    isHidden ? 'R$ ••••••' : formatCurrency(value);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: 100 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Cabeçalho Global (Heurística 8 / WCAG) ── */}
      <GlobalHeader
        variant="dashboard"
        title={`Olá, ${firstName}!`}
        avatarUri={user?.avatarUri}
        onPressSettings={() => navigation.navigate('Settings')}
        onPressProfile={() => navigation.navigate('ProfileEdit')}
      >
        <View style={styles.headerBottomSpacer} />
      </GlobalHeader>

      {/* ── Card Principal: Saldo Atual, Resultado Previsto e Gasto Mensal ── */}
      <AnimatedEntrance delay={motion.duration.stagger * 1} style={styles.balanceCardWrapper}>
        <AppCard style={styles.balanceCard} padding={0}>
          <View style={styles.balanceTopSection}>
            <View style={styles.balanceHeaderRow}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Resultado do Mês</Text>

              <Pressable
                onPress={() => void toggleHideBalance()}
                accessibilityRole="button"
                accessibilityLabel={
                  isHidden ? 'Mostrar saldo' : 'Ocultar saldo'
                }
                style={({ pressed }) => [
                  styles.visibilityButton,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <Feather
                  name={isHidden ? 'eye-off' : 'eye'}
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={[styles.visibilityButtonText, { color: colors.textSecondary }]}>
                  {isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
                </Text>
              </Pressable>
            </View>

            <AnimatedValue
              value={monthlyBalance}
              hidden={isHidden}
              style={[
                styles.balanceAmount,
                { color: colors.textPrimary },
                monthlyBalance < 0 && { color: colors.expense },
              ]}
            />
          </View>

          <View style={[styles.horizontalDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.metricsRow}>
            <View style={styles.metricColumn}>
              <View
                style={[
                  styles.metricIconCircle,
                  { backgroundColor: colors.incomeBg },
                ]}
              >
                <Feather name="trending-up" size={15} color={colors.income} />
              </View>
              <View style={styles.metricTextContainer}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Receitas</Text>
                <AnimatedValue
                  value={monthlyIncome}
                  hidden={isHidden}
                  style={[styles.metricValue, { color: colors.income }]}
                />
              </View>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.metricColumn}>
              <View
                style={[
                  styles.metricIconCircle,
                  { backgroundColor: colors.expenseBg },
                ]}
              >
                <Feather
                  name="trending-down"
                  size={15}
                  color={colors.expense}
                />
              </View>
              <View style={styles.metricTextContainer}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Gasto total</Text>
                <AnimatedValue
                  value={monthlyExpenses}
                  hidden={isHidden}
                  style={[styles.metricValue, { color: colors.expense }]}
                />
              </View>
            </View>
          </View>
        </AppCard>
      </AnimatedEntrance>

      {/* Nota: Sem botão pontilhado "+ Nova transação" no corpo da Dashboard (Heurística 4) */}

      <View style={styles.sectionsContainer}>
        {/* ── Card: Últimas Transações (Figura 1 — Toque para Editar no TransactionModal) ── */}
        <AnimatedEntrance delay={motion.duration.stagger * 2}>
          <AppCard>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Últimas transações</Text>
              <Text style={[styles.totalCounterText, { color: colors.textSecondary }]}>
                {transactions.length} total
              </Text>
            </View>

            {recentTransactions.length > 0 ? (
              <View style={styles.transactionList}>
                {recentTransactions.map((tx, idx) => {
                  const meta = getCategoryById(tx.categoryId);
                  return (
                    <Pressable
                      key={tx.id}
                      onPress={() => openTransactionModal(tx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Transação ${tx.title || meta.label}, data ${formatDateShort(tx.date)}, categoria ${meta.label}, valor ${formatCurrency(tx.amount, true, tx.type)}. Toque para editar.`}
                      style={({ pressed }) => [
                        styles.transactionRow,
                        idx < recentTransactions.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderLight,
                        },
                        pressed && { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <CategoryBadge
                        categoryId={tx.categoryId}
                        variant="icon"
                        size="md"
                      />

                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {tx.title || meta.label}
                        </Text>
                        <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                          {formatDateShort(tx.date)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              tx.type === 'income'
                                ? colors.income
                                : colors.expense,
                          },
                        ]}
                      >
                        {isHidden
                          ? 'R$ ••••'
                          : formatCurrency(tx.amount, true, tx.type)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                iconName="inbox"
                title="Nenhuma transação ainda"
                description="Toque no botão + na barra de navegação inferior para registrar seu primeiro lançamento."
              />
            )}
          </AppCard>
        </AnimatedEntrance>

        {/* ── Card: Top 3 Maiores Gastos Mensais (SVG + Lista Linearizada WCAG Seção 4.2) ── */}
        <AnimatedEntrance delay={motion.duration.stagger * 3}>
          <AppCard>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleGroup}>
                <View
                  style={[
                    styles.cardHeaderIcon,
                    { backgroundColor: colors.brandTurquoiseLight },
                  ]}
                >
                  <Feather
                    name="pie-chart"
                    size={16}
                    color={isDark ? colors.accent : colors.headerBg}
                  />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Top 3 maiores gastos mensais</Text>
              </View>
            </View>

            <TopExpensesPie
              top3Expenses={top3Expenses}
              totalMonthlyExpenses={monthlyExpenses}
              hideValues={isHidden}
              onSelectCategory={handleSelectTopCategory}
            />
          </AppCard>
        </AnimatedEntrance>

        {/* ── Card: Calendário de Gastos Mensal ── */}
        <AnimatedEntrance delay={motion.duration.stagger * 4}>
          <AppCard>
            <View style={styles.calendarHeaderRow}>
              <View style={styles.cardHeaderTitleGroup}>
                <View
                  style={[
                    styles.cardHeaderIcon,
                    { backgroundColor: colors.brandTurquoiseLight },
                  ]}
                >
                  <Feather name="calendar" size={16} color={isDark ? colors.accent : colors.headerBg} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Calendário de gastos</Text>
              </View>

              <View style={styles.calendarNavRow}>
                <Pressable
                  onPress={handlePrevMonth}
                  accessibilityRole="button"
                  accessibilityLabel="Mês anterior"
                  hitSlop={8}
                  style={[styles.calendarNavBtn, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <Feather
                    name="chevron-left"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
                <Text style={[styles.calendarMonthLabel, { color: colors.textPrimary }]}>
                  {getMonthYearCompact(
                    calendarCursor.year,
                    calendarCursor.month,
                  )}
                </Text>
                <Pressable
                  onPress={handleNextMonth}
                  accessibilityRole="button"
                  accessibilityLabel="Próximo mês"
                  hitSlop={8}
                  style={[styles.calendarNavBtn, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Cabeçalho dias da semana */}
            <View style={styles.weekDaysRow}>
              {WEEK_DAYS_SHORT_PT_BR.map((dayName) => (
                <Text key={dayName} style={[styles.weekDayLabel, { color: colors.textSecondary }]}>
                  {dayName}
                </Text>
              ))}
            </View>

            {/* Grade de dias do mês */}
            <View style={styles.calendarGrid}>
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.calendarCell} />;
                }

                const lvl = getDayIntensity(day);
                const styleTokens = intensityStyles[lvl];
                const dayExpense = dailyExpensesMap[day] ?? 0;
                const isSelectedDay = selectedCalendarDay === day;

                return (
                  <Pressable
                    key={`day-${day}`}
                    onPress={() =>
                      setSelectedCalendarDay((prev) =>
                        prev === day ? null : day,
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      dayExpense > 0
                        ? `Dia ${day}, gasto total de ${formatCurrency(dayExpense)}`
                        : `Dia ${day}, sem gastos registrados`
                    }
                    style={styles.calendarCell}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        { backgroundColor: styleTokens.bg },
                        isSelectedDay && { borderWidth: 2, borderColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumberText,
                          { color: styleTokens.text },
                          lvl > 0 && styles.dayNumberBold,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    {lvl > 0 ? (
                      <View
                        style={[
                          styles.expenseDot,
                          { backgroundColor: styleTokens.dot },
                        ]}
                      />
                    ) : (
                      <View style={styles.expenseDotPlaceholder} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Detalhe do dia selecionado */}
            {selectedCalendarDay !== null ? (
              <View style={[styles.selectedDayBanner, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.selectedDayText, { color: colors.textSecondary }]}>
                  Dia {String(selectedCalendarDay).padStart(2, '0')}:{' '}
                  <Text style={[styles.selectedDayAmount, { color: colors.textPrimary }]}>
                    {(dailyExpensesMap[selectedCalendarDay] ?? 0) > 0
                      ? `${formatCurrency(dailyExpensesMap[selectedCalendarDay] ?? 0)} em despesas`
                      : 'Nenhuma despesa registrada neste dia'}
                  </Text>
                </Text>
              </View>
            ) : null}

            {/* Legenda de intensidade */}
            <View style={[styles.legendRow, { borderTopColor: colors.borderLight }]}>
              <Text style={[styles.legendCaption, { color: colors.textSecondary }]}>Intensidade de gastos:</Text>
              <View style={styles.legendBadgeItem}>
                <View
                  style={[styles.legendSwatch, { backgroundColor: isDark ? 'rgba(0, 159, 227, 0.20)' : '#EAF6FB' }]}
                />
                <Text style={[styles.legendItemText, { color: colors.textSecondary }]}>baixo</Text>
              </View>
              <View style={styles.legendBadgeItem}>
                <View
                  style={[styles.legendSwatch, { backgroundColor: isDark ? 'rgba(0, 159, 227, 0.40)' : '#BCE5F6' }]}
                />
                <Text style={[styles.legendItemText, { color: colors.textSecondary }]}>médio</Text>
              </View>
              <View style={styles.legendBadgeItem}>
                <View
                  style={[styles.legendSwatch, { backgroundColor: colors.accent }]}
                />
                <Text style={[styles.legendItemText, { color: colors.textSecondary }]}>alto</Text>
              </View>
            </View>
          </AppCard>
        </AnimatedEntrance>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxl + 16,
  },
  headerBottomSpacer: {
    height: 24,
  },
  balanceCardWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: -44,
    zIndex: 10,
  },
  balanceCard: {
    borderRadius: borderRadius.lg,
  },
  balanceTopSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visibilityButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  verticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.borderLight,
  },
  metricIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  metricTextContainer: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  metricValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  sectionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalCounterText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 82,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  calendarCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayNumberText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
  },
  dayNumberBold: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  },
  expenseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  expenseDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
  selectedDayBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  selectedDayText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  selectedDayAmount: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendCaption: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  legendBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendItemText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  transactionList: {
    gap: 2,
  },
  transactionRow: {
    minHeight: MIN_TOUCH_TARGET + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  transactionRowPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  transactionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  transactionTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  transactionDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
});

export default DashboardScreen;
