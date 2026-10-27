import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from './currency';
import { isoToBRDate } from './date';
import { getCategoryById } from '../constants/categories';
import type { FinancialGoal, Transaction } from '../models';
import type { HealthScoreResult } from './healthScore';
import type { TopExpenseItem } from '../contexts/FinanceContext';

export interface ExcelReportData {
  userName: string;
  userEmail: string;
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  globalLimit: number;
  healthData: HealthScoreResult;
  top3Expenses: TopExpenseItem[];
  goals: FinancialGoal[];
  transactions: Transaction[];
}

/**
 * Gera um arquivo Excel (.xlsx) com 2 abas:
 * 1. Resumo Executivo (Dados consolidados, indicadores, diagnóstico, categorias e metas)
 * 2. Lançamentos (Tabela completa com todos os registros do usuário)
 * e aciona a folha nativa de compartilhamento.
 */
export async function exportExcelReport(data: ExcelReportData): Promise<void> {
  const now = new Date();
  const exportDateBR = `${String(now.getDate()).padStart(2, '0')}/${String(
    now.getMonth() + 1,
  ).padStart(2, '0')}/${now.getFullYear()}`;

  // ── ABA 1: Resumo Executivo ──
  const sheet1Data: (string | number)[][] = [
    ['RELATÓRIO DE GESTÃO FINANCEIRA — NEXO'],
    [],
    ['DADOS DA CONTA'],
    ['Nome do Usuário', data.userName || 'Usuário'],
    ['E-mail', data.userEmail || 'usuario@email.com'],
    ['Data de Exportação', exportDateBR],
    [],
    ['RESUMO FINANCEIRO'],
    ['Saldo calculado', formatCurrency(data.currentBalance)],
    ['Receitas no Mês', formatCurrency(data.monthlyIncome)],
    ['Despesas no Mês', formatCurrency(data.monthlyExpenses)],
    ['Limite Global Mensal', formatCurrency(data.globalLimit)],
    [
      'Score de Saúde Financeira',
      `${data.healthData.score}/100 (${data.healthData.statusLabel})`,
    ],
    [],
    ['DIAGNÓSTICO DETALHADO'],
    ['Fator', 'Diagnóstico'],
    ...data.healthData.diagnostics.map((d) => [d.title, d.description]),
    [],
    ['MAIORES GASTOS POR CATEGORIA'],
    ['Categoria', 'Valor Gasto (R$)', 'Participação (%)'],
    ...data.top3Expenses.map((item) => [
      item.label,
      formatCurrency(item.amount),
      `${Math.round(item.percentage)}%`,
    ]),
    [],
    ['PROGRESSO DAS METAS FINANCEIRAS'],
    ['Meta', 'Valor Guardado (R$)', 'Valor Alvo (R$)', 'Progresso (%)', 'Prazo'],
    ...data.goals.map((g) => {
      const pct =
        g.targetAmount > 0
          ? Math.round((g.currentAmount / g.targetAmount) * 100)
          : 0;
      const deadline = g.deadline ? isoToBRDate(g.deadline) : 'Sem prazo';
      return [
        g.title,
        formatCurrency(g.currentAmount),
        formatCurrency(g.targetAmount),
        `${pct}%`,
        deadline,
      ];
    }),
  ];

  // ── ABA 2: Lançamentos Detalhados ──
  const sortedTxs = [...data.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const sheet2Data: (string | number)[][] = [
    ['Data', 'Título / Descrição', 'Categoria', 'Tipo', 'Valor (R$)', 'Recorrente'],
    ...sortedTxs.map((tx) => [
      isoToBRDate(tx.date),
      tx.title,
      getCategoryById(tx.categoryId).label,
      tx.type === 'income' ? 'Receita' : 'Despesa',
      formatCurrency(tx.amount),
      tx.isRecurring ? 'Sim' : 'Não',
    ]),
  ];

  // Criação da pasta de trabalho (.xlsx)
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);

  // Configuração das larguras de coluna para boa legibilidade
  ws1['!cols'] = [
    { wch: 32 },
    { wch: 50 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
  ];

  ws2['!cols'] = [
    { wch: 14 },
    { wch: 38 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Executivo');
  XLSX.utils.book_append_sheet(wb, ws2, 'Lançamentos');

  try {
    // Geração do binário base64
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Gravação no diretório de cache do dispositivo via expo-file-system/legacy
    const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const fileUri = `${cacheDir}relatorio_nexo.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Abertura da folha de compartilhamento nativo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Compartilhar Planilha',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
    }
  } catch (error) {
    console.error(
      '[exportExcelReport] Falha ao gerar ou compartilhar arquivo XLSX:',
      error,
    );
    throw error;
  }
}
