import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressBar } from '../../components/common/ProgressBar';
import { TopExpensesPie } from '../../components/charts/TopExpensesPie';
import { PatrimonyChart } from '../../components/charts/PatrimonyChart';
import { WeeklyComparisonCard } from '../../components/charts/WeeklyComparisonCard';
import { AnimatedEntrance, AnimatedValue } from '../../components/animated';
import { exportExcelReport } from '../../utils/exportExcel';
import { getGoalPresetByIcon } from '../../components/modals/GoalModal';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateHealthScore } from '../../utils/healthScore';
import { formatCurrency } from '../../utils/currency';
import { calculateCurrentPatrimonyVariation } from '../../utils/patrimony';
import {
  extractYearMonth,
  isCurrentMonth,
  matchesPeriodFilter,
  type PeriodFilterType,
} from '../../utils/date';
import { getCategoryById } from '../../constants/categories';
import type { MainTabScreenProps } from '../../@types/navigation';
import type { CategoryId } from '../../models';
import type { TopExpenseItem } from '../../contexts/FinanceContext';

type Props = MainTabScreenProps<'Reports'>;

type ReportTab = 'all' | 'health' | 'expenses' | 'evolution';
type PeriodFilter = PeriodFilterType;

export const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    transactions,
    goals,
    budgets,
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    expensesByCategory,
    top3Expenses,
    triggerSuccessFeedback,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<ReportTab>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const hideValues = user?.hideBalance ?? false;
  const globalLimit = user?.monthlyGlobalLimit ?? 4689.2;

  // 1. Score de Saúde Financeira e Blocos Diagnósticos
  const healthData = useMemo(
    () =>
      calculateHealthScore({
        monthlyIncome,
        monthlyExpenses,
        monthlyGlobalLimit: globalLimit,
        budgets,
        expensesByCategory,
        goals,
      }),
    [
      monthlyIncome,
      monthlyExpenses,
      globalLimit,
      budgets,
      expensesByCategory,
      goals,
    ],
  );

  // Referência dinâmica: mês atual do sistema ou data mais recente nos lançamentos
  const effectiveRefDate = useMemo(() => {
    const now = new Date();
    const hasCurrentMonth = transactions.some((t) =>
      isCurrentMonth(t.date, now),
    );
    if (hasCurrentMonth) return now;
    if (transactions.length > 0) {
      const sorted = [...transactions].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
      const ym = extractYearMonth(sorted[0].date);
      if (ym) return new Date(ym.year, ym.month - 1, 1);
    }
    return now;
  }, [transactions]);

  // 3. Gastos por Período Específico (Mês | Semestre | Ano | Geral)
  const periodAnalytics = useMemo(() => {
    const filteredExpenses = transactions.filter(
      (tx) =>
        tx.type === 'expense' &&
        matchesPeriodFilter(tx.date, periodFilter, effectiveRefDate),
    );

    const totalExpenseInPeriod = filteredExpenses.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    // Agrupamento por categoria no período selecionado
    const byCatMap = new Map<CategoryId, number>();
    for (const tx of filteredExpenses) {
      byCatMap.set(
        tx.categoryId,
        (byCatMap.get(tx.categoryId) ?? 0) + tx.amount,
      );
    }

    const breakdown = Array.from(byCatMap.entries())
      .map(([catId, amount]) => {
        const meta = getCategoryById(catId);
        const pct =
          totalExpenseInPeriod > 0
            ? (amount / totalExpenseInPeriod) * 100
            : 0;
        return {
          categoryId: catId,
          label: meta.label,
          color: meta.color,
          bgColor: meta.bgColor,
          iconName: meta.iconName,
          amount,
          percentage: pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const top3InPeriod: TopExpenseItem[] = breakdown
      .slice(0, 3)
      .map((item, index) => ({
        rank: index + 1,
        categoryId: item.categoryId,
        label: item.label,
        color: item.color,
        bgColor: item.bgColor,
        iconName: item.iconName,
        amount: item.amount,
        percentage: item.percentage,
      }));

    return {
      transactionsCount: filteredExpenses.length,
      totalExpense: totalExpenseInPeriod,
      breakdown,
      top3Expenses: top3InPeriod,
      recentItems: filteredExpenses.slice(0, 5),
    };
  }, [transactions, periodFilter, effectiveRefDate]);

  // Rótulo amigável do período ativo no filtro de Maiores Gastos
  const activePeriodLabel = useMemo(() => {
    const ym = extractYearMonth(effectiveRefDate.toISOString());
    const year = ym?.year ?? effectiveRefDate.getFullYear();
    const month = ym?.month ?? effectiveRefDate.getMonth() + 1;
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const monthName = monthNames[month - 1] ?? 'Mês atual';

    switch (periodFilter) {
      case 'month':
        return `${monthName} de ${year}`;
      case 'semester': {
        const semester = month <= 6 ? 1 : 2;
        return `${semester}º Semestre de ${year}`;
      }
      case 'year':
        return `Ano de ${year}`;
      case 'all':
        return 'Histórico Geral';
      default:
        return `${monthName} de ${year}`;
    }
  }, [periodFilter, effectiveRefDate]);

  // Variação percentual real do patrimônio no período (semestre atual)
  const patrimonyVariation = useMemo(
    () => calculateCurrentPatrimonyVariation(transactions, currentBalance),
    [transactions, currentBalance],
  );

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Importante para iOS: Fecha o modal antes de chamar Sharing.shareAsync
      // e aguarda 500ms para garantir que a UIActivityViewController não seja bloqueada
      setExportModalVisible(false);
      await new Promise((resolve) => setTimeout(resolve, 500));

      await exportExcelReport({
        userName: user?.name ?? 'Usuário',
        userEmail: user?.email ?? 'usuario@email.com',
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        globalLimit,
        healthData,
        top3Expenses,
        goals,
        transactions,
      });
      triggerSuccessFeedback('Planilha exportada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao exportar planilha:', err);
      Alert.alert(
        'Erro ao exportar',
        err?.message ?? 'Não foi possível gerar e compartilhar a planilha.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Cálculo do arco do medidor semicircular (Gauge SVG)
  const scoreAngleDash = useMemo(() => {
    // Comprimento aproximado do arco semicircular de raio 70 = pi * 70 ≈ 220
    const circumference = 220;
    const filled = (healthData.score / 100) * circumference;
    return `${filled.toFixed(1)} ${circumference}`;
  }, [healthData.score]);

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
        {/* ── Cabeçalho Global ── */}
        <GlobalHeader
          variant="internal"
          title="Análise e Relatórios"
          avatarUri={user?.avatarUri}
          onPressSettings={() => navigation.navigate('Settings')}
          onPressProfile={() => navigation.navigate('ProfileEdit')}
        >
          {/* Seletor de Abas de Relatório */}
          <View style={styles.tabsBar}>
            {(
              [
                { id: 'all', label: 'Visão Geral' },
                { id: 'health', label: 'Saúde' },
                { id: 'expenses', label: 'Top Gastos' },
                { id: 'evolution', label: 'Evolução' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.tabPill,
                    active && { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      active && {
                        color: isDark ? colors.accent : colors.primary,
                        fontFamily: typography.fontFamily.bold,
                        fontWeight: typography.fontWeight.bold,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlobalHeader>

        <View style={styles.body}>
          {/* ══════════════════════════════════════════════════════════
              SUB-ABA 1: VISÃO GERAL (activeTab === 'all')
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'all' && (
            <>
              {/* Card 1: Saúde Financeira Compacto */}
              <AnimatedEntrance delay={0}>
                <AppCard>
                  <View style={styles.compactCardRow}>
                    <View style={styles.compactCardLeft}>
                      <View
                        style={[
                          styles.sectionIconCircle,
                          { backgroundColor: colors.incomeBg },
                        ]}
                      >
                        <Feather
                          name="activity"
                          size={16}
                          color={colors.income}
                        />
                      </View>
                      <View>
                        <Text style={[styles.compactCardTitle, { color: colors.textPrimary }]}>Saúde Financeira</Text>
                        <View style={styles.compactScoreRow}>
                          <Text
                            style={[
                              styles.compactScoreText,
                              { color: healthData.statusColor },
                            ]}
                          >
                            {healthData.score}
                            <Text style={[styles.compactScoreMax, { color: colors.textSecondary }]}>/100</Text>
                          </Text>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor: healthData.statusBg,
                                marginLeft: spacing.sm,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                { color: healthData.statusColor },
                              ]}
                            >
                              {healthData.statusLabel}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setActiveTab('health')}
                      accessibilityRole="button"
                      accessibilityLabel="Ver diagnóstico da saúde financeira"
                      style={styles.compactLinkBtn}
                    >
                      <Text style={[styles.compactLinkText, { color: colors.accent }]}>Ver diagnóstico</Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={colors.accent}
                      />
                    </Pressable>
                  </View>
                </AppCard>
              </AnimatedEntrance>

              {/* Card 2: Resumo Gastos e Patrimônio (2 colunas lado a lado) */}
              <AnimatedEntrance delay={60}>
                <AppCard>
                  <View style={styles.twoColRow}>
                    {/* Coluna Esquerda: Maior Categoria */}
                    <View style={styles.twoColBox}>
                      <Text style={[styles.twoColSubtitle, { color: colors.textSecondary }]}>Maior Categoria</Text>
                      <Text style={[styles.twoColHighlight, { color: colors.textPrimary }]} numberOfLines={1}>
                        {top3Expenses[0]?.label ?? 'Nenhuma'}
                      </Text>
                      <AnimatedValue
                        value={top3Expenses[0]?.amount ?? 0}
                        style={[styles.twoColAmount, { color: colors.expense }]}
                        hideValues={hideValues}
                      />
                      <Text style={[styles.twoColPct, { color: colors.textSecondary }]}>
                        {top3Expenses[0]
                          ? `${Math.round(top3Expenses[0].percentage)}% do total`
                          : '0% do total'}
                      </Text>
                      <Pressable
                        onPress={() => setActiveTab('expenses')}
                        accessibilityRole="button"
                        accessibilityLabel="Ver maiores gastos detalhados"
                        style={styles.twoColLinkBtn}
                      >
                        <Text style={[styles.twoColLinkText, { color: colors.accent }]}>Ver gastos</Text>
                        <Feather
                          name="chevron-right"
                          size={12}
                          color={colors.accent}
                        />
                      </Pressable>
                    </View>

                    {/* Divisor vertical */}
                    <View style={[styles.twoColDivider, { backgroundColor: colors.border }]} />

                    {/* Coluna Direita: Patrimônio Atual */}
                    <View style={styles.twoColBox}>
                      <Text style={[styles.twoColSubtitle, { color: colors.textSecondary }]}>Patrimônio Atual</Text>
                      <AnimatedValue
                        value={currentBalance}
                        style={[
                          styles.twoColAmountMain,
                          {
                            color:
                              currentBalance < 0
                                ? colors.danger
                                : isDark
                                ? '#F8FAFC'
                                : colors.textPrimary,
                          },
                        ]}
                        hideValues={hideValues}
                      />
                      <View
                        style={[
                          styles.twoColBadge,
                          {
                            backgroundColor:
                              patrimonyVariation.percent < 0 || currentBalance < 0
                                ? colors.expenseBg
                                : patrimonyVariation.percent > 0
                                ? colors.incomeBg
                                : colors.background,
                          },
                        ]}
                      >
                        <Feather
                          name={
                            patrimonyVariation.percent < 0 || currentBalance < 0
                              ? 'trending-down'
                              : patrimonyVariation.percent > 0
                              ? 'trending-up'
                              : 'minus'
                          }
                          size={11}
                          color={
                            patrimonyVariation.percent < 0 || currentBalance < 0
                              ? colors.expense
                              : patrimonyVariation.percent > 0
                              ? colors.income
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.twoColBadgeText,
                            {
                              color:
                                patrimonyVariation.percent < 0 || currentBalance < 0
                                ? colors.expense
                                : patrimonyVariation.percent > 0
                                ? colors.income
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {patrimonyVariation.formattedPercent}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setActiveTab('evolution')}
                        accessibilityRole="button"
                        accessibilityLabel="Ver evolução patrimonial detalhada"
                        style={styles.twoColLinkBtn}
                      >
                        <Text style={[styles.twoColLinkText, { color: colors.accent }]}>Ver evolução</Text>
                        <Feather
                          name="chevron-right"
                          size={12}
                          color={colors.accent}
                        />
                      </Pressable>
                    </View>
                  </View>
                </AppCard>
              </AnimatedEntrance>

              {/* Card 3: Progresso das Metas Compacto */}
              <AnimatedEntrance delay={120}>
                <AppCard>
                  <View style={styles.compactCardHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <View
                        style={[
                          styles.sectionIconCircle,
                          { backgroundColor: colors.incomeBg },
                        ]}
                      >
                        <Feather name="target" size={16} color={colors.income} />
                      </View>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progresso das Metas</Text>
                    </View>
                    <Pressable
                      onPress={() => setActiveTab('health')}
                      accessibilityRole="button"
                      accessibilityLabel="Ver detalhes do progresso das metas"
                      style={styles.compactLinkBtn}
                    >
                      <Text style={[styles.compactLinkText, { color: colors.accent }]}>Detalhes</Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={colors.accent}
                      />
                    </Pressable>
                  </View>

                  {goals.length > 0 ? (
                    <View style={styles.compactGoalsList}>
                      {goals.slice(0, 3).map((goal) => {
                        const pct =
                          goal.targetAmount > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (goal.currentAmount / goal.targetAmount) * 100,
                                ),
                              )
                            : 0;
                        return (
                          <View key={goal.id} style={styles.compactGoalItem}>
                            <View style={styles.compactGoalItemHeader}>
                              <Text
                                style={[styles.compactGoalItemTitle, { color: colors.textPrimary }]}
                                numberOfLines={1}
                              >
                                {goal.title}
                              </Text>
                              <Text style={[styles.compactGoalItemPct, { color: colors.textSecondary }]}>{pct}%</Text>
                            </View>
                            <ProgressBar
                              current={goal.currentAmount}
                              target={goal.targetAmount}
                              barColor={goal.color}
                              mode="goal"
                              height={6}
                            />
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <EmptyState
                      iconName="target"
                      title="Nenhuma meta cadastrada"
                      description="Cadastre suas metas na aba Planejamento para acompanhar seu progresso."
                      actionLabel="Criar Meta"
                      onActionPress={() => navigation.navigate('Planning')}
                    />
                  )}
                </AppCard>
              </AnimatedEntrance>

              {/* Card 4: Exportar Relatório */}
              <AnimatedEntrance delay={180}>
                <AppCard>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <View
                        style={[
                          styles.sectionIconCircle,
                          { backgroundColor: colors.brandTurquoiseLight },
                        ]}
                      >
                        <Feather
                          name="file-text"
                          size={16}
                          color={isDark ? colors.accent : colors.headerBg}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Exportar Relatório
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                          Planilha completa com Resumo Executivo e Lançamentos
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ marginTop: spacing.xs }}>
                    <AppButton
                      title="Exportar Planilha"
                      tone="accent"
                      leftIcon="download"
                      onPress={() => setExportModalVisible(true)}
                    />
                  </View>
                </AppCard>
              </AnimatedEntrance>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              SUB-ABA 2: SAÚDE (activeTab === 'health')
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'health' && (
            <>
              {/* Saúde Financeira Detalhado */}
              <AnimatedEntrance delay={0}>
                <AppCard>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleGroup}>
                    <View
                      style={[
                        styles.sectionIconCircle,
                        { backgroundColor: colors.incomeBg },
                      ]}
                    >
                      <Feather
                        name="activity"
                        size={16}
                        color={colors.income}
                      />
                    </View>
                    <View>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Saúde Financeira
                      </Text>
                      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        Índice calculado com base nos seus hábitos
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: healthData.statusBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: healthData.statusColor },
                      ]}
                    >
                      {healthData.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Medidor Semicircular SVG */}
                <View
                  style={styles.gaugeWrapper}
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel={`Score de Saúde Financeira: ${healthData.score} de 100 pontos. Status ${healthData.statusLabel}.`}
                >
                  <Svg width={200} height={115} viewBox="0 0 200 115">
                    {/* Trilho de fundo */}
                    <Path
                      d="M 30 95 A 70 70 0 0 1 170 95"
                      fill="none"
                      stroke={isDark ? colors.borderLight : colors.divider}
                      strokeWidth={14}
                      strokeLinecap="round"
                    />
                    {/* Arco preenchido proporcional ao score */}
                    <Path
                      d="M 30 95 A 70 70 0 0 1 170 95"
                      fill="none"
                      stroke={healthData.statusColor}
                      strokeWidth={14}
                      strokeLinecap="round"
                      strokeDasharray={scoreAngleDash}
                    />
                  </Svg>

                  <View style={styles.gaugeCenterTextWrap}>
                    <Text
                      style={[
                        styles.gaugeScoreValue,
                        { color: healthData.statusColor },
                      ]}
                    >
                      {healthData.score}
                    </Text>
                    <Text style={[styles.gaugeScoreSub, { color: colors.textSecondary }]}>
                      de 100 pts
                    </Text>
                  </View>
                </View>

                {/* Explicação Contextual do Score */}
                <View style={[styles.diagnosticsContainer, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.diagnosticsHeading, { color: colors.textPrimary }]}>
                    Diagnóstico detalhado do seu índice
                  </Text>

                  {healthData.diagnostics.map((diag) => {
                    const isPositive = diag.tone === 'positive';
                    const isDanger = diag.tone === 'danger';
                    const isWarning = diag.tone === 'warning';

                    const bg = isDark
                      ? isPositive
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isDanger
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isWarning
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(20, 184, 166, 0.15)'
                      : isPositive
                        ? '#F0FDF4'
                        : isDanger
                          ? '#FEF2F2'
                          : isWarning
                            ? '#FFFBEB'
                            : '#F0FDFA';
                    const border = isDark
                      ? isPositive
                        ? 'rgba(16, 185, 129, 0.35)'
                        : isDanger
                          ? 'rgba(239, 68, 68, 0.35)'
                          : isWarning
                            ? 'rgba(245, 158, 11, 0.35)'
                            : 'rgba(20, 184, 166, 0.35)'
                      : isPositive
                        ? '#BBF7D0'
                        : isDanger
                          ? '#FECACA'
                          : isWarning
                            ? '#FDE68A'
                            : '#99F6E4';
                    const iconColor = isPositive
                      ? colors.income
                      : isDanger
                        ? colors.expense
                        : isWarning
                          ? colors.warningDark
                          : isDark
                            ? colors.accent
                            : colors.headerBg;
                    const iconName = isPositive
                      ? 'check-circle'
                      : isDanger || isWarning
                        ? 'alert-triangle'
                        : 'info';

                    return (
                      <View
                        key={diag.id}
                        style={[
                          styles.diagnosticCard,
                          { backgroundColor: bg, borderColor: border },
                        ]}
                      >
                        <Feather
                          name={iconName}
                          size={18}
                          color={iconColor}
                          style={styles.diagnosticIcon}
                        />
                        <View style={styles.diagnosticTextCol}>
                          <View style={styles.diagnosticTitleRow}>
                            <Text style={[styles.diagnosticTitle, { color: colors.textPrimary }]}>
                              {diag.title}
                            </Text>
                            {diag.metricBadge ? (
                              <View
                                style={[
                                  styles.diagnosticBadge,
                                  { backgroundColor: isDark ? colors.surfaceSubtle : colors.surface },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.diagnosticBadgeText,
                                    { color: iconColor },
                                  ]}
                                >
                                  {diag.metricBadge}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.diagnosticDesc, { color: colors.textSecondary }]}>
                            {diag.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AppCard>
            </AnimatedEntrance>

            {/* Progresso Percentual das Metas Ativas */}
            <AnimatedEntrance delay={60}>
              <AppCard>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleGroup}>
                    <View
                      style={[
                        styles.sectionIconCircle,
                        { backgroundColor: colors.incomeBg },
                      ]}
                    >
                      <Feather
                        name="target"
                        size={16}
                        color={colors.income}
                      />
                    </View>
                    <View>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Progresso Percentual das Metas Ativas
                      </Text>
                      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        Média geral de conclusão: {healthData.averageGoalPercent}%
                      </Text>
                    </View>
                  </View>
                </View>

                {goals.length > 0 ? (
                  <View style={styles.goalsReportList}>
                    {goals.map((goal) => {
                      const preset = getGoalPresetByIcon(goal.icon);
                      return (
                        <View
                          key={goal.id}
                          style={[
                            styles.goalReportItem,
                            { backgroundColor: colors.surfaceSubtle },
                          ]}
                        >
                          <View style={styles.goalReportTopRow}>
                            <View style={styles.goalReportTitleRow}>
                              <View
                                style={[
                                  styles.goalIconSmall,
                                  { backgroundColor: `${goal.color}20` },
                                ]}
                              >
                                <Feather
                                  name={preset.iconName}
                                  size={14}
                                  color={goal.color}
                                />
                              </View>
                              <Text style={[styles.goalReportTitle, { color: colors.textPrimary }]}>
                                {goal.title}
                              </Text>
                            </View>
                            <Text style={[styles.goalReportAmounts, { color: colors.textSecondary }]}>
                              {hideValues
                                ? 'R$ •••••'
                                : `${formatCurrency(
                                    goal.currentAmount,
                                  )} / ${formatCurrency(goal.targetAmount)}`}
                            </Text>
                          </View>
                          <ProgressBar
                            current={goal.currentAmount}
                            target={goal.targetAmount}
                            barColor={goal.color}
                            mode="goal"
                            height={8}
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <EmptyState
                    iconName="target"
                    title="Nenhuma meta financeira ativa"
                    description="Defina metas na aba Planejamento para acompanhar o progresso percentual nos relatórios."
                    actionLabel="Ir para Planejamento"
                    onActionPress={() => navigation.navigate('Planning')}
                  />
                )}
              </AppCard>
            </AnimatedEntrance>
          </>
        )}

          {/* ══════════════════════════════════════════════════════════
              SUB-ABA 3: TOP GASTOS (activeTab === 'expenses')
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'expenses' && (
            <>
              {/* Card 1: Maiores Gastos do Período (com Seletor Segmentado Mês / Semestre / Ano / Geral) */}
              <AnimatedEntrance delay={0}>
                <AppCard>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <View
                        style={[
                          styles.sectionIconCircle,
                          { backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF' },
                        ]}
                      >
                        <Feather
                          name="pie-chart"
                          size={16}
                          color={isDark ? '#C084FC' : '#9333EA'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.topGastosTitleRow}>
                          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Maiores Gastos
                          </Text>
                          <View
                            style={[
                              styles.activePeriodBadge,
                              {
                                backgroundColor: colors.surfaceSubtle,
                                borderColor: colors.borderLight,
                              },
                            ]}
                          >
                            <Feather name="calendar" size={11} color={colors.accent} />
                            <Text
                              style={[
                                styles.activePeriodBadgeText,
                                { color: isDark ? '#E2E8F0' : colors.textSecondary },
                              ]}
                            >
                              {activePeriodLabel}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                          Distribuição de despesas por categoria
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Seletor Segmentado de 4 opções */}
                  <View
                    style={[
                      styles.periodSelectorRow,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    {(
                      [
                        { id: 'month', label: 'Mês' },
                        { id: 'semester', label: 'Semestre' },
                        { id: 'year', label: 'Ano' },
                        { id: 'all', label: 'Geral' },
                      ] as const
                    ).map((item) => {
                      const active = periodFilter === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setPeriodFilter(item.id)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={`Filtrar por ${item.label}`}
                          style={[
                            styles.periodBtn,
                            active && [styles.periodBtnActive, { backgroundColor: colors.accent }],
                          ]}
                        >
                          <Text
                            style={[
                              styles.periodBtnText,
                              { color: active ? '#081F4D' : colors.textSecondary },
                              active && styles.periodBtnTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TopExpensesPie
                    top3Expenses={periodAnalytics.top3Expenses}
                    totalMonthlyExpenses={periodAnalytics.totalExpense}
                    hideValues={hideValues}
                    onSelectCategory={(categoryId) =>
                      navigation.navigate('Transactions', {
                        filterCategoryId: categoryId,
                      })
                    }
                  />
                </AppCard>
              </AnimatedEntrance>

              {/* Card 2: Detalhamento Completo por Categoria no Período Selecionado */}
              <AnimatedEntrance delay={60}>
                <AppCard>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <View
                        style={[
                          styles.sectionIconCircle,
                          { backgroundColor: colors.brandTurquoiseLight },
                        ]}
                      >
                        <Feather
                          name="list"
                          size={16}
                          color={isDark ? colors.accent : colors.primaryBlue}
                        />
                      </View>
                      <View>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Detalhamento por Categoria
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                          Composição proporcional no período selecionado
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.periodSummaryBanner,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <View>
                      <Text style={[styles.periodSummaryLabel, { color: colors.textSecondary }]}>
                        Total gasto no período ({periodAnalytics.transactionsCount}{' '}
                        {periodAnalytics.transactionsCount === 1
                          ? 'lançamento'
                          : 'lançamentos'})
                      </Text>
                      <AnimatedValue
                        value={periodAnalytics.totalExpense}
                        style={[styles.periodSummaryValue, { color: colors.expense }]}
                        hideValues={hideValues}
                      />
                    </View>
                    <Pressable
                      onPress={() => navigation.navigate('Transactions')}
                      accessibilityRole="button"
                      accessibilityLabel="Ver lançamentos completos"
                      style={styles.periodLinkBtn}
                    >
                      <Text style={[styles.periodLinkBtnText, { color: colors.accent }]}>
                        Ver todos
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={colors.accent}
                      />
                    </Pressable>
                  </View>

                  {periodAnalytics.breakdown.length > 0 ? (
                    <View style={styles.periodBreakdownList}>
                      {periodAnalytics.breakdown.map((item) => (
                        <View
                          key={item.categoryId}
                          style={[
                            styles.periodBreakdownItem,
                            { borderBottomColor: colors.borderLight },
                          ]}
                        >
                          <View style={styles.periodBreakdownLeft}>
                            <CategoryBadge
                              categoryId={item.categoryId}
                              variant="icon"
                              size="sm"
                            />
                            <View>
                              <Text style={[styles.periodBreakdownName, { color: colors.textPrimary }]}>
                                {item.label}
                              </Text>
                              <Text style={[styles.periodBreakdownPct, { color: colors.textSecondary }]}>
                                {item.percentage.toFixed(1).replace('.', ',')}% das despesas no período
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.periodBreakdownAmount, { color: colors.expense }]}>
                            {hideValues
                              ? 'R$ •••••'
                              : formatCurrency(item.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      iconName="calendar"
                      title="Sem despesas neste período"
                      description="Não há gastos registrados no recorte selecionado."
                    />
                  )}
                </AppCard>
              </AnimatedEntrance>

              {/* Card Comparativo Semanal (4 Semanas Navegáveis) */}
              <AnimatedEntrance delay={120}>
                <WeeklyComparisonCard
                  transactions={transactions}
                  hideValues={hideValues}
                />
              </AnimatedEntrance>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              SUB-ABA 4: EVOLUÇÃO (activeTab === 'evolution')
              ══════════════════════════════════════════════════════════ */}
          {activeTab === 'evolution' && (
            <>
              <AnimatedEntrance delay={0}>
                <AppCard>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <View
                        style={[
                          styles.sectionIconCircle,
                          { backgroundColor: colors.brandTurquoiseLight },
                        ]}
                      >
                        <Feather
                          name="trending-up"
                          size={16}
                          color={isDark ? colors.accent : colors.headerBg}
                        />
                      </View>
                      <View>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                          Evolução Patrimonial
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                          Acompanhamento do seu saldo ao longo dos meses
                        </Text>
                      </View>
                    </View>
                  </View>

                  <PatrimonyChart
                    transactions={transactions}
                    hideValues={hideValues}
                  />
                </AppCard>
              </AnimatedEntrance>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Modal de Pré-visualização e Exportação de Planilha ── */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Exportar Planilha
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Planilha com 2 abas estruturadas
                </Text>
              </View>
              <Pressable
                onPress={() => setExportModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar exportação"
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.excelPreviewContainer}>
              <View
                style={[
                  styles.excelSheetCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.excelSheetIconWrap}>
                  <Feather
                    name="bar-chart-2"
                    size={18}
                    color={isDark ? colors.accent : colors.headerBg}
                  />
                </View>
                <View style={styles.excelSheetTextCol}>
                  <Text style={[styles.excelSheetTitle, { color: colors.textPrimary }]}>
                    Aba 1: Resumo Executivo
                  </Text>
                  <Text style={[styles.excelSheetDesc, { color: colors.textSecondary }]}>
                    Saldo consolidado, receitas, despesas, score de saúde, diagnóstico, maiores gastos por categoria e metas ativas.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.excelSheetCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.excelSheetIconWrap}>
                  <Feather
                    name="list"
                    size={18}
                    color={isDark ? colors.accent : colors.headerBg}
                  />
                </View>
                <View style={styles.excelSheetTextCol}>
                  <Text style={[styles.excelSheetTitle, { color: colors.textPrimary }]}>
                    Aba 2: Lançamentos
                  </Text>
                  <Text style={[styles.excelSheetDesc, { color: colors.textSecondary }]}>
                    Tabela completa com todos os {transactions.length} registros contendo data, título, categoria, tipo, valor em R$ e recorrência.
                  </Text>
                </View>
              </View>

            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setExportModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar exportação"
                style={[
                  styles.modalCancelBtn,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.surfaceSubtle,
                  },
                ]}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textPrimary }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleExportExcel()}
                disabled={isExporting}
                accessibilityRole="button"
                accessibilityLabel="Compartilhar Planilha"
                style={[
                  styles.modalShareBtn,
                  { backgroundColor: colors.accent },
                  isExporting && styles.modalShareBtnDisabled,
                ]}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#081F4D" />
                ) : (
                  <>
                    <Feather
                      name="share-2"
                      size={18}
                      color="#081F4D"
                    />
                    <Text
                      style={[styles.modalShareBtnText, { color: '#081F4D' }]}
                      numberOfLines={1}
                    >
                      Compartilhar Planilha
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
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
    paddingBottom: 110,
  },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: borderRadius.md,
    padding: 4,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: colors.surface,
  },
  tabPillText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabPillTextActive: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  compactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  compactCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  compactScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  compactScoreText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  compactScoreMax: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
  compactLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  compactLinkText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  twoColBox: {
    flex: 1,
    paddingVertical: 2,
  },
  twoColDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  twoColSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  twoColHighlight: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  twoColAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
    marginTop: 2,
  },
  twoColPct: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  twoColAmountMain: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  twoColBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  twoColBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.income,
  },
  twoColLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  twoColLinkText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  compactCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  compactGoalsList: {
    gap: spacing.sm,
  },
  compactGoalItem: {
    gap: 4,
  },
  compactGoalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactGoalItemTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    marginRight: spacing.sm,
  },
  compactGoalItemPct: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
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
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  topGastosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  activePeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activePeriodBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  statusPillText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    position: 'relative',
  },
  gaugeCenterTextWrap: {
    position: 'absolute',
    bottom: 14,
    alignItems: 'center',
  },
  gaugeScoreValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
  },
  gaugeScoreSub: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  diagnosticsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  diagnosticsHeading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  diagnosticCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  diagnosticIcon: {
    marginTop: 2,
  },
  diagnosticTextCol: {
    flex: 1,
  },
  diagnosticTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  diagnosticTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  diagnosticBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  diagnosticBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  diagnosticDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  periodSelectorRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: 4,
    gap: 4,
    marginBottom: spacing.md,
  },
  periodBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.accent,
  },
  periodBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: '#081F4D',
  },
  periodSummaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  periodSummaryLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  periodSummaryValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
    marginTop: 2,
  },
  periodLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  periodLinkBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  periodBreakdownList: {
    gap: spacing.xs,
  },
  periodBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  periodBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodBreakdownName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  periodBreakdownPct: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  periodBreakdownAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
  },
  goalsReportList: {
    gap: spacing.md,
  },
  goalReportItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  goalReportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalReportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalReportTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  goalReportAmounts: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  excelPreviewContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  excelSheetCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  excelSheetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.brandTurquoiseLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  excelSheetTextCol: {
    flex: 1,
  },
  excelSheetTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  excelSheetDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalShareBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  modalShareBtnDisabled: {
    opacity: 0.6,
  },
  modalShareBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
});
