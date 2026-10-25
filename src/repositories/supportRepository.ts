import { getDatabase } from '../database/db';
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
} from '../models';

interface SupportTicketRow {
  id: string;
  userId: string;
  type: SupportTicketType;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
}

function mapRowToTicket(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
  };
}

function generateId(prefix = 'tkt'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateSupportTicketInput {
  id?: string;
  userId: string;
  type: SupportTicketType;
  subject: string;
  message: string;
  status?: SupportTicketStatus;
}

export interface UpdateSupportTicketInput {
  type?: SupportTicketType;
  subject?: string;
  message?: string;
  status?: SupportTicketStatus;
}

export const supportRepository = {
  async getAllByUser(userId: string): Promise<SupportTicket[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<SupportTicketRow>(
        'SELECT * FROM support_tickets WHERE userId = ? ORDER BY createdAt DESC;',
        [userId],
      );
      return rows.map(mapRowToTicket);
    } catch (error) {
      console.error('[supportRepository.getAllByUser] Erro:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<SupportTicket | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<SupportTicketRow>(
        'SELECT * FROM support_tickets WHERE id = ? LIMIT 1;',
        [id],
      );
      return row ? mapRowToTicket(row) : null;
    } catch (error) {
      console.error('[supportRepository.getById] Erro:', error);
      throw error;
    }
  },

  async createTicket(input: CreateSupportTicketInput): Promise<SupportTicket> {
    try {
      const db = await getDatabase();
      const id = input.id ?? generateId('tkt');
      const createdAt = new Date().toISOString();
      const status: SupportTicketStatus = input.status ?? 'enviado';

      await db.runAsync(
        `INSERT INTO support_tickets (
          id, userId, type, subject, message, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          input.userId,
          input.type,
          input.subject.trim(),
          input.message.trim(),
          status,
          createdAt,
        ],
      );

      return {
        id,
        userId: input.userId,
        type: input.type,
        subject: input.subject.trim(),
        message: input.message.trim(),
        status,
        createdAt,
      };
    } catch (error) {
      console.error('[supportRepository.createTicket] Erro:', error);
      throw error;
    }
  },

  async updateTicket(
    id: string,
    data: UpdateSupportTicketInput,
  ): Promise<SupportTicket | null> {
    try {
      const current = await this.getById(id);
      if (!current) {
        return null;
      }

      const nextType = data.type !== undefined ? data.type : current.type;
      const nextSubject =
        data.subject !== undefined ? data.subject.trim() : current.subject;
      const nextMessage =
        data.message !== undefined ? data.message.trim() : current.message;
      const nextStatus =
        data.status !== undefined ? data.status : current.status;

      const db = await getDatabase();
      await db.runAsync(
        `UPDATE support_tickets
         SET type = ?, subject = ?, message = ?, status = ?
         WHERE id = ?;`,
        [nextType, nextSubject, nextMessage, nextStatus, id],
      );

      return this.getById(id);
    } catch (error) {
      console.error('[supportRepository.updateTicket] Erro:', error);
      throw error;
    }
  },

  async deleteTicket(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'DELETE FROM support_tickets WHERE id = ?;',
        [id],
      );
      return result.changes > 0;
    } catch (error) {
      console.error('[supportRepository.deleteTicket] Erro:', error);
      throw error;
    }
  },
};

export default supportRepository;
