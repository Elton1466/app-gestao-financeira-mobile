import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import { calculatePatrimonyGrowth } from '../../utils/patrimony';
import type { Transaction } from '../../models';

export interface PatrimonyDataPoint {
  month: string;
  fullLabel: string;
  value: number;
}

export interface PatrimonyChartProps {
  data?: PatrimonyDataPoint[];
  transactions?: Transaction[];
  hideValues?: boolean;
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const MONTH_NAMES_FULL = [
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

export const PatrimonyChart: React.FC<PatrimonyChartProps> = ({
  data: externalData,
  transactions,
  hideValues = false,
}) => {
  const { colors, isDark } = useTheme();
  const now = new Date();
  const currentYear = now.getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Navegação de período (< e >) — Filtro anual exclusivo
  const isNextDisabled = useMemo(() => {
    return selectedYear >= currentYear;
  }, [selectedYear, currentYear]);

  const handlePrevPeriod = () => {
    setSelectedYear((y) => y - 1);
    setSelectedIndex(-1);
  };

  const handleNextPeriod = () => {
    if (isNextDisabled) return;
    setSelectedYear((y) => y + 1);
    setSelectedIndex(-1);
  };

  const periodTitle = `Ano de ${selectedYear}`;

  // Cálculo dos dados do gráfico para os 12 meses do ano selecionado
  const chartData = useMemo<PatrimonyDataPoint[]>(() => {
    if (!transactions && externalData && externalData.length > 0) {
      return externalData;
    }

    const txList = transactions ?? [];
    const monthsToInclude: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return monthsToInclude.map((m) => {
      const lastDay = new Date(selectedYear, m, 0).getDate();
      const cutoffStr = `${selectedYear}-${String(m).padStart(2, '0')}-${String(
        lastDay,
      ).padStart(2, '0')}`;

      let cumulative = 0;
      for (const tx of txList) {
        if (tx.date <= cutoffStr) {
          if (tx.type === 'income') {
            cumulative += tx.amount;
          } else {
            cumulative -= tx.amount;
          }
        }
      }

      return {
        month: MONTH_NAMES_SHORT[m - 1],
        fullLabel: `${MONTH_NAMES_FULL[m - 1]} de ${selectedYear}`,
        value: Math.round(cumulative * 100) / 100,
      };
    });
  }, [transactions, externalData, selectedYear]);

  // Seleção padrão do mês corrente quando visualizando o ano atual
  const defaultIndex = useMemo(() => {
    if (selectedYear === currentYear) {
      const currentMonth = now.getMonth(); // 0 = Jan, ..., 9 = Out
      return Math.min(Math.max(0, currentMonth), chartData.length - 1);
    }
    return chartData.length - 1;
  }, [selectedYear, currentYear, chartData.length, now]);

  const activeIndex =
    selectedIndex >= 0 && selectedIndex < chartData.length
      ? selectedIndex
      : defaultIndex;

  const initialValue = chartData[0]?.value ?? 0;
  const currentValue = chartData[chartData.length - 1]?.value ?? 0;

  // Receitas e despesas totais do ano selecionado para precisão matemática
  const { periodIncomes, periodExpenses } = useMemo(() => {
    const txList = transactions ?? [];
    let incomes = 0;
    let expenses = 0;
    const startStr = `${selectedYear}-01-01`;
    const endStr = `${selectedYear}-12-31`;

    for (const tx of txList) {
      if (tx.date >= startStr && tx.date <= endStr) {
        if (tx.type === 'income') {
          incomes += tx.amount;
        } else {
          expenses += tx.amount;
        }
      }
    }
    return { periodIncomes: incomes, periodExpenses: expenses };
  }, [transactions, selectedYear]);

  const variation = useMemo(
    () => calculatePatrimonyGrowth(initialValue, currentValue),
    [initialValue, currentValue],
  );

  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(260, Math.min(windowWidth - 64, 400));
  const chartHeight = 165;
  const padLeft = 18;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 28;

  const usableWidth = chartWidth - padLeft - padRight;
  const usableHeight = chartHeight - padTop - padBottom;

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values) * 0.92;
  const maxVal = Math.max(...values) * 1.05 || 1;
  const range = Math.max(1, maxVal - minVal);

  const points = chartData.map((item, idx) => {
    const x =
      padLeft +
      (chartData.length > 1
        ? (idx / (chartData.length - 1)) * usableWidth
        : usableWidth / 2);
    const y =
      padTop + usableHeight - ((item.value - minVal) / range) * usableHeight;
    return { x, y, ...item };
  });

  const linePath = points
    .map(
      (pt, idx) =>
        `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    )
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
          padTop + usableHeight
        ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(
          padTop + usableHeight
        ).toFixed(1)} Z`
      : '';

  const selectedPoint = points[activeIndex] || points[points.length - 1];

  const renderValue = (val: number) =>
    hideValues ? 'R$ •••••' : formatCurrency(val);

  return (
    <View style={styles.container}>
      {/* ── Navegação de Período com Setas (< e >) ── */}
      <View style={[styles.periodNavRow, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={handlePrevPeriod}
          accessibilityRole="button"
          accessibilityLabel="Período anterior"
          hitSlop={8}
          style={[styles.navArrowBtn, { backgroundColor: colors.surface }]}
        >
          <Feather name="chevron-left" size={18} color={colors.primary} />
        </Pressable>

        <Text style={[styles.periodNavTitle, { color: colors.textPrimary }]}>{periodTitle}</Text>

        <Pressable
          onPress={handleNextPeriod}
          disabled={isNextDisabled}
          accessibilityRole="button"
          accessibilityLabel="Próximo período"
          hitSlop={8}
          style={[
            styles.navArrowBtn,
            { backgroundColor: colors.surface },
            isNextDisabled && styles.navArrowBtnDisabled,
          ]}
        >
          <Feather
            name="chevron-right"
            size={18}
            color={isNextDisabled ? colors.textMuted : colors.primary}
          />
        </Pressable>
      </View>

      {/* ── Destaque Interativo do Mês Selecionado ── */}
      {selectedPoint ? (
        <View style={[styles.selectedBanner, { backgroundColor: colors.background }]}>
          <Text style={[styles.selectedMonthLabel, { color: colors.textSecondary }]}>
            Patrimônio em {selectedPoint.fullLabel}
          </Text>
          <Text
            style={[
              styles.selectedValueText,
              { color: colors.textPrimary },
              selectedPoint.value < 0 && { color: colors.danger },
            ]}
          >
            {renderValue(selectedPoint.value)}
          </Text>
        </View>
      ) : null}

      {/* ── Gráfico Vetorial SVG ── */}
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="patrimonyGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0%"
                stopColor={colors.accent}
                stopOpacity="0.25"
              />
              <Stop
                offset="100%"
                stopColor={colors.accent}
                stopOpacity="0.01"
              />
            </LinearGradient>
          </Defs>

          {/* Linhas guias horizontais */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padTop + ratio * usableHeight;
            return (
              <Line
                key={`grid-${idx}`}
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke={colors.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}

          {/* Área preenchida sob a curva */}
          {areaPath ? <Path d={areaPath} fill="url(#patrimonyGrad)" /> : null}

          {/* Linha principal de evolução */}
          {linePath ? (
            <Path
              d={linePath}
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Linha vertical de seleção */}
          {selectedPoint ? (
            <Line
              x1={selectedPoint.x}
              y1={padTop}
              x2={selectedPoint.x}
              y2={padTop + usableHeight}
              stroke={colors.accent}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          ) : null}

          {/* Pontos e Rótulos de Mês */}
          {points.map((pt, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <React.Fragment key={pt.month}>
                {/* Hit target transparente ampliado para toque confortável */}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={22}
                  fill="transparent"
                  onPress={() => setSelectedIndex(idx)}
                />
                {/* Ponto visível */}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6 : 3.5}
                  fill={isSelected ? colors.accent : colors.surface}
                  stroke={colors.accent}
                  strokeWidth={isSelected ? 3 : 1.5}
                  onPress={() => setSelectedIndex(idx)}
                />
                {/* Rótulo de texto do mês */}
                <SvgText
                  x={pt.x}
                  y={chartHeight - 6}
                  fontSize="10"
                  fontWeight={isSelected ? '700' : '500'}
                  fill={isSelected ? colors.textPrimary : (isDark ? '#CBD5E1' : colors.textSecondary)}
                  textAnchor="middle"
                  onPress={() => setSelectedIndex(idx)}
                >
                  {pt.month}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Overlay transparente para toque direto e responsivo nas colunas dos 12 meses */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { flexDirection: 'row', paddingLeft: padLeft, paddingRight: padRight },
          ]}
          pointerEvents="box-none"
        >
          {points.map((pt, idx) => (
            <Pressable
              key={`touch-${pt.month}`}
              onPress={() => setSelectedIndex(idx)}
              accessibilityRole="button"
              accessibilityLabel={`${pt.fullLabel}: ${renderValue(pt.value)}`}
              style={styles.monthTouchColumn}
            />
          ))}
        </View>
      </View>

      {/* ── Resumo dos 3 Blocos (Saldo Inicial, Saldo Final, Variação Anual) ── */}
      <View style={[styles.summaryGrid, { borderTopColor: colors.border }]}>
        <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Saldo Inicial</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: colors.textPrimary },
              initialValue < 0 && { color: colors.danger },
            ]}
          >
            {renderValue(initialValue)}
          </Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Saldo Final</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: currentValue < 0 ? colors.danger : colors.primary },
            ]}
          >
            {renderValue(currentValue)}
          </Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Variação Anual</Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  variation.percent < 0 || currentValue < 0
                    ? colors.expense
                    : variation.percent > 0
                    ? colors.income
                    : colors.textSecondary,
              },
            ]}
          >
            {variation.formattedPercent}
          </Text>
        </View>
      </View>

      {/* ── Tabela de Detalhamento Mensal ── */}
      <View style={[styles.monthlyTableContainer, { borderTopColor: colors.border }]}>
        <View style={styles.monthlyTableHeader}>
          <View style={styles.monthlyTableHeaderLeft}>
            <Feather name="calendar" size={14} color={colors.accent} />
            <Text style={[styles.monthlyTableTitle, { color: colors.textPrimary }]}>Detalhamento Mensal</Text>
          </View>
          <Text style={[styles.monthlyTableSubtitle, { color: colors.textSecondary }]}>
            Ano de {selectedYear}
          </Text>
        </View>

        <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tableColHeaderRow, { backgroundColor: colors.surfaceSubtle, borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.tableColHeaderLabel, { color: isDark ? '#E2E8F0' : colors.textSecondary }]}>Mês</Text>
            <Text style={[styles.tableColHeaderLabel, { color: isDark ? '#E2E8F0' : colors.textSecondary, textAlign: 'right' }]}>
              Saldo Acumulado
            </Text>
          </View>

          {chartData.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <Pressable
                key={`month-row-${item.month}-${idx}`}
                onPress={() => setSelectedIndex(idx)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${MONTH_NAMES_FULL[idx]}: saldo acumulado de ${renderValue(item.value)}`}
                style={[
                  styles.tableRow,
                  { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
                  isSelected && {
                    backgroundColor: isDark ? 'rgba(0, 159, 227, 0.18)' : colors.primaryLight,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.accent,
                  },
                  idx === chartData.length - 1 && styles.tableRowLast,
                ]}
              >
                <View style={styles.tableRowLeft}>
                  <View
                    style={[
                      styles.tableMonthBadge,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableMonthBadgeText,
                        { color: isDark ? '#E2E8F0' : colors.textSecondary },
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {item.month}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tableMonthFullText,
                      { color: colors.textPrimary },
                      isSelected && {
                        color: colors.primary,
                        fontFamily: typography.fontFamily.bold,
                        fontWeight: typography.fontWeight.bold,
                      },
                    ]}
                  >
                    {MONTH_NAMES_FULL[idx]}
                  </Text>
                </View>

                <View style={styles.tableRowRight}>
                  <Text
                    style={[
                      styles.tableValueText,
                      { color: colors.textPrimary },
                      isSelected && {
                        color: colors.primary,
                        fontFamily: typography.fontFamily.bold,
                        fontWeight: typography.fontWeight.bold,
                      },
                      item.value < 0 && { color: colors.danger },
                    ]}
                  >
                    {renderValue(item.value)}
                  </Text>
                  {isSelected && (
                    <Feather
                      name="check"
                      size={14}
                      color={colors.accent}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  periodNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: spacing.xs,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  navArrowBtnDisabled: {
    opacity: 0.35,
  },
  periodNavTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  selectedBanner: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectedMonthLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  selectedValueText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  monthTouchColumn: {
    flex: 1,
    height: '100%',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  monthlyTableContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  monthlyTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  monthlyTableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthlyTableTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  monthlyTableSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableColHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableColHeaderLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRowSelected: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  tableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableMonthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 34,
    alignItems: 'center',
  },
  tableMonthBadgeSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tableMonthBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  tableMonthBadgeTextSelected: {
    color: colors.textInverse,
  },
  tableMonthFullText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  tableMonthFullTextSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  tableRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableValueText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  tableValueTextSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
