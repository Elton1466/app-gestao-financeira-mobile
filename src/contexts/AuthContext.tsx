import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CategoryId, UserProfile } from '../models';
import { initializeDatabase } from '../database/db';
import { runDatabaseSeed, DEMO_USER_ID, seedDemoData } from '../database/seed';
import {
  userRepository,
  type UpdateProfileInput as UpdateUserProfileInput,
} from '../repositories/userRepository';
import { budgetRepository } from '../repositories/budgetRepository';
import {
  isRequired,
  isValidEmail,
  isValidPassword,
} from '../utils/validators';

const LOGGED_USER_STORAGE_KEY = '@gestao_financeira:logged_user_id';

const DEFAULT_NEW_USER_BUDGETS: ReadonlyArray<{
  categoryId: CategoryId;
  limitAmount: number;
}> = [
  { categoryId: 'compras', limitAmount: 1000.0 },
  { categoryId: 'casa', limitAmount: 1500.0 },
  { categoryId: 'transporte', limitAmount: 500.0 },
  { categoryId: 'alimentacao', limitAmount: 1200.0 },
  { categoryId: 'saude', limitAmount: 400.0 },
  { categoryId: 'lazer', limitAmount: 400.0 },
];

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface AuthContextData {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (
    name: string,
    email: string,
    password: string,
    birthDate?: string,
    phone?: string,
  ) => Promise<AuthActionResult>;
  resetPassword: (
    email: string,
    newPassword?: string,
  ) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: UpdateUserProfileInput) => Promise<AuthActionResult>;
  toggleHideBalance: () => Promise<void>;
  toggleTwoFactor: (passwordConfirmation: string) => Promise<AuthActionResult>;
  updateMonthlyLimit: (limit: number) => Promise<AuthActionResult>;
  deleteAccount: (passwordConfirmation: string) => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth(): Promise<void> {
      try {
        await initializeDatabase();
        await runDatabaseSeed();

        const storedUserId = await AsyncStorage.getItem(LOGGED_USER_STORAGE_KEY);
        if (storedUserId) {
          let effectiveUserId = storedUserId;
          if (
            storedUserId === 'user-demo-cristiano' ||
            storedUserId === 'user-teste-22'
          ) {
            effectiveUserId = DEMO_USER_ID;
            await AsyncStorage.setItem(LOGGED_USER_STORAGE_KEY, DEMO_USER_ID);
          }

          const existingUser = await userRepository.findById(effectiveUserId);
          if (existingUser && isMounted) {
            setUser(existingUser);
            return;
          }
          await AsyncStorage.removeItem(LOGGED_USER_STORAGE_KEY);
        }
      } catch (err) {
        console.error('[AuthContext] Erro ao inicializar sessão:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (!isRequired(normalizedEmail) || !isValidEmail(normalizedEmail)) {
        return {
          success: false,
          error: 'Informe um endereço de e-mail válido.',
        };
      }

      if (!isRequired(normalizedPassword)) {
        return {
          success: false,
          error: 'Informe a sua senha para entrar.',
        };
      }

      try {
        const foundUser = await userRepository.findByEmail(normalizedEmail);
        if (!foundUser) {
          return {
            success: false,
            error: 'Nenhuma conta encontrada com este e-mail.',
          };
        }

        if (foundUser.passwordHash !== normalizedPassword) {
          return {
            success: false,
            error: 'Senha incorreta. Verifique suas credenciais e tente novamente.',
          };
        }

        await AsyncStorage.setItem(LOGGED_USER_STORAGE_KEY, foundUser.id);
        setUser(foundUser);
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro no signIn:', err);
        return {
          success: false,
          error: 'Não foi possível realizar o login no momento.',
        };
      }
    },
    [],
  );

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      birthDate?: string,
      phone?: string,
    ): Promise<AuthActionResult> => {
      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (!isRequired(trimmedName) || trimmedName.length < 2) {
        return {
          success: false,
          error: 'Informe o seu nome completo (mínimo de 2 caracteres).',
        };
      }

      if (!isRequired(normalizedEmail) || !isValidEmail(normalizedEmail)) {
        return {
          success: false,
          error: 'Informe um endereço de e-mail válido.',
        };
      }

      if (!isValidPassword(normalizedPassword, 6)) {
        return {
          success: false,
          error: 'A senha deve possuir pelo menos 6 caracteres.',
        };
      }

      try {
        const existingUser = await userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
          return {
            success: false,
            error:
              'Este e-mail já está em uso. Tente fazer login ou recuperar sua senha.',
          };
        }

        const newUser = await userRepository.createUser({
          name: trimmedName,
          email: normalizedEmail,
          passwordHash: normalizedPassword,
          birthDate: birthDate?.trim() || undefined,
          phone: phone?.trim() || undefined,
          monthlyGlobalLimit: 3000.0,
          twoFactorEnabled: false,
          hideBalance: false,
          hasCompletedOnboarding: false,
        });

        if (
          trimmedName.toLowerCase() === 'teste' ||
          normalizedEmail === 'teste@email.com' ||
          normalizedEmail.startsWith('teste@')
        ) {
          await seedDemoData(newUser.id);
        } else {
          const currentMonthYear = getCurrentMonthYear();
          for (const item of DEFAULT_NEW_USER_BUDGETS) {
            await budgetRepository.upsertCategoryBudget({
              userId: newUser.id,
              categoryId: item.categoryId,
              monthYear: currentMonthYear,
              limitAmount: item.limitAmount,
              isDemoData: false,
            });
          }
        }

        await AsyncStorage.setItem(LOGGED_USER_STORAGE_KEY, newUser.id);
        setUser(newUser);
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro no signUp:', err);
        return {
          success: false,
          error: 'Não foi possível criar a conta. Tente novamente.',
        };
      }
    },
    [],
  );

  const resetPassword = useCallback(
    async (email: string, newPassword?: string): Promise<AuthActionResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isRequired(normalizedEmail) || !isValidEmail(normalizedEmail)) {
        return {
          success: false,
          error: 'Informe um endereço de e-mail válido.',
        };
      }

      const passwordToSave =
        newPassword && newPassword.trim().length > 0
          ? newPassword.trim()
          : '123456';

      if (!isValidPassword(passwordToSave, 6)) {
        return {
          success: false,
          error: 'A nova senha deve ter pelo menos 6 caracteres.',
        };
      }

      try {
        const foundUser = await userRepository.findByEmail(normalizedEmail);
        if (!foundUser) {
          return {
            success: false,
            error: 'Nenhuma conta cadastrada com este endereço de e-mail.',
          };
        }

        const updatedUser = await userRepository.updateSecuritySettings(
          foundUser.id,
          {
            passwordHash: passwordToSave,
          },
        );

        if (updatedUser) {
          setUser((prev) =>
            prev?.id === updatedUser.id ? updatedUser : prev,
          );
        }
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro ao redefinir senha:', err);
        return {
          success: false,
          error: 'Erro ao redefinir a senha no banco de dados.',
        };
      }
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(LOGGED_USER_STORAGE_KEY);
    } catch (err) {
      console.error('[AuthContext] Erro ao remover sessão:', err);
    } finally {
      setUser(null);
    }
  }, []);

  const updateUserProfile = useCallback(
    async (data: UpdateUserProfileInput): Promise<AuthActionResult> => {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      if (data.name !== undefined && !isRequired(data.name)) {
        return { success: false, error: 'O nome não pode ficar vazio.' };
      }

      if (data.email !== undefined && !isValidEmail(data.email)) {
        return { success: false, error: 'Informe um e-mail válido.' };
      }

      try {
        if (
          data.email !== undefined &&
          data.email.trim().toLowerCase() !== user.email.toLowerCase()
        ) {
          const emailOwner = await userRepository.findByEmail(data.email);
          if (emailOwner && emailOwner.id !== user.id) {
            return {
              success: false,
              error: 'Este e-mail já está em uso por outra conta.',
            };
          }
        }

        const updated = await userRepository.updateProfile(user.id, data);
        if (updated) {
          setUser(updated);
        }
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro ao atualizar perfil:', err);
        return {
          success: false,
          error: 'Não foi possível salvar as alterações do perfil.',
        };
      }
    },
    [user],
  );

  const toggleHideBalance = useCallback(async (): Promise<void> => {
    if (!user) {
      return;
    }
    try {
      const updated = await userRepository.updateSecuritySettings(user.id, {
        hideBalance: !user.hideBalance,
      });
      if (updated) {
        setUser(updated);
      }
    } catch (err) {
      console.error('[AuthContext] Erro ao alternar visibilidade de saldo:', err);
    }
  }, [user]);

  const toggleTwoFactor = useCallback(
    async (passwordConfirmation: string): Promise<AuthActionResult> => {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      if (!isRequired(passwordConfirmation)) {
        return {
          success: false,
          error: 'Confirme sua senha atual para alterar a autenticação 2FA.',
        };
      }

      if (passwordConfirmation.trim() !== user.passwordHash) {
        return {
          success: false,
          error: 'Senha incorreta. A configuração de 2FA não foi alterada.',
        };
      }

      try {
        const updated = await userRepository.updateSecuritySettings(user.id, {
          twoFactorEnabled: !user.twoFactorEnabled,
        });
        if (updated) {
          setUser(updated);
        }
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro ao alternar 2FA:', err);
        return {
          success: false,
          error: 'Não foi possível atualizar a autenticação em duas etapas.',
        };
      }
    },
    [user],
  );

  const updateMonthlyLimit = useCallback(
    async (limit: number): Promise<AuthActionResult> => {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      if (!Number.isFinite(limit) || limit <= 0) {
        return {
          success: false,
          error: 'Informe um limite mensal maior que zero.',
        };
      }

      try {
        const updated = await userRepository.updateSecuritySettings(user.id, {
          monthlyGlobalLimit: limit,
        });
        if (updated) {
          setUser(updated);
        }
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro ao atualizar limite mensal:', err);
        return {
          success: false,
          error: 'Não foi possível atualizar o limite global mensal.',
        };
      }
    },
    [user],
  );

  const deleteAccount = useCallback(
    async (passwordConfirmation: string): Promise<AuthActionResult> => {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      if (!isRequired(passwordConfirmation)) {
        return {
          success: false,
          error: 'Digite sua senha atual para confirmar a exclusão da conta.',
        };
      }

      if (passwordConfirmation.trim() !== user.passwordHash) {
        return {
          success: false,
          error: 'Senha incorreta. A exclusão da conta foi cancelada.',
        };
      }

      try {
        await userRepository.deleteUserAccountCascade(user.id);
        await AsyncStorage.removeItem(LOGGED_USER_STORAGE_KEY);
        setUser(null);
        return { success: true };
      } catch (err) {
        console.error('[AuthContext] Erro ao excluir conta:', err);
        return {
          success: false,
          error: 'Não foi possível excluir a conta. Tente novamente.',
        };
      }
    },
    [user],
  );

  const value = useMemo<AuthContextData>(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      updateUserProfile,
      toggleHideBalance,
      toggleTwoFactor,
      updateMonthlyLimit,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      updateUserProfile,
      toggleHideBalance,
      toggleTwoFactor,
      updateMonthlyLimit,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
}
