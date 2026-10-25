import { getDatabase } from '../database/db';
import { FinancialGoal } from '../models';

interface FinancialGoalRow {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline: string | null;
  isDemoData: number;
  createdAt: string;
}

function mapRowToGoal(row: FinancialGoalRow): FinancialGoal {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    targetAmount: Number(row.targetAmount),
    currentAmount: Number(row.currentAmount),
    icon: row.icon,
    color: row.color,
    deadline: row.deadline ?? undefined,
    isDemoData: Boolean(row.isDemoData),
    createdAt: row.createdAt,
  };
}

function generateId(prefix = 'goal'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateGoalInput {
  id?: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  icon: string;
  color: string;
  deadline?: string;
  isDemoData?: boolean;
}

export interface UpdateGoalInput {
  title?: string;
  targetAmount?: number;
  currentAmount?: number;
  icon?: string;
  color?: string;
  deadline?: string | null;
  isDemoData?: boolean;
}

export const goalRepository = {
  async getAllByUser(userId: string): Promise<FinancialGoal[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<FinancialGoalRow>(
        'SELECT * FROM financial_goals WHERE userId = ? ORDER BY createdAt ASC;',
        [userId],
      );
      return rows.map(mapRowToGoal);
    } catch (error) {
      console.error('[goalRepository.getAllByUser] Erro:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<FinancialGoal | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<FinancialGoalRow>(
        'SELECT * FROM financial_goals WHERE id = ? LIMIT 1;',
        [id],
      );
      return row ? mapRowToGoal(row) : null;
    } catch (error) {
      console.error('[goalRepository.getById] Erro:', error);
      throw error;
    }
  },

  async createGoal(input: CreateGoalInput): Promise<FinancialGoal> {
    try {
      const db = await getDatabase();
      const id = input.id ?? generateId('goal');
      const createdAt = new Date().toISOString();
      const currentAmount = input.currentAmount ?? 0;
      const isDemoData = input.isDemoData ?? false;

      await db.runAsync(
        `INSERT INTO financial_goals (
          id, userId, title, targetAmount, currentAmount,
          icon, color, deadline, isDemoData, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          input.userId,
          input.title.trim(),
          input.targetAmount,
          currentAmount,
          input.icon,
          input.color,
          input.deadline ?? null,
          isDemoData ? 1 : 0,
          createdAt,
        ],
      );

      return {
        id,
        userId: input.userId,
        title: input.title.trim(),
        targetAmount: input.targetAmount,
        currentAmount,
        icon: input.icon,
        color: input.color,
        deadline: input.deadline,
        isDemoData,
        createdAt,
      };
    } catch (error) {
      console.error('[goalRepository.createGoal] Erro:', error);
      throw error;
    }
  },

  async updateGoal(
    id: string,
    data: UpdateGoalInput,
  ): Promise<FinancialGoal | null> {
    try {
      const current = await this.getById(id);
      if (!current) {
        return null;
      }

      const nextTitle =
        data.title !== undefined ? data.title.trim() : current.title;
      const nextTargetAmount =
        data.targetAmount !== undefined
          ? data.targetAmount
          : current.targetAmount;
      const nextCurrentAmount =
        data.currentAmount !== undefined
          ? data.currentAmount
          : current.currentAmount;
      const nextIcon = data.icon !== undefined ? data.icon : current.icon;
      const nextColor = data.color !== undefined ? data.color : current.color;
      const nextDeadline =
        data.deadline === null
          ? null
          : data.deadline !== undefined
            ? data.deadline
            : (current.deadline ?? null);
      const nextIsDemoData =
        data.isDemoData !== undefined ? data.isDemoData : current.isDemoData;

      const db = await getDatabase();
      await db.runAsync(
        `UPDATE financial_goals
         SET title = ?, targetAmount = ?, currentAmount = ?,
             icon = ?, color = ?, deadline = ?, isDemoData = ?
         WHERE id = ?;`,
        [
          nextTitle,
          nextTargetAmount,
          nextCurrentAmount,
          nextIcon,
          nextColor,
          nextDeadline,
          nextIsDemoData ? 1 : 0,
          id,
        ],
      );

      return this.getById(id);
    } catch (error) {
      console.error('[goalRepository.updateGoal] Erro:', error);
      throw error;
    }
  },

  async addContributionToGoal(
    id: string,
    amountToAdd: number,
  ): Promise<FinancialGoal | null> {
    try {
      const current = await this.getById(id);
      if (!current) {
        return null;
      }
      const nextAmount = Math.max(0, current.currentAmount + amountToAdd);
      return this.updateGoal(id, { currentAmount: nextAmount });
    } catch (error) {
      console.error('[goalRepository.addContributionToGoal] Erro:', error);
      throw error;
    }
  },

  async deleteGoal(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'DELETE FROM financial_goals WHERE id = ?;',
        [id],
      );
      return result.changes > 0;
    } catch (error) {
      console.error('[goalRepository.deleteGoal] Erro:', error);
      throw error;
    }
  },
};

export default goalRepository;
