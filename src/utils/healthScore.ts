import { CategoryBudget, CategoryId, FinancialGoal } from '../models';
import { getCategoryById } from '../constants/categories';
import { formatCurrency } from './currency';
import type { CategoryExpenseSummary } from '../contexts/FinanceContext';

export type HealthDiagnosticTone = 'positive' | 'warning' | 'danger' | 'info';

export interface HealthDiagnosticItem {
  id: string;
  tone: HealthDiagnosticTone;
  title: string;
  description: string;
  metricBadge?: string;
}

export interface HealthScoreResult {
  score: number; // 0 to 100
  statusLabel: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  statusColor: string;
  statusBg: string;
  savingsRatePercent: number;
  withinLimitCount: number;
  totalBudgetsCount: number;
  exceededCategories: Array<{
    categoryId: CategoryId;
    label: string;
    spent: number;
    limit: number;
    percent: number;
  }>;
  averageGoalPercent: number;
  diagnostics: HealthDiagnosticItem[];
}

export interface CalculateHealthScoreParams {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyGlobalLimit: number;
  budgets: CategoryBudget[];
  expensesByCategory: Record<CategoryId, CategoryExpenseSummary>;
  goals: FinancialGoal[];
}

/**
 * Calcula o Score de Saúde Financeira (0 a 100) com base nos dados reais do FinanceContext
 * e gera blocos diagnósticos contextuais exigidos pela Heurística 6 de Nielsen
 * (Reconhecimento em vez de recordação).
 */
export function calculateHealthScore({
  monthlyIncome,
  monthlyExpenses,
  monthlyGlobalLimit,
  budgets,
  expensesByCategory,
  goals,
}: CalculateHealthScoreParams): HealthScoreResult {
  // 1. Taxa de Poupança (até 45 pontos)
  let savingsRate = 0;
  let savingsScore = 0;

  if (monthlyIncome > 0) {
    savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
    if (savingsRate >= 0.3) {
      savingsScore = 40 + Math.min(5, Math.round((savingsRate - 0.3) * 14));
    } else if (savingsRate >= 0) {
      savingsScore = Math.round((savingsRate / 0.3) * 40);
    } else {
      savingsScore = Math.max(0, Math.round(15 + savingsRate * 30));
    }
  } else if (monthlyExpenses === 0) {
    savingsScore = 25;
  }

  const savingsRatePercent = Math.round(savingsRate * 100);
  const netSavings = monthlyIncome - monthlyExpenses;

  // 2. Aderência aos Orçamentos por Categoria e Limite Global (até 35 pontos)
  let budgetScore = 0;
  let withinLimitCount = 0;
  const totalBudgetsCount = budgets.length;
  const exceededCategories: HealthScoreResult['exceededCategories'] = [];

  if (totalBudgetsCount > 0) {
    for (const b of budgets) {
      const catSummary = expensesByCategory[b.categoryId];
      const spent = catSummary ? catSummary.spent : 0;
      const percent =
        b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;

      if (spent <= b.limitAmount) {
        withinLimitCount += 1;
      } else {
        const meta = getCategoryById(b.categoryId);
        exceededCategories.push({
          categoryId: b.categoryId,
          label: meta.label,
          spent,
          limit: b.limitAmount,
          percent,
        });
      }
    }

    const adherenceRatio = withinLimitCount / totalBudgetsCount;
    budgetScore = Math.round(adherenceRatio * 32);

    // Bônus se também estiver dentro do teto global mensal
    if (monthlyGlobalLimit > 0 && monthlyExpenses <= monthlyGlobalLimit) {
      budgetScore = Math.min(35, budgetScore + 2);
    } else if (monthlyGlobalLimit > 0 && monthlyExpenses > monthlyGlobalLimit) {
      budgetScore = Math.max(0, budgetScore - 5);
    }
  } else {
    budgetScore =
      monthlyGlobalLimit > 0 && monthlyExpenses <= monthlyGlobalLimit ? 28 : 18;
  }

  // 3. Progresso nas Metas Financeiras Ativas (até 20 pontos)
  let goalScore = 0;
  let averageGoalPercent = 0;
  let totalGoalsSaved = 0;

  if (goals.length > 0) {
    let sumRatios = 0;
    for (const g of goals) {
      totalGoalsSaved += g.currentAmount;
      const ratio =
        g.targetAmount > 0 ? Math.min(1, g.currentAmount / g.targetAmount) : 0;
      sumRatios += ratio;
    }
    const avgRatio = sumRatios / goals.length;
    averageGoalPercent = Math.round(avgRatio * 100);
    goalScore = Math.round(avgRatio * 16);
  } else {
    goalScore = 8;
  }

  const rawScore = savingsScore + budgetScore + goalScore;
  const score = Math.max(0, Math.min(100, rawScore));

  // Classificação semântica e cores WCAG AA (DESIGN.md)
  let statusLabel: HealthScoreResult['statusLabel'] = 'Bom';
  let statusColor = '#16803C';
  let statusBg = '#E8F5EE';

  if (score >= 85) {
    statusLabel = 'Excelente';
    statusColor = '#16803C';
    statusBg = '#E8F5EE';
  } else if (score >= 65) {
    statusLabel = 'Bom';
    statusColor = '#16803C';
    statusBg = '#E8F5EE';
  } else if (score >= 45) {
    statusLabel = 'Atenção';
    statusColor = '#A15C00';
    statusBg = '#FEF6E7';
  } else {
    statusLabel = 'Crítico';
    statusColor = '#B42318';
    statusBg = '#FDECEB';
  }

  // Construção dos blocos diagnósticos explicativos (Heurística 6)
  const diagnostics: HealthDiagnosticItem[] = [];

  if (monthlyIncome > 0 && netSavings >= 0) {
    diagnostics.push({
      id: 'diag-savings',
      tone: savingsRatePercent >= 20 ? 'positive' : 'warning',
      title:
        savingsRatePercent >= 20
          ? `Taxa de poupança positiva (${savingsRatePercent}% da renda retida)`
          : `Margem de poupança moderada (${savingsRatePercent}% da renda)`,
      description:
        savingsRatePercent >= 20
          ? `Suas receitas superam as despesas em ${formatCurrency(netSavings)} neste mês, garantindo fôlego para suas metas.`
          : `Saldo positivo de ${formatCurrency(netSavings)}. Recomenda-se preservar ao menos 20% da renda mensal.`,
      metricBadge: `${savingsRatePercent}% poupado`,
    });
  } else if (monthlyIncome > 0 && netSavings < 0) {
    diagnostics.push({
      id: 'diag-savings-deficit',
      tone: 'danger',
      title: 'Déficit no fluxo mensal de caixa',
      description: `Suas despesas superaram as receitas em ${formatCurrency(Math.abs(netSavings))}. Revise seus gastos variáveis.`,
      metricBadge: 'Déficit',
    });
  } else {
    diagnostics.push({
      id: 'diag-no-income',
      tone: 'info',
      title: 'Aguardando registro de receitas no mês',
      description:
        'Adicione sua renda mensal pelo botão (+) para calcular sua taxa de poupança real.',
      metricBadge: '0% poupado',
    });
  }

  if (totalBudgetsCount > 0) {
    diagnostics.push({
      id: 'diag-budgets-overview',
      tone: withinLimitCount === totalBudgetsCount ? 'positive' : 'info',
      title: `Controle de orçamento: ${withinLimitCount} de ${totalBudgetsCount} categorias dentro do limite`,
      description:
        withinLimitCount === totalBudgetsCount
          ? 'Todas as categorias planejadas estão respeitando o teto mensal configurado.'
          : `${withinLimitCount} categorias seguem saudáveis, mas ${exceededCategories.length} ${
              exceededCategories.length === 1
                ? 'categoria ultrapassou'
                : 'categorias ultrapassaram'
            } o teto definido.`,
      metricBadge: `${withinLimitCount}/${totalBudgetsCount} OK`,
    });
  }

  for (const exc of exceededCategories) {
    const overflow = exc.spent - exc.limit;
    diagnostics.push({
      id: `diag-exceeded-${exc.categoryId}`,
      tone: exc.percent >= 110 ? 'danger' : 'warning',
      title: `Acompanhamento: categoria ${exc.label} atingiu ${exc.percent}% do limite`,
      description: `Você utilizou ${formatCurrency(exc.spent)} do limite definido de ${formatCurrency(
        exc.limit,
      )} neste mês (diferença de ${formatCurrency(overflow)}).`,
      metricBadge: `${exc.percent}%`,
    });
  }

  if (goals.length > 0) {
    diagnostics.push({
      id: 'diag-goals',
      tone: averageGoalPercent >= 50 ? 'positive' : 'info',
      title: `Progresso consistente nas metas (${averageGoalPercent}% de média)`,
      description: `Você já acumulou ${formatCurrency(totalGoalsSaved)} distribuídos em ${
        goals.length
      } ${goals.length === 1 ? 'meta ativa' : 'metas ativas'}.`,
      metricBadge: `${averageGoalPercent}%`,
    });
  }

  return {
    score,
    statusLabel,
    statusColor,
    statusBg,
    savingsRatePercent,
    withinLimitCount,
    totalBudgetsCount,
    exceededCategories,
    averageGoalPercent,
    diagnostics,
  };
}
