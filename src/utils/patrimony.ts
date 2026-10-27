import type { Transaction } from '../models';

export interface PatrimonyVariationResult {
  percent: number;
  formattedPercent: string; // Ex: "+100,0%", "-100,0%", "0,0%"
  formattedBadge: string;   // Ex: "+100,0% no período", "-100,0% no período", "0,0% no período"
  isPositive: boolean;
}

/**
 * Formata um valor numérico percentual no padrão brasileiro com sinal explícito e 1 casa decimal.
 * Ex: 100 -> "+100,0%", -25.4 -> "-25,4%", 0 -> "0,0%"
 */
export function formatVariationPercent(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(1).replace('.', ',')}%`;
  }
  if (value < 0) {
    return `${value.toFixed(1).replace('.', ',')}%`;
  }
  return '0,0%';
}

/**
 * Calcula a variação percentual de crescimento patrimonial entre dois valores:
 * Variação % = ((finalValue - initialValue) / |initialValue|) * 100
 */
export function calculatePatrimonyGrowth(
  initialValue: number,
  finalValue: number,
): PatrimonyVariationResult {
  let percent = 0;

  if (initialValue === 0) {
    if (finalValue === 0) {
      percent = 0;
    } else if (finalValue > 0) {
      percent = 100;
    } else {
      percent = -100;
    }
  } else {
    percent = ((finalValue - initialValue) / Math.abs(initialValue)) * 100;
  }

  const rounded = Math.round(percent * 10) / 10;
  const isPositive = rounded > 0;
  const formattedPercent = formatVariationPercent(rounded);
  const formattedBadge = `${formattedPercent} no período`;

  return {
    percent: rounded,
    formattedPercent,
    formattedBadge,
    isPositive,
  };
}

/**
 * Retorna os valores patrimoniais inicial (fim de Janeiro) e final (atual ou fim do ano)
 * do ano de referência para o cálculo de evolução patrimonial.
 */
export function getAnnualPatrimonyEndpoints(
  transactions: Transaction[],
  targetYear?: number,
): { initialValue: number; currentValue: number } {
  if (!transactions || transactions.length === 0) {
    return { initialValue: 0, currentValue: 0 };
  }

  const now = new Date();
  const year = targetYear ?? now.getFullYear();

  // Fim de Janeiro do ano selecionado (primeiro mês do período anual)
  const janLastDay = new Date(year, 1, 0).getDate();
  const janCutoff = `${year}-01-${String(janLastDay).padStart(2, '0')}`;

  // Fim do ano selecionado
  const decCutoff = `${year}-12-31`;

  let initialValue = 0;
  let currentValue = 0;

  for (const tx of transactions) {
    if (tx.date <= janCutoff) {
      if (tx.type === 'income') {
        initialValue += tx.amount;
      } else {
        initialValue -= tx.amount;
      }
    }
    if (tx.date <= decCutoff) {
      if (tx.type === 'income') {
        currentValue += tx.amount;
      } else {
        currentValue -= tx.amount;
      }
    }
  }

  return {
    initialValue: Math.round(initialValue * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
  };
}

/**
 * Calcula a variação percentual patrimonial entre o saldo inicial e o saldo final/atual.
 */
export function calculatePatrimonyVariation(
  initialBalance: number,
  currentBalance: number,
  _incomesOrIntermediate?: number | number[],
  _periodExpenses: number = 0,
  _intermediateBalances?: number[],
): PatrimonyVariationResult {
  return calculatePatrimonyGrowth(initialBalance, currentBalance);
}

/**
 * Calcula a variação patrimonial do período anual corrente
 * a partir do rol de transações reais do usuário e seu saldo atual.
 */
export function calculateCurrentPatrimonyVariation(
  transactions: Transaction[],
  currentBalance: number,
  targetYear?: number,
): PatrimonyVariationResult {
  if (!transactions || transactions.length === 0) {
    return {
      percent: 0,
      formattedPercent: '0,0%',
      formattedBadge: '0,0% no período',
      isPositive: true,
    };
  }

  const { initialValue, currentValue } = getAnnualPatrimonyEndpoints(
    transactions,
    targetYear,
  );

  const effectiveFinal = currentBalance !== 0 ? currentBalance : currentValue;
  return calculatePatrimonyGrowth(initialValue, effectiveFinal);
}
