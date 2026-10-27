import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import {
  borderRadius,
  colors,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/currency';
import type { CategoryId } from '../../models';
import type { TopExpenseItem } from '../../contexts/FinanceContext';

export interface TopExpensesPieProps {
  top3Expenses: TopExpenseItem[];
  totalMonthlyExpenses: number;
  hideValues?: boolean;
  onSelectCategory?: (categoryId: CategoryId) => void;
}

interface PieSliceData {
  id: string;
  categoryId?: CategoryId;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

const OTHERS_COLOR = '#94A3B8';

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function createDonutArcPath(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const safeEnd =
    endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;

  const startOuter = polarToCartesian(x, y, outerRadius, safeEnd);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, safeEnd);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = safeEnd - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    'L',
    endInner.x,
    endInner.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    startInner.x,
    startInner.y,
    'Z',
  ].join(' ');
}

export const TopExpensesPie: React.FC<TopExpensesPieProps> = ({
  top3Expenses,
  totalMonthlyExpenses,
  hideValues = false,
  onSelectCategory,
}) => {
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  if (top3Expenses.length === 0 || totalMonthlyExpenses <= 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhuma despesa registrada no período para gerar o gráfico.
        </Text>
      </View>
    );
  }

  const top3Sum = top3Expenses.reduce((acc, item) => acc + item.amount, 0);
  const othersAmount = Math.max(0, totalMonthlyExpenses - top3Sum);
  const othersPercentage =
    totalMonthlyExpenses > 0 ? (othersAmount / totalMonthlyExpenses) * 100 : 0;

  const slices: PieSliceData[] = [
    ...top3Expenses.map((item) => ({
      id: item.categoryId,
      categoryId: item.categoryId,
      label: item.label,
      amount: item.amount,
      percentage: item.percentage,
      color: item.color,
    })),
    ...(othersAmount > 0.01
      ? [
          {
            id: 'outros',
            categoryId: undefined,
            label: 'Outros',
            amount: othersAmount,
            percentage: othersPercentage,
            color: OTHERS_COLOR,
          },
        ]
      : []),
  ];

  const isCompact = windowWidth < 360;
  const size = isCompact ? 130 : 148;
  const center = size / 2;
  const outerRadius = isCompact ? 56 : 64;
  const innerRadius = isCompact ? 35 : 40;

  let cumulativeAngle = 0;

  return (
    <View style={styles.container}>
      {/* ── Gráfico Circular Vetorial (Green UX: react-native-svg) ── */}
      <View style={styles.chartRow}>
        <View
          style={[styles.svgWrapper, { width: size, height: size }]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Gráfico circular dos maiores gastos mensais. Total de despesas: ${formatCurrency(totalMonthlyExpenses)}`}
        >
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G>
              {slices.length === 1 ? (
                <Circle
                  cx={center}
                  cy={center}
                  r={(outerRadius + innerRadius) / 2}
                  stroke={slices[0].color}
                  strokeWidth={outerRadius - innerRadius}
                  fill="transparent"
                />
              ) : (
                slices.map((slice) => {
                  const sweep = Math.max(
                    2,
                    (slice.percentage / 100) * 360,
                  );
                  const startAngle = cumulativeAngle;
                  const endAngle = Math.min(360, startAngle + sweep);
                  cumulativeAngle = endAngle;

                  const d = createDonutArcPath(
                    center,
                    center,
                    outerRadius,
                    innerRadius,
                    startAngle,
                    endAngle,
                  );

                  return (
                    <Path
                      key={slice.id}
                      d={d}
                      fill={slice.color}
                      onPress={
                        slice.categoryId && onSelectCategory
                          ? () => onSelectCategory(slice.categoryId!)
                          : undefined
                      }
                    />
                  );
                })
              )}
            </G>
          </Svg>

          <View style={styles.donutCenterLabel} pointerEvents="none">
            <Text style={[styles.donutCenterTitle, { color: colors.textPrimary }]}>Top 3</Text>
            <Text style={[styles.donutCenterSub, { color: colors.textSecondary }]}>Gastos</Text>
          </View>
        </View>

        {/* ── Resumo lateral rápido ── */}
        <View style={styles.legendSummary}>
          <Text style={[styles.legendHint, { color: colors.textSecondary }]}>
            Toque em uma categoria abaixo para filtrar seus lançamentos:
          </Text>
          {slices.map((slice) => (
            <View key={`mini-${slice.id}`} style={styles.miniLegendRow}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: slice.color },
                ]}
              />
              <Text
                style={[
                  styles.miniLegendLabel,
                  { color: isDark ? '#E2E8F0' : colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {slice.label}
              </Text>
              <Text
                style={[
                  styles.miniLegendPct,
                  { color: isDark ? '#E2E8F0' : colors.textSecondary },
                ]}
              >
                {Math.round(slice.percentage)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Lista Textual Linearizada Adjacente (Acessibilidade WCAG Seção 4.2) ── */}
      <View
        style={[styles.linearList, { borderTopColor: colors.borderLight }]}
        accessibilityLabel="Lista textual linearizada dos 3 maiores gastos mensais"
      >
        {top3Expenses.map((item) => (
          <Pressable
            key={item.categoryId}
            onPress={
              onSelectCategory
                ? () => onSelectCategory(item.categoryId)
                : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={`${item.rank}º maior gasto: ${item.label}, valor ${formatCurrency(item.amount)}, representando ${Math.round(item.percentage)}% das despesas. Toque para ver lançamentos desta categoria.`}
            style={({ pressed }) => [
              styles.linearItem,
              { backgroundColor: colors.surfaceSubtle },
              pressed && { backgroundColor: colors.borderLight },
            ]}
          >
            <View style={styles.linearLeft}>
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: item.bgColor },
                ]}
              >
                <Text style={[styles.rankBadgeText, { color: item.color }]}>
                  {item.rank}º
                </Text>
              </View>
              <View>
                <Text style={[styles.linearCategoryName, { color: colors.textPrimary }]}>{item.label}</Text>
                <Text style={[styles.linearPercentage, { color: colors.textSecondary }]}>
                  {item.percentage.toFixed(1).replace('.', ',')}% das despesas
                </Text>
              </View>
            </View>

            <View style={styles.linearRight}>
              <Text style={[styles.linearAmount, { color: colors.expense }]}>
                {hideValues ? 'R$ ••••' : formatCurrency(item.amount)}
              </Text>
              <Feather
                name="chevron-right"
                size={16}
                color={colors.textMuted}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  svgWrapper: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  donutCenterSub: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    color: colors.textSecondary,
  },
  legendSummary: {
    flex: 1,
    gap: spacing.xs + 2,
  },
  legendHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 15,
  },
  miniLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  miniLegendLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  miniLegendPct: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  linearList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  linearItem: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  linearItemPressed: {
    backgroundColor: colors.borderLight,
  },
  linearLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  linearCategoryName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  linearPercentage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  linearRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linearAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.expense,
  },
});

export default TopExpensesPie;
