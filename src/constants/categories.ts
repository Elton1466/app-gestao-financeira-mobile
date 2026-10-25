import { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import { CategoryId, TransactionType } from '../models';

export type { CategoryId, TransactionType };

export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  iconName: FeatherIconName;
  color: string;
  bgColor: string;
  trackColor: string;
  defaultType: TransactionType;
  defaultBudgetLimit?: number;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'compras',
    label: 'Compras',
    iconName: 'shopping-cart',
    color: '#A855F7',
    bgColor: '#F3E8FF',
    trackColor: '#E9D5FF',
    defaultType: 'expense',
    defaultBudgetLimit: 1000,
  },
  {
    id: 'casa',
    label: 'Casa',
    iconName: 'home',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    trackColor: '#BFDBFE',
    defaultType: 'expense',
    defaultBudgetLimit: 700,
  },
  {
    id: 'transporte',
    label: 'Transporte',
    iconName: 'truck',
    color: '#EAB308',
    bgColor: '#FEFCE8',
    trackColor: '#FDE68A',
    defaultType: 'expense',
    defaultBudgetLimit: 800,
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    iconName: 'coffee',
    color: '#F97316',
    bgColor: '#FFF7ED',
    trackColor: '#FED7AA',
    defaultType: 'expense',
    defaultBudgetLimit: 1200,
  },
  {
    id: 'saude',
    label: 'Saúde',
    iconName: 'heart',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    trackColor: '#FECACA',
    defaultType: 'expense',
    defaultBudgetLimit: 400,
  },
  {
    id: 'lazer',
    label: 'Lazer',
    iconName: 'film',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    trackColor: '#FBCFE8',
    defaultType: 'expense',
    defaultBudgetLimit: 500,
  },
  {
    id: 'viagem',
    label: 'Viagem',
    iconName: 'send',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    trackColor: '#CFFAFE',
    defaultType: 'expense',
  },
  {
    id: 'educacao',
    label: 'Educação',
    iconName: 'book-open',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    trackColor: '#E0E7FF',
    defaultType: 'expense',
  },
  {
    id: 'receita',
    label: 'Receita',
    iconName: 'trending-up',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    trackColor: '#BBF7D0',
    defaultType: 'income',
  },
  {
    id: 'outros',
    label: 'Outros',
    iconName: 'credit-card',
    color: '#64748B',
    bgColor: '#F1F5F9',
    trackColor: '#E2E8F0',
    defaultType: 'expense',
    defaultBudgetLimit: 500,
  },
] as const;

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

const LEGACY_CATEGORY_ALIASES: Record<string, CategoryId> = {
  shopping: 'compras',
  home: 'casa',
  transport: 'transporte',
  food: 'alimentacao',
  health: 'saude',
  entertainment: 'lazer',
  travel: 'viagem',
  education: 'educacao',
  income: 'receita',
  others: 'outros',
  outro: 'outros',
  other: 'outros',
};

export const OTHERS_CATEGORY: Omit<CategoryMeta, 'id'> & { id: string } = {
  id: 'others',
  label: 'Outros',
  iconName: 'credit-card',
  color: '#94A3B8',
  bgColor: '#F1F5F9',
  trackColor: '#E2E8F0',
  defaultType: 'expense',
};

export function getCategoryById(
  categoryId: string,
): Omit<CategoryMeta, 'id'> & { id: string } {
  if (categoryId in CATEGORY_MAP) {
    return CATEGORY_MAP[categoryId as CategoryId];
  }
  const mappedId = LEGACY_CATEGORY_ALIASES[categoryId];
  if (mappedId && mappedId in CATEGORY_MAP) {
    return CATEGORY_MAP[mappedId];
  }
  return {
    ...OTHERS_CATEGORY,
    id: categoryId,
    label: categoryId || OTHERS_CATEGORY.label,
  };
}
