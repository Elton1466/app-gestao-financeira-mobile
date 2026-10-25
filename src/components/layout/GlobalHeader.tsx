import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  borderRadius,
  colors,
  headerTitleShadow,
  MIN_TOUCH_TARGET,
  spacing,
  typography,
} from '../../theme';
import { UserInitialsAvatar } from '../common/UserInitialsAvatar';
import { NexoLogo } from '../common/NexoLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export interface GlobalHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'dashboard' | 'internal';
  showActions?: boolean;
  onPressSettings?: () => void;
  onPressProfile?: () => void;
  userName?: string;
  userEmail?: string;
  avatarUri?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cabeçalho Global nexo (#081F4D)
 * - Identidade oficial com símbolo nexo.
 * - Suporta variante 'dashboard' e variante 'internal'.
 * - Textos em branco com sombra sutil (headerTitleShadow).
 * - Canto superior direito exibe o Avatar com as iniciais do usuário.
 * - Ao clicar no avatar de iniciais, abre o menu rápido de ações do usuário.
 * - Respeita dinamicamente a barra de status / notch via useSafeAreaInsets().
 */
export function GlobalHeader({
  title,
  subtitle,
  variant = 'dashboard',
  showActions = true,
  onPressSettings,
  onPressProfile,
  userName,
  userEmail,
  children,
  style,
}: GlobalHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors: themeColors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const dynamicPaddingTop = Math.max(insets.top, 20) + 12;
  const displayName = userName ?? user?.name ?? 'Carlos Roberto';
  const displayEmail = userEmail ?? user?.email ?? 'carlos.roberto@email.com';

  const handleOpenProfile = () => {
    setMenuVisible(false);
    onPressProfile?.();
  };

  const handleOpenSettings = () => {
    setMenuVisible(false);
    onPressSettings?.();
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: themeColors.headerBg, paddingTop: dynamicPaddingTop },
          variant === 'dashboard' && !children && styles.containerDashboardOverlap,
          {
            paddingBottom: children
              ? spacing.xl
              : variant === 'dashboard'
                ? 56
                : spacing.xxl,
          },
          style,
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.brandingRow}>
            <View style={styles.logoContainer}>
              <NexoLogo
                variant="icon"
                size={30}
                forceTheme="dark"
                accessibilityLabel="Símbolo nexo"
              />
            </View>
            <View style={styles.textBlock}>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    variant === 'dashboard' && styles.subtitleDashboard,
                    headerTitleShadow,
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.title,
                  headerTitleShadow,
                  !subtitle && styles.titleWithoutSubtitle,
                ]}
              >
                {title}
              </Text>
            </View>
          </View>

          {showActions ? (
            <View style={styles.actionsRow}>
              {/* Botão Único: Avatar Circular com Iniciais do Usuário */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Menu da conta de ${displayName}. Toque para abrir opções`}
                onPress={() => setMenuVisible(true)}
                style={({ pressed }) => [
                  styles.avatarButton,
                  pressed && styles.pressed,
                ]}
                hitSlop={6}
              >
                <UserInitialsAvatar
                  name={displayName}
                  size={42}
                  tone="header"
                />
              </Pressable>
            </View>
          ) : null}
        </View>

        {children ? (
          <View style={styles.childrenContainer}>{children}</View>
        ) : null}
      </View>

      {/* ── Menu Rápido do Usuário (Bottom Sheet Elegante) ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu ao tocar fora"
        >
          <Pressable
            style={[
              styles.menuCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                paddingBottom: Math.max(insets.bottom, 16) + 16,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Topo do Menu: Informações do Usuário e Botão Fechar */}
            <View style={styles.menuUserHeader}>
              <UserInitialsAvatar
                name={displayName}
                size={48}
                tone="light"
              />
              <View style={styles.menuUserInfo}>
                <Text
                  style={[styles.menuUserName, { color: themeColors.textPrimary }]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Text
                  style={[styles.menuUserEmail, { color: themeColors.textSecondary }]}
                  numberOfLines={1}
                >
                  {displayEmail}
                </Text>
              </View>
              <Pressable
                onPress={() => setMenuVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu de opções"
                hitSlop={8}
                style={[
                  styles.menuCloseBtn,
                  { backgroundColor: themeColors.backgroundAlt },
                ]}
              >
                <Feather name="x" size={20} color={themeColors.textSecondary} />
              </Pressable>
            </View>

            <View
              style={[
                styles.menuDivider,
                { backgroundColor: themeColors.border },
              ]}
            />

            {/* Opção 1: Alterar dados cadastrais */}
            <Pressable
              onPress={handleOpenProfile}
              accessibilityRole="button"
              accessibilityLabel="Alterar dados cadastrais"
              style={({ pressed }) => [
                styles.menuOptionRow,
                pressed && { backgroundColor: themeColors.surfaceSubtle },
              ]}
            >
              <View
                style={[
                  styles.menuOptionIconBox,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Feather name="edit-2" size={18} color={themeColors.accent} />
              </View>
              <View style={styles.menuOptionTextCol}>
                <Text
                  style={[
                    styles.menuOptionTitle,
                    { color: themeColors.textPrimary },
                  ]}
                >
                  Alterar dados cadastrais
                </Text>
                <Text
                  style={[
                    styles.menuOptionSubtitle,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Nome, e-mail, senha e limite mensal
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>

            {/* Opção 2: Configurações */}
            <Pressable
              onPress={handleOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Acessar Configurações"
              style={({ pressed }) => [
                styles.menuOptionRow,
                pressed && { backgroundColor: themeColors.surfaceSubtle },
              ]}
            >
              <View
                style={[
                  styles.menuOptionIconBox,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Feather name="settings" size={18} color={themeColors.accent} />
              </View>
              <View style={styles.menuOptionTextCol}>
                <Text
                  style={[
                    styles.menuOptionTitle,
                    { color: themeColors.textPrimary },
                  ]}
                >
                  Configurações
                </Text>
                <Text
                  style={[
                    styles.menuOptionSubtitle,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Aparência, segurança e sessão
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.headerBg,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    zIndex: 10,
  },
  containerDashboardOverlap: {
    paddingBottom: 56,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  logoContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0.2,
  },
  subtitleDashboard: {
    textTransform: 'capitalize',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  titleWithoutSubtitle: {
    marginTop: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  childrenContainer: {
    marginTop: spacing.lg,
  },

  /* ── Estilos do Menu Modal do Usuário ── */
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  menuUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuUserInfo: {
    flex: 1,
  },
  menuUserName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  menuUserEmail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  menuOptionPressed: {
    backgroundColor: colors.background,
  },
  menuOptionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionTextCol: {
    flex: 1,
  },
  menuOptionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  menuOptionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default GlobalHeader;
