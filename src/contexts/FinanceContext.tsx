import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CategoryBudget,
  CategoryId,
  FinancialGoal,
  SupportTicket,
  Transaction,
} from '../models';
import { CATEGORIES, getCategoryById } from '../constants/categories';
import { extractYearMonth, isCurrentMonth } from '../utils/date';
import {
  transactionRepository,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '../repositories/transactionRepository';
import {
  goalRepository,
  type CreateGoalInput,
  type UpdateGoalInput,
} from '../repositories/goalRepository';
import { budgetRepository } from '../repositories/budgetRepository';
import {
  supportRepository,
  type CreateSupportTicketInput,
  type UpdateSupportTicketInput,
} from '../repositories/supportRepository';
import { restoreDemoDataForUser, seedDemoData } from '../database/seed';
import { useAuth } from './AuthContext';

const DEFAULT_CATEGORY_LIMITS: Record<CategoryId, number> = {
  compras: 1000.0,
  casa: 1500.0,
  transporte: 500.0,
  alimentacao: 1200.0,
  saude: 400.0,
  lazer: 400.0,
  viagem: 1000.0,
  educacao: 600.0,
  receita: 0.0,
  outros: 500.0,
};

export interface CategoryExpenseSummary {
  categoryId: CategoryId;
  label: string;
  color: string;
  bgColor: string;
  iconName: string;
  spent: number;
  limit: number;
  /** Percentual real do limite utilizado (sem trava em 100%, permitindo > 100% conforme Heurística 1) */
  percentageOfLimit: number;
  /** Percentual deste gasto sobre o total de despesas do mês */
  percentageOfTotalExpenses: number;
  isOverLimit: boolean;
  budgetId?: string;
}

export interface TopExpenseItem {
  rank: number;
  categoryId: CategoryId;
  label: string;
  color: string;
  bgColor: string;
  iconName: string;
  amount: number;
  /** Percentual sobre o total de despesas do mês */
  percentage: number;
}

export interface FinanceContextData {
  transactions: Transaction[];
  goals: FinancialGoal[];
  budgets: CategoryBudget[];
  tickets: SupportTicket[];
  isLoading: boolean;
  error: string | null;

  // Métricas dinâmicas calculadas a partir do SQLite
  currentBalance: number;
  monthlyBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  predictedMonthlyResult: number;
  expensesByCategory: Record<CategoryId, CategoryExpenseSummary>;
  monthlyExpensesByCategory: Record<CategoryId, CategoryExpenseSummary>;
  top3Expenses: TopExpenseItem[];

  // Controle global do Modal de Lançamento (+) e Feedback de Sucesso
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  openTransactionModal: (tx?: Transaction) => void;
  closeTransactionModal: () => void;
  showSuccessFeedback: boolean;
  successFeedbackMessage: string;
  setShowSuccessFeedback: React.Dispatch<React.SetStateAction<boolean>>;
  triggerSuccessFeedback: (message?: string) => void;

  // Recarregamento manual e restauração de dados de demonstração [DEMO]
  refreshFinanceData: () => Promise<void>;
  restoreDemoData: () => Promise<void>;

  // Operações CRUD — Transações
  addTransaction: (
    data: Omit<CreateTransactionInput, 'userId'>,
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    data: UpdateTransactionInput,
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  // Operações CRUD — Metas Financeiras
  addGoal: (data: Omit<CreateGoalInput, 'userId'>) => Promise<FinancialGoal>;
  updateGoal: (id: string, data: UpdateGoalInput) => Promise<FinancialGoal>;
  addGoalContribution: (
    id: string,
    contributionAmount: number,
  ) => Promise<FinancialGoal>;
  deleteGoal: (id: string) => Promise<void>;

  // Operações CRUD — Orçamentos por Categoria
  upsertBudget: (
    categoryId: CategoryId,
    limitAmount: number,
    monthYear?: string,
  ) => Promise<CategoryBudget>;
  updateBudget: (id: string, limitAmount: number) => Promise<CategoryBudget>;
  deleteBudget: (id: string) => Promise<void>;

  // Operações CRUD — Chamados de Suporte / Feedback
  addSupportTicket: (
    data: Omit<CreateSupportTicketInput, 'userId'>,
  ) => Promise<SupportTicket>;
  updateSupportTicket: (
    id: string,
    data: UpdateSupportTicketInput,
  ) => Promise<SupportTicket>;
  deleteSupportTicket: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextData | undefined>(undefined);

function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] =
    useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showSuccessFeedback, setShowSuccessFeedback] =
    useState<boolean>(false);
  const [successFeedbackMessage, setSuccessFeedbackMessage] = useState<string>(
    'Despesa registrada com sucesso!',
  );

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSuccessFeedback = useCallback((message?: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    if (message) {
      setSuccessFeedbackMessage(message);
    }
    setShowSuccessFeedback(true);
    feedbackTimerRef.current = setTimeout(() => {
      setShowSuccessFeedback(false);
    }, 1600);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const refreshFinanceData = useCallback(async (): Promise<void> => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setBudgets([]);
      setTickets([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentMonthYear = getCurrentMonthYear();
      const [loadedTransactions, loadedGoals, currentBudgets, loadedTickets] =
        await Promise.all([
          transactionRepository.getAllByUser(user.id),
          goalRepository.getAllByUser(user.id),
          budgetRepository.getAllByUserAndMonth(user.id, currentMonthYear),
          supportRepository.getAllByUser(user.id),
        ]);

      let effectiveBudgets = currentBudgets;
      if (effectiveBudgets.length === 0) {
        const allUserBudgets = await budgetRepository.getAllByUser(user.id);
        if (allUserBudgets.length > 0) {
          const sorted = [...allUserBudgets].sort(
            (a: CategoryBudget, b: CategoryBudget) =>
              (b.monthYear ?? '').localeCompare(a.monthYear ?? ''),
          );
          const latestMonth = sorted[0].monthYear;
          effectiveBudgets = allUserBudgets.filter(
            (b: CategoryBudget) => b.monthYear === latestMonth,
          );
        }
      }

      setTransactions(loadedTransactions);
      setGoals(loadedGoals);
      setBudgets(effectiveBudgets);
      setTickets(loadedTickets);
    } catch (err) {
      console.error('[FinanceContext] Erro ao carregar dados do SQLite:', err);
      setError('Não foi possível carregar os dados financeiros do banco local.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshFinanceData();
  }, [refreshFinanceData]);

  // ── Cálculos Dinâmicos Reais (Segregação Estrita: All-Time vs Mês Corrente) ──
  const {
    currentBalance,
    monthlyBalance,
    monthlyIncome,
    monthlyExpenses,
    predictedMonthlyResult,
    expensesByCategory,
    monthlyExpensesByCategory,
    top3Expenses,
  } = useMemo(() => {
    // 1. Total Acumulado Geral (All-Time): utilizado exclusivamente para compor currentBalance
    let allTimeIncome = 0;
    let allTimeExpenses = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        allTimeIncome += tx.amount;
      } else {
        allTimeExpenses += tx.amount;
      }
    }
    const balance = allTimeIncome - allTimeExpenses;

    // 2. Transações estritas do mês corrente (Current Month)
    const now = new Date();
    const hasCurrentMonth = transactions.some((t) => isCurrentMonth(t.date, now));
    const effectiveRefDate = hasCurrentMonth
      ? now
      : transactions.length > 0
        ? (() => {
            const sorted = [...transactions].sort((a, b) =>
              b.date.localeCompare(a.date),
            );
            const ym = extractYearMonth(sorted[0].date);
            return ym ? new Date(ym.year, ym.month - 1, 1) : now;
          })()
        : now;

    const currentMonthTransactions = transactions.filter((t) =>
      isCurrentMonth(t.date, effectiveRefDate),
    );

    let mIncome = 0;
    let mExpenses = 0;

    const categorySpentMap: Record<CategoryId, number> = {
      compras: 0,
      casa: 0,
      transporte: 0,
      alimentacao: 0,
      saude: 0,
      lazer: 0,
      viagem: 0,
      educacao: 0,
      receita: 0,
      outros: 0,
    };

    for (const tx of currentMonthTransactions) {
      if (tx.type === 'income') {
        mIncome += tx.amount;
      } else {
        mExpenses += tx.amount;
        const catId = tx.categoryId;
        if (catId in categorySpentMap) {
          categorySpentMap[catId] += tx.amount;
        }
      }
    }

    const predictedResult = mIncome - mExpenses;

    const budgetByCategory = new Map<CategoryId, CategoryBudget>();
    for (const b of budgets) {
      budgetByCategory.set(b.categoryId, b);
    }

    const categorySummaries = {} as Record<CategoryId, CategoryExpenseSummary>;

    for (const cat of CATEGORIES) {
      const catId = cat.id;
      const spent = categorySpentMap[catId] ?? 0;
      const budgetRecord = budgetByCategory.get(catId);
      const limit = budgetRecord
        ? budgetRecord.limitAmount
        : DEFAULT_CATEGORY_LIMITS[catId];

      // Sem trava em 100% — Heurística 1 (Visibilidade do Status do Sistema)
      const percentageOfLimit = limit > 0 ? (spent / limit) * 100 : 0;
      const percentageOfTotalExpenses =
        mExpenses > 0 ? (spent / mExpenses) * 100 : 0;

      categorySummaries[catId] = {
        categoryId: catId,
        label: cat.label,
        color: cat.color,
        bgColor: cat.bgColor,
        iconName: cat.iconName,
        spent,
        limit,
        percentageOfLimit,
        percentageOfTotalExpenses,
        isOverLimit: limit > 0 && spent > limit,
        budgetId: budgetRecord?.id,
      };
    }

    const sortedExpenseCategories = Object.values(categorySummaries)
      .filter((item) => item.categoryId !== 'receita' && item.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    const top3: TopExpenseItem[] = sortedExpenseCategories
      .slice(0, 3)
      .map((item, index) => {
        const meta = getCategoryById(item.categoryId);
        return {
          rank: index + 1,
          categoryId: item.categoryId,
          label: meta.label,
          color: meta.color,
          bgColor: meta.bgColor,
          iconName: meta.iconName,
          amount: item.spent,
          percentage: item.percentageOfTotalExpenses,
        };
      });

    return {
      currentBalance: balance,
      monthlyBalance: predictedResult,
      monthlyIncome: mIncome,
      monthlyExpenses: mExpenses,
      predictedMonthlyResult: predictedResult,
      expensesByCategory: categorySummaries,
      monthlyExpensesByCategory: categorySummaries,
      top3Expenses: top3,
    };
  }, [transactions, budgets]);

  // ── Controle do Modal Global de Lançamento ───────────────────────────────
  const openTransactionModal = useCallback((tx?: Transaction) => {
    setEditingTransaction(tx ?? null);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  // ── CRUD: Transações ─────────────────────────────────────────────────────
  const addTransaction = useCallback(
    async (
      data: Omit<CreateTransactionInput, 'userId'>,
    ): Promise<Transaction> => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const created = await transactionRepository.createTransaction({
        ...data,
        userId: user.id,
      });
      await refreshFinanceData();
      triggerSuccessFeedback(
        created.type === 'income'
          ? 'Receita registrada com sucesso!'
          : 'Despesa registrada com sucesso!',
      );
      return created;
    },
    [user, refreshFinanceData, triggerSuccessFeedback],
  );

  const updateTransaction = useCallback(
    async (id: string, data: UpdateTransactionInput): Promise<Transaction> => {
      const updated = await transactionRepository.updateTransaction(id, data);
      if (!updated) {
        throw new Error('Transação não encontrada para atualização.');
      }
      await refreshFinanceData();
      triggerSuccessFeedback('Lançamento atualizado!');
      return updated;
    },
    [refreshFinanceData, triggerSuccessFeedback],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      await transactionRepository.deleteTransaction(id);
      await refreshFinanceData();
      triggerSuccessFeedback('Lançamento excluído com sucesso!');
    },
    [refreshFinanceData, triggerSuccessFeedback],
  );

  // ── CRUD: Metas Financeiras ──────────────────────────────────────────────
  const addGoal = useCallback(
    async (data: Omit<CreateGoalInput, 'userId'>): Promise<FinancialGoal> => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const created = await goalRepository.createGoal({
        ...data,
        userId: user.id,
      });
      await refreshFinanceData();
      triggerSuccessFeedback('Meta salva com sucesso!');
      return created;
    },
    [user, refreshFinanceData, triggerSuccessFeedback],
  );

  const updateGoal = useCallback(
    async (id: string, data: UpdateGoalInput): Promise<FinancialGoal> => {
      const updated = await goalRepository.updateGoal(id, data);
      if (!updated) {
        throw new Error('Meta financeira não encontrada.');
      }
      await refreshFinanceData();
      triggerSuccessFeedback('Meta atualizada com sucesso!');
      return updated;
    },
    [refreshFinanceData, triggerSuccessFeedback],
  );

  const addGoalContribution = useCallback(
    async (
      id: string,
      contributionAmount: number,
    ): Promise<FinancialGoal> => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const targetGoal = goals.find((g) => g.id === id);
      const updated = await goalRepository.addContributionToGoal(
        id,
        contributionAmount,
      );
      if (!updated) {
        throw new Error('Meta financeira não encontrada para aporte.');
      }

      // Cria automaticamente uma nova transação do tipo despesa para abater do saldo e somar aos gastos do mês
      const goalTitle = targetGoal?.title ?? updated.title ?? 'Meta';
      const todayIso = new Date().toISOString().slice(0, 10);
      await transactionRepository.createTransaction({
        userId: user.id,
        title: `Aporte na meta: ${goalTitle}`,
        description: `Aporte realizado na meta ${goalTitle}`,
        amount: contributionAmount,
        type: 'expense',
        categoryId: 'outros',
        date: todayIso,
        isRecurring: false,
        isFrequent: false,
        isDemoData: false,
      });

      await refreshFinanceData();
      triggerSuccessFeedback('Aporte realizado com sucesso!');
      return updated;
    },
    [user, goals, refreshFinanceData, triggerSuccessFeedback],
  );

  const deleteGoal = useCallback(
    async (id: string): Promise<void> => {
      await goalRepository.deleteGoal(id);
      await refreshFinanceData();
      triggerSuccessFeedback('Meta excluída com sucesso!');
    },
    [refreshFinanceData, triggerSuccessFeedback],
  );

  // ── CRUD: Orçamentos por Categoria ───────────────────────────────────────
  const upsertBudget = useCallback(
    async (
      categoryId: CategoryId,
      limitAmount: number,
      monthYear?: string,
    ): Promise<CategoryBudget> => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const targetMonth = monthYear ?? getCurrentMonthYear();
      const upserted = await budgetRepository.upsertCategoryBudget({
        userId: user.id,
        categoryId,
        monthYear: targetMonth,
        limitAmount,
        isDemoData: false,
      });
      await refreshFinanceData();
      triggerSuccessFeedback('Orçamento salvo com sucesso!');
      return upserted;
    },
    [user, refreshFinanceData, triggerSuccessFeedback],
  );

  const updateBudget = useCallback(
    async (id: string, limitAmount: number): Promise<CategoryBudget> => {
      const updated = await budgetRepository.updateCategoryBudget(
        id,
        limitAmount,
      );
      if (!updated) {
        throw new Error('Orçamento não encontrado para atualização.');
      }
      await refreshFinanceData();
      triggerSuccessFeedback('Orçamento atualizado!');
      return updated;
    },
    [refreshFinanceData, triggerSuccessFeedback],
  );

  const deleteBudget = useCallback(
    async (id: string): Promise<void> => {
      await budgetRepository.deleteCategoryBudget(id);
      await refreshFinanceData();
      triggerSuccessFeedback('Orçamento excluído com sucesso!');
    },
    [refreshFinanceData, triggerSuccessFeedback],
  );

  // ── CRUD: Chamados de Suporte e Feedback ─────────────────────────────────
  const addSupportTicket = useCallback(
    async (
      data: Omit<CreateSupportTicketInput, 'userId'>,
    ): Promise<SupportTicket> => {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const created = await supportRepository.createTicket({
        ...data,
        userId: user.id,
      });
      await refreshFinanceData();
      return created;
    },
    [user, refreshFinanceData],
  );

  const updateSupportTicket = useCallback(
    async (
      id: string,
      data: UpdateSupportTicketInput,
    ): Promise<SupportTicket> => {
      const updated = await supportRepository.updateTicket(id, data);
      if (!updated) {
        throw new Error('Chamado de suporte não encontrado.');
      }
      await refreshFinanceData();
      return updated;
    },
    [refreshFinanceData],
  );

  const deleteSupportTicket = useCallback(
    async (id: string): Promise<void> => {
      await supportRepository.deleteTicket(id);
      await refreshFinanceData();
    },
    [refreshFinanceData],
  );

  const restoreDemoData = useCallback(async (): Promise<void> => {
    if (!user) {
      return;
    }
    await seedDemoData(user.id);
    await refreshFinanceData();
    triggerSuccessFeedback('Dados de demonstração restaurados com sucesso!');
  }, [user, refreshFinanceData, triggerSuccessFeedback]);

  const value = useMemo<FinanceContextData>(
    () => ({
      transactions,
      goals,
      budgets,
      tickets,
      isLoading,
      error,
      currentBalance,
      monthlyBalance,
      monthlyIncome,
      monthlyExpenses,
      predictedMonthlyResult,
      expensesByCategory,
      monthlyExpensesByCategory: expensesByCategory,
      top3Expenses,
      isTransactionModalOpen,
      editingTransaction,
      openTransactionModal,
      closeTransactionModal,
      showSuccessFeedback,
      successFeedbackMessage,
      setShowSuccessFeedback,
      triggerSuccessFeedback,
      refreshFinanceData,
      restoreDemoData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      addGoalContribution,
      deleteGoal,
      upsertBudget,
      updateBudget,
      deleteBudget,
      addSupportTicket,
      updateSupportTicket,
      deleteSupportTicket,
    }),
    [
      transactions,
      goals,
      budgets,
      tickets,
      isLoading,
      error,
      currentBalance,
      monthlyBalance,
      monthlyIncome,
      monthlyExpenses,
      predictedMonthlyResult,
      expensesByCategory,
      top3Expenses,
      isTransactionModalOpen,
      editingTransaction,
      openTransactionModal,
      closeTransactionModal,
      showSuccessFeedback,
      successFeedbackMessage,
      triggerSuccessFeedback,
      refreshFinanceData,
      restoreDemoData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      addGoalContribution,
      deleteGoal,
      upsertBudget,
      updateBudget,
      deleteBudget,
      addSupportTicket,
      updateSupportTicket,
      deleteSupportTicket,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
};

export function useFinance(): FinanceContextData {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de um FinanceProvider.');
  }
  return context;
}
