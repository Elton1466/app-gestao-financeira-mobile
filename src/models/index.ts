export type CategoryId =
  | 'compras'
  | 'casa'
  | 'transporte'
  | 'alimentacao'
  | 'saude'
  | 'lazer'
  | 'viagem'
  | 'educacao'
  | 'receita'
  | 'outros';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  categoryId: CategoryId;
  date: string;
  isRecurring: boolean;
  isFrequent: boolean;
  installments?: number;
  isDemoData: boolean;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: string;
  isDemoData: boolean;
  createdAt: string;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  categoryId: CategoryId;
  monthYear: string;
  limitAmount: number;
  isDemoData: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  birthDate?: string;
  phone?: string;
  avatarUri?: string;
  monthlyGlobalLimit: number;
  twoFactorEnabled: boolean;
  hideBalance: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export type SupportTicketType =
  | 'feedback'
  | 'bug'
  | 'suggestion'
  | 'support_chat';

export type SupportTicketStatus = 'enviado' | 'respondido';

export interface SupportTicket {
  id: string;
  userId: string;
  type: SupportTicketType;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
}
