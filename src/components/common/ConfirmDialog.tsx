import React, { useContext } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  borderRadius,
  colors as defaultColors,
  spacing,
  typography,
} from '../../theme';
import { FeatherIconName } from '../../constants/categories';
import AppButton from './AppButton';
import ThemeContext from '../../contexts/ThemeContext';

const colors = defaultColors;

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  iconName?: FeatherIconName;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de Confirmação (Heurística 5 de Nielsen — Prevenção de Erros):
 * Solicita confirmação explícita antes de ações destrutivas como exclusão de transação ou conta.
 */
export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = 'Sim, Excluir',
  cancelLabel = 'Cancelar',
  iconName = 'trash-2',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors ?? defaultColors;
  const isDark = themeContext?.isDark ?? false;

  const isDanger = variant === 'danger';
  const iconColor = isDanger ? colors.expense : (isDark ? colors.accent : colors.headerBg);
  const iconBg = isDanger
    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : colors.expenseBg)
    : (isDark ? 'rgba(0, 159, 227, 0.2)' : colors.brandTurquoiseLight);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.dialogCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar janela de confirmação"
            onPress={onCancel}
            disabled={loading}
            style={[styles.closeIconButton, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Feather name="x" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Feather name={iconName} size={24} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

          <View style={styles.actionsRow}>
            <View style={styles.buttonCell}>
              <AppButton
                title={cancelLabel}
                variant="outline"
                onPress={onCancel}
                disabled={loading}
              />
            </View>
            <View style={styles.buttonCell}>
              <AppButton
                title={confirmLabel}
                variant={isDanger ? 'danger' : 'primary'}
                onPress={onConfirm}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  closeIconButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  buttonCell: {
    flex: 1,
  },
});

export default ConfirmDialog;
