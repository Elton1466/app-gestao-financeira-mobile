import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CategoryId } from '../models';

/**
 * Rotas da pilha de Autenticação (usuário deslogado).
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { initialEmail?: string } | undefined;
};

/**
 * Rotas das 4 abas principais da Barra de Navegação Inferior.
 * O 5º item central (+) aciona o modal global de nova transação via FinanceContext.
 */
export type MainTabsParamList = {
  Dashboard: undefined;
  Planning: undefined;
  Reports: undefined;
  Transactions: { filterCategoryId?: CategoryId } | undefined;
};

/**
 * Rotas da pilha principal autenticada (MainTabs + telas de Configurações e Perfil).
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  Settings: undefined;
  ProfileEdit: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabsParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
