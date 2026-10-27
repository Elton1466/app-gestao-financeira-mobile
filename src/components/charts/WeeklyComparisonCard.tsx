import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AppCard } from '../common/AppCard';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import type { Transaction } from '../../models';

export interface WeeklyComparisonCardProps {
  transactions: Transaction[];
  hideValues?: boolean;
}

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;

export const WeeklyComparisonCard: React.FC<WeeklyComparisonCardProps> = ({
  transactions,
  hideValues = false,
}) => {
  const { colors, isDark } = useTheme();
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const weeklyData = useMemo(() => {
    const expenseList = transactions.filter((t) => t.type === 'expense');

    const parseTxTime = (dateStr: string): number => {
      if (!dateStr) return 0;
      const normalized =
        dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
      const t = new Date(normalized).getTime();
      return isNaN(t) ? 0 : t;
    };

    let latestTxTime = 0;
    let earliestTxTime = Infinity;
    for (const tx of expenseList) {
      const t = parseTxTime(tx.date);
      if (t > latestTxTime) latestTxTime = t;
      if (t < earliestTxTime && t > 0) earliestTxTime = t;
    }

    const now = Date.now();
    const anchorTime = Math.max(now, latestTxTime);
    const anchorDate = new Date(anchorTime);
    anchorDate.setHours(23, 59, 59, 999);

    const windowEndMs = anchorDate.getTime() - weekOffset * 7 * ONE_DAY;
    const windowStartMs = windowEndMs - 28 * ONE_DAY;

    const w1Start = windowStartMs;
    const w1End = w1Start + ONE_WEEK;
    const w2Start = w1End;
    const w2End = w2Start + ONE_WEEK;
    const w3Start = w2End;
    const w3End = w3Start + ONE_WEEK;
    const w4Start = w3End;
    const w4End = windowEndMs;

    const intervals = [
      { start: w1Start, end: w1End, label: 'Sem. 1', isCurrent: false },
      { start: w2Start, end: w2End, label: 'Sem. 2', isCurrent: false },
      { start: w3Start, end: w3End, label: 'Sem. 3', isCurrent: false },
      {
        start: w4Start,
        end: w4End,
        label: weekOffset === 0 ? 'Atual' : 'Sem. 4',
        isCurrent: weekOffset === 0,
      },
    ];

    const formatDDMM = (ts: number): string => {
      const d = new Date(ts);
      return `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}`;
    };

    const formatDDMMAAAA = (ts: number): string => {
      const d = new Date(ts);
      return `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const fullPeriodLabel = `${formatDDMMAAAA(
      w1Start + 1000,
    )} a ${formatDDMMAAAA(w4End)}`;

    const items = intervals.map((interval, idx) => {
      let sum = 0;
      for (const tx of expenseList) {
        const t = parseTxTime(tx.date);
        if (t > interval.start && t <= interval.end) {
          sum += tx.amount;
        }
      }
      return {
        index: idx,
        label: interval.label,
        dateLabel: formatDDMM(interval.start + 1000),
        value: Math.round(sum * 100) / 100,
        color: interval.isCurrent
          ? isDark
            ? colors.accent
            : colors.headerBg
          : isDark
            ? '#475569'
            : '#CBD5E1',
        isCurrent: interval.isCurrent,
      };
    });

    const val3 = items[2].value;
    const val4 = items[3].value;

    let isDecrease = false;
    let isIncrease = false;
    let diffText = '0,0% em relação à semana anterior';

    if (val3 === 0 && val4 === 0) {
      diffText = '0,0% em relação à semana anterior';
    } else if (val3 === 0 && val4 > 0) {
      isIncrease = true;
      diffText = '+100,0% em relação à semana anterior';
    } else if (val3 > 0 && val4 === 0) {
      isDecrease = true;
      diffText = '-100,0% em relação à semana anterior';
    } else {
      const diff = val4 - val3;
      const pct = Math.abs((diff / val3) * 100);
      const formatted = pct.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

      if (diff < 0) {
        isDecrease = true;
        diffText = `-${formatted}% em relação à semana anterior`;
      } else if (diff > 0) {
        isIncrease = true;
        diffText = `+${formatted}% em relação à semana anterior`;
      } else {
        diffText = '0,0% em relação à semana anterior';
      }
    }

    const canGoBack = earliestTxTime < windowStartMs || weekOffset < 52;

    return {
      fullPeriodLabel,
      items,
      val3,
      val4,
      isDecrease,
      isIncrease,
      diffText,
      canGoBack,
    };
  }, [transactions, weekOffset, isDark, colors.accent, colors.headerBg]);

  const maxVal = useMemo(
    () => Math.max(...weeklyData.items.map((i) => i.value), 100),
    [weeklyData.items],
  );

  return (
    <AppCard>
      {/* ── Cabeçalho do Card ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(245, 158, 11, 0.2)'
                  : '#FEF3C7',
              },
            ]}
          >
            <Feather
              name="bar-chart-2"
              size={16}
              color={isDark ? colors.warning : colors.warningDark}
            />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Comparativo Semanal
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Gastos das 4 últimas semanas
            </Text>
          </View>
        </View>
      </View>

      {/* ── Seletor de Período com Setas (< e >) ── */}
      <View style={[styles.navRow, { backgroundColor: colors.surfaceSubtle }]}>
        <Pressable
          onPress={() => setWeekOffset((prev) => prev + 1)}
          disabled={!weeklyData.canGoBack}
          accessibilityRole="button"
          accessibilityLabel="Semanas anteriores"
          hitSlop={8}
          style={[
            styles.arrowBtn,
            { backgroundColor: isDark ? colors.surface : colors.background },
            !weeklyData.canGoBack && styles.arrowBtnDisabled,
          ]}
        >
          <Feather
            name="chevron-left"
            size={18}
            color={
              weeklyData.canGoBack
                ? isDark
                  ? colors.accent
                  : colors.headerBg
                : colors.textMuted
            }
          />
        </Pressable>

        <Text style={[styles.navRangeText, { color: colors.textPrimary }]}>
          {weeklyData.fullPeriodLabel}
        </Text>

        <Pressable
          onPress={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
          disabled={weekOffset === 0}
          accessibilityRole="button"
          accessibilityLabel="Próximas semanas"
          hitSlop={8}
          style={[
            styles.arrowBtn,
            { backgroundColor: isDark ? colors.surface : colors.background },
            weekOffset === 0 && styles.arrowBtnDisabled,
          ]}
        >
          <Feather
            name="chevron-right"
            size={18}
            color={
              weekOffset === 0
                ? colors.textMuted
                : isDark
                  ? colors.accent
                  : colors.headerBg
            }
          />
        </Pressable>
      </View>

      {/* ── Gráfico de 4 Barras Verticais SVG ── */}
      <View style={styles.chartWrapper}>
        <Svg width={280} height={115} viewBox="0 0 280 115">
          <Line
            x1={10}
            y1={90}
            x2={270}
            y2={90}
            stroke={colors.borderLight}
            strokeWidth={1}
          />
          <G>
            {weeklyData.items.map((bar, idx) => {
              const h = Math.max(4, Math.round((bar.value / maxVal) * 75));
              const y = 90 - h;
              const x = 20 + idx * 66;
              return (
                <G key={bar.label}>
                  <Rect
                    x={x}
                    y={y}
                    width={42}
                    height={h}
                    rx={8}
                    fill={bar.color}
                  />
                  <SvgText
                    x={x + 21}
                    y={106}
                    fontSize="10"
                    fill={isDark ? '#CBD5E1' : colors.textSecondary}
                    textAnchor="middle"
                  >
                    {bar.label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </View>

      {/* ── Valores e Intervalos das 4 Semanas ── */}
      <View style={styles.valuesGrid}>
        {weeklyData.items.map((item, idx) => (
          <View key={item.index} style={styles.valueCol}>
            <Text style={[styles.valueDate, { color: colors.textSecondary }]}>
              {item.dateLabel}
            </Text>
            <Text
              style={[
                styles.valueAmount,
                { color: colors.textPrimary },
                idx === 3 && {
                  color: isDark ? colors.accent : colors.headerBg,
                  fontFamily: typography.fontFamily.bold,
                  fontWeight: typography.fontWeight.bold,
                },
              ]}
            >
              {hideValues ? 'R$ •••••' : formatCurrency(item.value)}
            </Text>
          </View>
        ))}
      </View>

        {/* ── Badge de Variação Semanal ── */}
        <View
          style={[
            styles.diffBadge,
            {
              backgroundColor: weeklyData.isDecrease
                ? colors.incomeBg
                : colors.expenseBg,
            },
          ]}
        >
          <Feather
            name={weeklyData.isDecrease ? 'trending-down' : 'trending-up'}
            size={14}
            color={weeklyData.isDecrease ? colors.income : colors.expense}
          />
          <Text
            style={[
              styles.diffText,
              {
                color: weeklyData.isDecrease ? colors.income : colors.expense,
              },
            ]}
          >
            {weeklyData.diffText}
          </Text>
        </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  navRangeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  valuesGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  valueCol: {
    alignItems: 'center',
    flex: 1,
  },
  valueDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  valueAmount: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  diffText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
