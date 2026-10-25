import { getDatabase } from '../database/db';
import { CategoryBudget, CategoryId } from '../models';

interface CategoryBudgetRow {
  id: string;
  userId: string;
  categoryId: CategoryId;
  monthYear: string;
  limitAmount: number;
  isDemoData: number;
}

function mapRowToBudget(row: CategoryBudgetRow): CategoryBudget {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    monthYear: row.monthYear,
    limitAmount: Number(row.limitAmount),
    isDemoData: Boolean(row.isDemoData),
  };
}

function generateId(prefix = 'bdg'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface UpsertCategoryBudgetInput {
  id?: string;
  userId: string;
  categoryId: CategoryId;
  monthYear: string;
  limitAmount: number;
  isDemoData?: boolean;
}

export const budgetRepository = {
  async getAllByUserAndMonth(
    userId: string,
    monthYear: string,
  ): Promise<CategoryBudget[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<CategoryBudgetRow>(
        'SELECT * FROM category_budgets WHERE userId = ? AND monthYear = ? ORDER BY categoryId ASC;',
        [userId, monthYear],
      );
      return rows.map(mapRowToBudget);
    } catch (error) {
      console.error('[budgetRepository.getAllByUserAndMonth] Erro:', error);
      throw error;
    }
  },

  async getAllByUser(userId: string): Promise<CategoryBudget[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<CategoryBudgetRow>(
        'SELECT * FROM category_budgets WHERE userId = ? ORDER BY monthYear DESC, categoryId ASC;',
        [userId],
      );
      return rows.map(mapRowToBudget);
    } catch (error) {
      console.error('[budgetRepository.getAllByUser] Erro:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<CategoryBudget | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<CategoryBudgetRow>(
        'SELECT * FROM category_budgets WHERE id = ? LIMIT 1;',
        [id],
      );
      return row ? mapRowToBudget(row) : null;
    } catch (error) {
      console.error('[budgetRepository.getById] Erro:', error);
      throw error;
    }
  },

  async upsertCategoryBudget(
    input: UpsertCategoryBudgetInput,
  ): Promise<CategoryBudget> {
    try {
      const db = await getDatabase();
      const existing = await db.getFirstAsync<CategoryBudgetRow>(
        'SELECT * FROM category_budgets WHERE userId = ? AND categoryId = ? AND monthYear = ? LIMIT 1;',
        [input.userId, input.categoryId, input.monthYear],
      );

      if (existing) {
        await db.runAsync(
          'UPDATE category_budgets SET limitAmount = ?, isDemoData = ? WHERE id = ?;',
          [
            input.limitAmount,
            input.isDemoData !== undefined
              ? input.isDemoData
                ? 1
                : 0
              : existing.isDemoData,
            existing.id,
          ],
        );
        return {
          id: existing.id,
          userId: existing.userId,
          categoryId: existing.categoryId,
          monthYear: existing.monthYear,
          limitAmount: input.limitAmount,
          isDemoData:
            input.isDemoData !== undefined
              ? input.isDemoData
              : Boolean(existing.isDemoData),
        };
      }

      const id = input.id ?? generateId('bdg');
      const isDemoData = input.isDemoData ?? false;

      await db.runAsync(
        `INSERT INTO category_budgets (
          id, userId, categoryId, monthYear, limitAmount, isDemoData
        ) VALUES (?, ?, ?, ?, ?, ?);`,
        [
          id,
          input.userId,
          input.categoryId,
          input.monthYear,
          input.limitAmount,
          isDemoData ? 1 : 0,
        ],
      );

      return {
        id,
        userId: input.userId,
        categoryId: input.categoryId,
        monthYear: input.monthYear,
        limitAmount: input.limitAmount,
        isDemoData,
      };
    } catch (error) {
      console.error('[budgetRepository.upsertCategoryBudget] Erro:', error);
      throw error;
    }
  },

  async updateCategoryBudget(
    id: string,
    limitAmount: number,
  ): Promise<CategoryBudget | null> {
    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE category_budgets SET limitAmount = ? WHERE id = ?;',
        [limitAmount, id],
      );
      return this.getById(id);
    } catch (error) {
      console.error('[budgetRepository.updateCategoryBudget] Erro:', error);
      throw error;
    }
  },

  async deleteCategoryBudget(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'DELETE FROM category_budgets WHERE id = ?;',
        [id],
      );
      return result.changes > 0;
    } catch (error) {
      console.error('[budgetRepository.deleteCategoryBudget] Erro:', error);
      throw error;
    }
  },
};

export default budgetRepository;
