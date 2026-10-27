import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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
import { AppCard } from '../../components/common/AppCard';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { NexoLogo } from '../../components/common/NexoLogo';
import { OnboardingModal } from '../../components/modals/OnboardingModal';
import { useAuth } from '../../contexts/AuthContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDateFull } from '../../utils/date';
import type { RootStackScreenProps } from '../../@types/navigation';
import type { SupportTicket, SupportTicketType } from '../../models';

type Props = RootStackScreenProps<'Settings'>;

const TICKET_TYPES: ReadonlyArray<{
  id: SupportTicketType;
  label: string;
  icon: 'message-square' | 'alert-octagon' | 'Zap' | 'help-circle';
}> = [
  { id: 'feedback', label: 'Feedback', icon: 'message-square' },
  { id: 'bug', label: 'Reportar Bug', icon: 'alert-octagon' },
  { id: 'suggestion', label: 'Sugestão', icon: 'help-circle' },
  { id: 'support_chat', label: 'Chat de Suporte', icon: 'message-square' },
];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount } = useAuth();
  const { themeMode, setThemeMode, colors: themeColors, isDark } = useTheme();
  const {
    tickets,
    addSupportTicket,
    updateSupportTicket,
    deleteSupportTicket,
    triggerSuccessFeedback,
  } = useFinance();

  // 1. Modal de Tutorial Interativo (Heurística 10)
  const [onboardingModalVisible, setOnboardingModalVisible] =
    useState<boolean>(false);

  // 2. Modal de Suporte / Feedback / Reportar Bug (CRUD no SQLite)
  const [supportModalVisible, setSupportModalVisible] =
    useState<boolean>(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(
    null,
  );
  const [ticketType, setTicketType] = useState<SupportTicketType>('feedback');
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [savingTicket, setSavingTicket] = useState<boolean>(false);

  // 3. Modal de Política de Privacidade e Termos de Uso (LGPD)
  const [privacyModalVisible, setPrivacyModalVisible] =
    useState<boolean>(false);

  // 4. Modal de Exclusão Permanente de Conta (Heurística 5)
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState<boolean>(false);
  const [deleteAccountPassword, setDeleteAccountPassword] =
    useState<string>('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  );
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);

  // Handlers — Suporte / Feedback CRUD
  const handleOpenSupportModal = (initialType: SupportTicketType = 'feedback') => {
    setEditingTicket(null);
    setTicketType(initialType);
    setTicketSubject('');
    setTicketMessage('');
    setTicketError(null);
    setSupportModalVisible(true);
  };

  const handleStartEditTicket = (ticket: SupportTicket) => {
    setEditingTicket(ticket);
    setTicketType(ticket.type);
    setTicketSubject(ticket.subject);
    setTicketMessage(ticket.message);
    setTicketError(null);
  };

  const handleCancelEditTicket = () => {
    setEditingTicket(null);
    setTicketSubject('');
    setTicketMessage('');
    setTicketError(null);
  };

  const handleSaveTicket = async () => {
    if (!ticketSubject.trim()) {
      setTicketError('Informe o assunto do chamado.');
      return;
    }
    if (!ticketMessage.trim() || ticketMessage.trim().length < 5) {
      setTicketError('Descreva sua mensagem com pelo menos 5 caracteres.');
      return;
    }

    setSavingTicket(true);
    try {
      if (editingTicket) {
        await updateSupportTicket(editingTicket.id, {
          type: ticketType,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        });
        triggerSuccessFeedback('Chamado atualizado com sucesso!');
      } else {
        await addSupportTicket({
          type: ticketType,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        });
        triggerSuccessFeedback('Mensagem enviada ao suporte com sucesso!');
      }
      setEditingTicket(null);
      setTicketSubject('');
      setTicketMessage('');
      setTicketError(null);
    } finally {
      setSavingTicket(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    await deleteSupportTicket(id);
    if (editingTicket?.id === id) {
      handleCancelEditTicket();
    }
    triggerSuccessFeedback('Chamado removido do histórico.');
  };

  // Handlers — Exclusão de Conta (Cascata no SQLite)
  const handleOpenDeleteAccountModal = () => {
    setDeleteAccountPassword('');
    setDeleteAccountError(null);
    setDeleteAccountModalVisible(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError(
        'Por segurança, digite sua senha para confirmar a exclusão permanente.',
      );
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await deleteAccount(deleteAccountPassword);
      if (!res.success) {
        setDeleteAccountError(
          res.error ?? 'Senha incorreta. Não foi possível excluir a conta.',
        );
        return;
      }
      setDeleteAccountModalVisible(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <View
      style={[
        styles.screenRoot,
        { backgroundColor: themeColors.background },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho Compacto (Heurística 3 e 8) ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: themeColors.headerBg,
              paddingTop: Math.max(insets.top, 20) + 12,
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar para a tela anterior"
              style={styles.backBtn}
            >
              <Feather
                name="arrow-left"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Configurações</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Bloco 1: APARÊNCIA (TEMA DO APLICATIVO) ── */}
          <Text style={[styles.groupHeading, { color: themeColors.textSecondary }]}>
            APARÊNCIA
          </Text>
          <AppCard style={styles.menuCard}>
            <View style={styles.themeCardHeader}>
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Feather
                  name={themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sun' : 'smartphone'}
                  size={18}
                  color={themeColors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
                  Tema do Aplicativo
                </Text>
                <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>
                  {themeMode === 'light'
                    ? 'Modo Claro ativo'
                    : themeMode === 'dark'
                    ? 'Modo Noturno ativo'
                    : 'Acompanhando o padrão do sistema'}
                </Text>
              </View>
            </View>

            <View style={styles.themeOptionsGrid}>
              {(
                [
                  { id: 'light', label: 'Claro', icon: 'sun' },
                  { id: 'dark', label: 'Noturno', icon: 'moon' },
                  { id: 'system', label: 'Padrão do Sistema', icon: 'smartphone' },
                ] as const
              ).map((opt) => {
                const isSelected = themeMode === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={async () => {
                      await setThemeMode(opt.id);
                      triggerSuccessFeedback(
                        opt.id === 'light'
                          ? 'Tema Claro ativado!'
                          : opt.id === 'dark'
                          ? 'Tema Noturno ativado!'
                          : 'Tema configurado para o padrão do sistema!',
                      );
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Tema ${opt.label}`}
                    style={[
                      styles.themeOptionPill,
                      {
                        backgroundColor: isSelected
                          ? themeColors.primaryLight
                          : themeColors.surfaceSubtle,
                        borderColor: isSelected
                          ? themeColors.accent
                          : themeColors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={15}
                      color={
                        isSelected ? themeColors.accent : themeColors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color: isSelected
                            ? themeColors.accent
                            : themeColors.textPrimary,
                        },
                        isSelected && styles.themeOptionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Feather
                        name="check"
                        size={14}
                        color={themeColors.accent}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* ── Bloco 2: SEGURANÇA E PRIVACIDADE ── */}
          <Text style={[styles.groupHeading, { color: themeColors.textSecondary }]}>
            SEGURANÇA E PRIVACIDADE
          </Text>
          <AppCard style={styles.menuCard}>
            {/* Privacidade e termos de uso */}
            <Pressable
              onPress={() => setPrivacyModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Privacidade e termos de uso"
              style={styles.menuRow}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Feather
                  name="file-text"
                  size={18}
                  color={themeColors.accent}
                />
              </View>
              <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
                Privacidade e termos de uso
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>
          </AppCard>

          {/* ── Bloco 3: AJUDA E SUPORTE ── */}
          <Text style={[styles.groupHeading, { color: themeColors.textSecondary }]}>
            AJUDA E SUPORTE
          </Text>
          <AppCard style={styles.menuCard}>
            {/* Tutorial do aplicativo */}
            <Pressable
              onPress={() => setOnboardingModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Tutorial do aplicativo"
              style={styles.menuRow}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Feather
                  name="book-open"
                  size={18}
                  color={themeColors.accent}
                />
              </View>
              <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
                Tutorial do aplicativo
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>

            <View
              style={[
                styles.divider,
                { backgroundColor: themeColors.border },
              ]}
            />

            {/* Suporte e feedback */}
            <Pressable
              onPress={() => handleOpenSupportModal('feedback')}
              accessibilityRole="button"
              accessibilityLabel="Suporte e feedback"
              style={styles.menuRow}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Feather name="message-square" size={18} color={themeColors.accent} />
              </View>
              <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
                Suporte e feedback
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>
          </AppCard>

          {/* ── Bloco 4: SESSÃO ── */}
          <Text style={[styles.groupHeading, { color: themeColors.textSecondary }]}>
            SESSÃO
          </Text>
          <AppCard style={styles.menuCard}>
            {/* Sair da conta */}
            <Pressable
              onPress={() => void signOut()}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              style={styles.menuRow}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: themeColors.surfaceSubtle },
                ]}
              >
                <Feather
                  name="log-out"
                  size={18}
                  color={themeColors.textPrimary}
                />
              </View>
              <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
                Sair da conta
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.textSecondary}
              />
            </Pressable>

            <View
              style={[
                styles.divider,
                { backgroundColor: themeColors.border },
              ]}
            />

            {/* Excluir minha conta */}
            <Pressable
              onPress={handleOpenDeleteAccountModal}
              accessibilityRole="button"
              accessibilityLabel="Excluir minha conta"
              style={styles.menuRow}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: themeColors.expenseBg },
                ]}
              >
                <Feather name="trash-2" size={18} color={themeColors.expense} />
              </View>
              <Text style={[styles.menuTitle, styles.menuTitleDanger, { color: themeColors.expense }]}>
                Excluir minha conta
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={themeColors.expense}
              />
            </Pressable>
          </AppCard>

          {/* ── Bloco 5: SOBRE O NEXO ── */}
          <Text style={[styles.groupHeading, { color: themeColors.textSecondary }]}>
            SOBRE O NEXO
          </Text>
          <AppCard style={styles.aboutCard}>
            <NexoLogo
              variant="full"
              width={200}
              height={50}
              accessibilityLabel="Logotipo nexo — Controle Financeiro Pessoal"
            />
            <Text style={[styles.aboutVersion, { color: themeColors.textMuted }]}>
              Versão 1.0.0
            </Text>
            <Text style={[styles.aboutAcademicText, { color: themeColors.textSecondary }]}>
              Nexo — Controle Financeiro Pessoal. Aplicativo voltado à organização de lançamentos, metas e planejamento orçamentário.
            </Text>
          </AppCard>
        </View>
      </ScrollView>

      {/* ── Modal 2: Tutorial Interativo (Heurística 10) ── */}
      <OnboardingModal
        visible={onboardingModalVisible}
        onClose={() => setOnboardingModalVisible(false)}
      />

      {/* ── Modal 3: CRUD Completo de Suporte / Feedback / Reportar Bug ── */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.borderLight,
                borderTopWidth: 1,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dialogTitle, { color: themeColors.textPrimary }]}>
                  {editingTicket
                    ? 'Editar Chamado de Suporte'
                    : 'Central de Feedback e Suporte'}
                </Text>
                <Text style={[styles.dialogSubtitle, { color: themeColors.textSecondary }]}>
                  Envie sugestões, reporte bugs ou acompanhe seus chamados
                </Text>
              </View>
              <Pressable
                onPress={() => setSupportModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar central de suporte"
                style={[styles.closeIconBtn, { backgroundColor: themeColors.surfaceSubtle }]}
              >
                <Feather name="x" size={20} color={themeColors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Seletor de Tipo de Chamado */}
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Tipo de Solicitação</Text>
              <View style={styles.ticketTypeRow}>
                {TICKET_TYPES.map((t) => {
                  const active = ticketType === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setTicketType(t.id)}
                      style={[
                        styles.ticketTypeChip,
                        {
                          backgroundColor: themeColors.surfaceSubtle,
                          borderColor: themeColors.borderLight,
                        },
                        active && {
                          borderColor: themeColors.accent,
                          backgroundColor: isDark ? 'rgba(0, 159, 227, 0.2)' : themeColors.accentLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ticketTypeChipText,
                          { color: themeColors.textSecondary },
                          active && {
                            color: isDark ? themeColors.accent : themeColors.primary,
                            fontFamily: typography.fontFamily.bold,
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <AppInput
                label="Assunto"
                value={ticketSubject}
                onChangeText={setTicketSubject}
                placeholder="Ex: Dúvida sobre exportação CSV"
              />

              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Mensagem / Descrição</Text>
              <TextInput
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Descreva os detalhes da sua mensagem..."
                placeholderTextColor={themeColors.textPlaceholder}
                multiline
                numberOfLines={4}
                style={[
                  styles.multilineInput,
                  {
                    backgroundColor: themeColors.surfaceSubtle,
                    borderColor: themeColors.borderLight,
                    color: themeColors.textPrimary,
                  },
                ]}
              />

              {ticketError ? (
                <Text style={[styles.errorText, { color: themeColors.expense }]}>{ticketError}</Text>
              ) : null}

              <View style={styles.ticketFormActions}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={editingTicket ? 'Cancelar Edição' : 'Cancelar'}
                    variant="outline"
                    onPress={
                      editingTicket
                        ? handleCancelEditTicket
                        : () => setSupportModalVisible(false)
                    }
                  />
                </View>
                <View style={{ flex: 1.3 }}>
                  <AppButton
                    title={
                      editingTicket ? 'Salvar Alterações' : 'Enviar Chamado'
                    }
                    tone="accent"
                    leftIcon="send"
                    loading={savingTicket}
                    onPress={() => void handleSaveTicket()}
                  />
                </View>
              </View>

              {/* Histórico de Chamados no SQLite */}
              <View style={[styles.historyDivider, { backgroundColor: themeColors.borderLight }]} />
              <Text style={[styles.historyTitle, { color: themeColors.textPrimary }]}>
                Meus Chamados Registrados ({tickets.length})
              </Text>

              {tickets.length === 0 ? (
                <Text style={[styles.emptyTicketsText, { color: themeColors.textSecondary }]}>
                  Nenhum chamado enviado até o momento.
                </Text>
              ) : (
                <View style={styles.ticketsList}>
                  {tickets.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.ticketCard,
                        {
                          backgroundColor: themeColors.surfaceSubtle,
                          borderColor: themeColors.borderLight,
                        },
                      ]}
                    >
                      <View style={styles.ticketCardTop}>
                        <View style={styles.ticketBadgeRow}>
                          <View style={[
                            styles.ticketTypeBadge,
                            { backgroundColor: isDark ? 'rgba(0, 159, 227, 0.2)' : themeColors.accentLight },
                          ]}>
                            <Text style={[
                              styles.ticketTypeBadgeText,
                              { color: isDark ? themeColors.accent : themeColors.primary },
                            ]}>
                              {item.type.toUpperCase()}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.ticketStatusBadge,
                              {
                                backgroundColor:
                                  item.status === 'respondido'
                                    ? (isDark ? 'rgba(34, 197, 94, 0.2)' : themeColors.incomeBg)
                                    : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7'),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ticketStatusText,
                                {
                                  color:
                                    item.status === 'respondido'
                                      ? themeColors.income
                                      : (isDark ? themeColors.warningDark : colors.warningDark),
                                },
                              ]}
                            >
                              {item.status === 'respondido'
                                ? 'Respondido'
                                : 'Enviado'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.ticketDateText, { color: themeColors.textSecondary }]}>
                          {formatDateFull(item.createdAt)}
                        </Text>
                      </View>

                      <Text style={[styles.ticketSubjectText, { color: themeColors.textPrimary }]}>
                        {item.subject}
                      </Text>
                      <Text style={[styles.ticketMessageText, { color: themeColors.textSecondary }]}>
                        {item.message}
                      </Text>

                      <View style={styles.ticketActionsRow}>
                        <Pressable
                          onPress={() => handleStartEditTicket(item)}
                          accessibilityRole="button"
                          accessibilityLabel={`Editar chamado ${item.subject}`}
                          style={styles.ticketActionBtn}
                        >
                          <Feather
                            name="edit-2"
                            size={13}
                            color={isDark ? themeColors.accent : themeColors.primary}
                          />
                          <Text style={[
                            styles.ticketActionEditText,
                            { color: isDark ? themeColors.accent : themeColors.primary },
                          ]}>Editar</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => void handleDeleteTicket(item.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Excluir chamado ${item.subject}`}
                          style={styles.ticketActionBtn}
                        >
                          <Feather
                            name="trash-2"
                            size={13}
                            color={themeColors.expense}
                          />
                          <Text style={[styles.ticketActionDeleteText, { color: themeColors.expense }]}>
                            Excluir
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal 4: Política de Privacidade e Termos de Uso (LGPD) ── */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={[
            styles.dialogCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.borderLight,
              borderWidth: 1,
            },
          ]}>
            <View style={styles.dialogHeaderRow}>
              <Text style={[styles.dialogTitle, { color: themeColors.textPrimary, flex: 1 }]}>
                Política de Privacidade e Termos (LGPD)
              </Text>
              <Pressable
                onPress={() => setPrivacyModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar política de privacidade"
                style={[styles.closeIconBtn, { backgroundColor: themeColors.surfaceSubtle }]}
              >
                <Feather name="x" size={20} color={themeColors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280, marginVertical: spacing.sm }}>
              <Text style={[styles.privacyParagraph, { color: themeColors.textSecondary }]}>
                1. Armazenamento Local Seguro: Todos os seus registros
                financeiros, metas, orçamentos e configurações são persistidos
                localmente no seu dispositivo de forma segura, sem
                compartilhamento não autorizado com terceiros.
              </Text>
              <Text style={[styles.privacyParagraph, { color: themeColors.textSecondary }]}>
                2. Conformidade com a LGPD (Lei nº 13.709/2018): Você possui
                direito de acesso, retificação, portabilidade (via exportação de
                planilha) e eliminação total dos seus dados pessoais a
                qualquer momento.
              </Text>
              <Text style={[styles.privacyParagraph, { color: themeColors.textSecondary }]}>
                3. Acessibilidade e Conforto Visual: A interface foi projetada
                com alto contraste, leitura clara e baixo consumo energético de processamento e rede.
              </Text>
            </ScrollView>
            <View style={styles.dialogBtnsRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setPrivacyModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1.3 }}>
                <AppButton
                  title="Entendi e Concordo"
                  tone="teal"
                  onPress={() => setPrivacyModalVisible(false)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal 5: Exclusão Permanente da Conta ── */}
      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={[
            styles.dialogCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.borderLight,
              borderWidth: 1,
            },
          ]}>
            <View style={styles.dialogCloseTopRow}>
              <Pressable
                onPress={() => setDeleteAccountModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar exclusão de conta"
                style={[styles.closeIconBtn, { backgroundColor: themeColors.surfaceSubtle }]}
              >
                <Feather name="x" size={20} color={themeColors.textSecondary} />
              </Pressable>
            </View>
            <View
              style={[
                styles.securityBadgeCircle,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : themeColors.expenseBg },
              ]}
            >
              <Feather name="alert-triangle" size={26} color={themeColors.expense} />
            </View>
            <Text style={[styles.dialogTitle, { color: themeColors.expense }]}>
              Excluir Conta Permanentemente?
            </Text>
            <Text style={[styles.dialogSubtitle, { color: themeColors.textSecondary }]}>
              Esta ação é irreversível. Todas as suas transações, metas,
              orçamentos e chamados serão apagados permanentemente do seu
              dispositivo.
            </Text>

            <AppInput
              label="Confirme sua senha para excluir"
              value={deleteAccountPassword}
              onChangeText={(txt) => {
                setDeleteAccountPassword(txt);
                if (deleteAccountError) setDeleteAccountError(null);
              }}
              secureTextEntry
              placeholder="Digite sua senha atual"
              errorMessage={deleteAccountError ?? undefined}
            />

            <View style={styles.dialogBtnsRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setDeleteAccountModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <AppButton
                  title="Apagar Tudo"
                  variant="danger"
                  loading={deletingAccount}
                  onPress={() => void handleConfirmDeleteAccount()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
    ...headerTitleShadow,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  groupHeading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: spacing.xs,
    marginLeft: 4,
  },
  menuCard: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  aboutCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  aboutLogo: {
    width: 220,
    height: 48,
    marginBottom: spacing.xs,
  },
  aboutVersion: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  aboutAcademicText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
    minHeight: 52,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuTitleDanger: {
    color: colors.expense,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  themeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
  },
  themeOptionsGrid: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  themeOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    gap: spacing.sm,
    minHeight: 44,
  },
  themeOptionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs + 1,
    flex: 1,
  },
  themeOptionTextSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dialogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dialogCloseTopRow: {
    alignItems: 'flex-end',
    marginBottom: -8,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  securityBadgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  dialogSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  dialogBtnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  ticketTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  ticketTypeChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  ticketTypeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  ticketTypeChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  ticketTypeChipTextActive: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  multilineInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.expense,
    marginTop: spacing.xs,
  },
  ticketFormActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  historyDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  historyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyTicketsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  ticketsList: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  ticketCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
  },
  ticketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ticketBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ticketTypeBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ticketTypeBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: colors.primary,
  },
  ticketStatusBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ticketStatusText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
  },
  ticketDateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  ticketSubjectText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ticketMessageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  ticketActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  ticketActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  ticketActionEditText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  ticketActionDeleteText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.expense,
  },
  privacyParagraph: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
});
