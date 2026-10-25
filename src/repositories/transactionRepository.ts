import { getDatabase } from '../database/db';
import { CategoryId, Transaction, TransactionType } from '../models';

interface TransactionRow {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  categoryId: CategoryId;
  date: string;
  isRecurring: number;
  isFrequent: number;
  installments: number | null;
  isDemoData: number;
  createdAt: string;
}

function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description ?? undefined,
    amount: Number(row.amount),
    type: row.type,
    categoryId: row.categoryId,
    date: row.date,
    isRecurring: Boolean(row.isRecurring),
    isFrequent: Boolean(row.isFrequent),
    installments: row.installments !== null ? Number(row.installments) : undefined,
    isDemoData: Boolean(row.isDemoData),
    createdAt: row.createdAt,
  };
}

function generateId(prefix = 'tx'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateTransactionInput {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  categoryId: CategoryId;
  date: string;
  isRecurring?: boolean;
  isFrequent?: boolean;
  installments?: number;
  isDemoData?: boolean;
}

export interface UpdateTransactionInput {
  title?: string;
  description?: string | null;
  amount?: number;
  type?: TransactionType;
  categoryId?: CategoryId;
  date?: string;
  isRecurring?: boolean;
  isFrequent?: boolean;
  installments?: number | null;
  isDemoData?: boolean;
}

export const transactionRepository = {
  async getAllByUser(userId: string): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, createdAt DESC;',
        [userId],
      );
      return rows.map(mapRowToTransaction);
    } catch (error) {
      console.error('[transactionRepository.getAllByUser] Erro:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<Transaction | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE id = ? LIMIT 1;',
        [id],
      );
      return row ? mapRowToTransaction(row) : null;
    } catch (error) {
      console.error('[transactionRepository.getById] Erro:', error);
      throw error;
    }
  },

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    try {
      const db = await getDatabase();
      const id = input.id ?? generateId('tx');
      const createdAt = new Date().toISOString();
      const isRecurring = input.isRecurring ?? false;
      const isFrequent = input.isFrequent ?? false;
      const isDemoData = input.isDemoData ?? false;

      await db.runAsync(
        `INSERT INTO transactions (
          id, userId, title, description, amount, type,
          categoryId, date, isRecurring, isFrequent,
          installments, isDemoData, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          input.userId,
          input.title.trim(),
          input.description ?? null,
          input.amount,
          input.type,
          input.categoryId,
          input.date,
          isRecurring ? 1 : 0,
          isFrequent ? 1 : 0,
          input.installments ?? null,
          isDemoData ? 1 : 0,
          createdAt,
        ],
      );

      return {
        id,
        userId: input.userId,
        title: input.title.trim(),
        description: input.description,
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        date: input.date,
        isRecurring,
        isFrequent,
        installments: input.installments,
        isDemoData,
        createdAt,
      };
    } catch (error) {
      console.error('[transactionRepository.createTransaction] Erro:', error);
      throw error;
    }
  },

  async updateTransaction(
    id: string,
    data: UpdateTransactionInput,
  ): Promise<Transaction | null> {
    try {
      const current = await this.getById(id);
      if (!current) {
        return null;
      }

      const nextTitle =
        data.title !== undefined ? data.title.trim() : current.title;
      const nextDescription =
        data.description === null
          ? null
          : data.description !== undefined
            ? data.description
            : (current.description ?? null);
      const nextAmount =
        data.amount !== undefined ? data.amount : current.amount;
      const nextType = data.type !== undefined ? data.type : current.type;
      const nextCategoryId =
        data.categoryId !== undefined ? data.categoryId : current.categoryId;
      const nextDate = data.date !== undefined ? data.date : current.date;
      const nextIsRecurring =
        data.isRecurring !== undefined ? data.isRecurring : current.isRecurring;
      const nextIsFrequent =
        data.isFrequent !== undefined ? data.isFrequent : current.isFrequent;
      const nextInstallments =
        data.installments === null
          ? null
          : data.installments !== undefined
            ? data.installments
            : (current.installments ?? null);
      const nextIsDemoData =
        data.isDemoData !== undefined ? data.isDemoData : current.isDemoData;

      const db = await getDatabase();
      await db.runAsync(
        `UPDATE transactions
         SET title = ?, description = ?, amount = ?, type = ?,
             categoryId = ?, date = ?, isRecurring = ?, isFrequent = ?,
             installments = ?, isDemoData = ?
         WHERE id = ?;`,
        [
          nextTitle,
          nextDescription,
          nextAmount,
          nextType,
          nextCategoryId,
          nextDate,
          nextIsRecurring ? 1 : 0,
          nextIsFrequent ? 1 : 0,
          nextInstallments,
          nextIsDemoData ? 1 : 0,
          id,
        ],
      );

      return this.getById(id);
    } catch (error) {
      console.error('[transactionRepository.updateTransaction] Erro:', error);
      throw error;
    }
  },

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'DELETE FROM transactions WHERE id = ?;',
        [id],
      );
      return result.changes > 0;
    } catch (error) {
      console.error('[transactionRepository.deleteTransaction] Erro:', error);
      throw error;
    }
  },

  async getFrequentTransactions(userId: string): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE userId = ? AND isFrequent = 1 ORDER BY date DESC, createdAt DESC;',
        [userId],
      );
      return rows.map(mapRowToTransaction);
    } catch (error) {
      console.error(
        '[transactionRepository.getFrequentTransactions] Erro:',
        error,
      );
      throw error;
    }
  },

  async getRecurringTransactions(userId: string): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE userId = ? AND isRecurring = 1 ORDER BY date DESC, createdAt DESC;',
        [userId],
      );
      return rows.map(mapRowToTransaction);
    } catch (error) {
      console.error(
        '[transactionRepository.getRecurringTransactions] Erro:',
        error,
      );
      throw error;
    }
  },
};

export default transactionRepository;
