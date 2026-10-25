import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme';
import { FeatherIconName } from '../../constants/categories';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TutorialStep {
  stepNumber: number;
  badgeText: string;
  title: string;
  description: string;
  highlights: string[];
  iconName: FeatherIconName;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: 1,
    badgeText: 'PASSO 1 DE 4 • REGISTRO RÁPIDO',
    title: 'Lançamento Ágil pelo Botão (+)',
    description:
      'Registre receitas ou despesas em poucos segundos tocando no botão central (+) da barra inferior em qualquer tela do aplicativo.',
    highlights: [
      'Grade 3x3 de categorias com destaque visual imediato (#009FE3)',
      'Chips rápidos de valor (+R$ 25, +R$ 50, +R$ 100) para economizar digitação',
      'Atalho de Transações Frequentes para repetir gastos recorrentes com 1 toque',
    ],
    iconName: 'plus-circle',
  },
  {
    stepNumber: 2,
    badgeText: 'PASSO 2 DE 4 • PLANEJAMENTO E TETOS',
    title: 'Limites Mensais e Alertas Inteligentes',
    description:
      'Na aba Planejamento, defina tetos de gastos por categoria e acompanhe suas Metas Financeiras com barras de progresso em tempo real.',
    highlights: [
      'Barras sem trava artificial em 100%: veja estouros reais (ex: 110% utilizado)',
      'Toque no ícone de alerta (!) para receber diagnóstico e orientações para seu limite',
      'Use o Simulador de Parcelas (2x a 24x) antes de fazer novas compras',
    ],
    iconName: 'target',
  },
  {
    stepNumber: 3,
    badgeText: 'PASSO 3 DE 4 • ANÁLISE E DIAGNÓSTICO',
    title: 'Score de Saúde Financeira e Evolução',
    description:
      'Na aba Relatórios, entenda sua nota de 0 a 100 com diagnósticos claros sobre seus hábitos.',
    highlights: [
      'Blocos explicativos detalham sua taxa de poupança e categorias críticas',
      'Gráfico de Evolução Patrimonial com valores completos em Reais (sem abreviações "k")',
      'Exportação de relatório em planilha completa com múltiplas abas',
    ],
    iconName: 'pie-chart',
  },
  {
    stepNumber: 4,
    badgeText: 'PASSO 4 DE 4 • SEGURANÇA E PRIVACIDADE',
    title: 'Privacidade e Controle Total dos Dados',
    description:
      'Seus dados ficam salvos com segurança no seu dispositivo com proteção contra ações acidentais.',
    highlights: [
      'Armazenamento 100% local com isolamento e segurança dos dados',
      'Modo Privacidade (ícone de olho no topo) oculta saldos em ambientes públicos',
      'Conformidade com a LGPD e opção de exclusão permanente sob seu controle',
    ],
    iconName: 'shield',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { user, updateUserProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStep = TUTORIAL_STEPS[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === TUTORIAL_STEPS.length - 1;

  const getStepAccent = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return {
          color: colors.accent,
          bg: isDark ? 'rgba(0, 159, 227, 0.2)' : colors.accentLight,
        };
      case 2:
        return {
          color: isDark ? colors.accent : colors.secondary,
          bg: isDark ? 'rgba(56, 189, 248, 0.2)' : colors.secondaryLight,
        };
      case 3:
        return {
          color: colors.income,
          bg: isDark ? 'rgba(34, 197, 94, 0.2)' : colors.incomeBg,
        };
      case 4:
      default:
        return {
          color: isDark ? colors.accent : colors.primary,
          bg: isDark ? 'rgba(0, 159, 227, 0.2)' : colors.primaryLight,
        };
    }
  };

  const stepAccent = getStepAccent(currentStep.stepNumber);

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setCurrentIndex(0);
    onClose();
    if (user && !user.hasCompletedOnboarding) {
      await updateUserProfile({ hasCompletedOnboarding: true });
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      void handleFinish();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => void handleFinish()}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 }]}>
          {/* Topo do Modal */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.stepBadge,
                { backgroundColor: stepAccent.bg },
              ]}
            >
              <Text
                style={[styles.stepBadgeText, { color: stepAccent.color }]}
              >
                {currentStep.badgeText}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => void handleFinish()}
              accessibilityRole="button"
              accessibilityLabel="Fechar tutorial interativo"
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Ícone Central do Slide */}
          <View
            style={[
              styles.heroIconCircle,
              { backgroundColor: stepAccent.bg },
            ]}
          >
            <Feather
              name={currentStep.iconName}
              size={36}
              color={stepAccent.color}
            />
          </View>

          {/* Título e Explicação */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{currentStep.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{currentStep.description}</Text>

          {/* Lista de Destaques Práticos */}
          <View style={[styles.highlightsBox, { backgroundColor: colors.surfaceSubtle }]}>
            {currentStep.highlights.map((item, idx) => (
              <View key={idx} style={styles.highlightRow}>
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: stepAccent.bg },
                  ]}
                >
                  <Feather
                    name="check"
                    size={12}
                    color={stepAccent.color}
                  />
                </View>
                <Text style={[styles.highlightText, { color: colors.textPrimary }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Indicadores de Paginação (Dots) */}
          <View style={styles.dotsRow}>
            {TUTORIAL_STEPS.map((step, idx) => {
              const active = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={step.stepNumber}
                  onPress={() => setCurrentIndex(idx)}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.borderLight },
                    active && {
                      width: 24,
                      backgroundColor: stepAccent.color,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ir para passo ${step.stepNumber}`}
                />
              );
            })}
          </View>

          {/* Botões de Navegação: Anterior | Próximo / Concluir */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderLight },
                isFirstStep && styles.secondaryBtnDisabled,
              ]}
              onPress={handlePrevious}
              disabled={isFirstStep}
              accessibilityRole="button"
              accessibilityLabel="Slide anterior"
            >
              <Feather
                name="chevron-left"
                size={18}
                color={isFirstStep ? colors.textMuted : colors.textPrimary}
              />
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: colors.textPrimary },
                  isFirstStep && { color: colors.textMuted },
                ]}
              >
                Anterior
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: stepAccent.color },
              ]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={
                isLastStep ? 'Concluir tutorial' : 'Próximo slide'
              }
            >
              <Text style={[styles.primaryBtnText, isDark && stepAccent.color === colors.accent && { color: '#081F4D' }]}>
                {isLastStep ? 'Concluir' : 'Próximo'}
              </Text>
              <Feather
                name={isLastStep ? 'check' : 'chevron-right'}
                size={18}
                color={isDark && stepAccent.color === colors.accent ? '#081F4D' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelLinkBtn}
            onPress={() => void handleFinish()}
            accessibilityRole="button"
            accessibilityLabel="Cancelar e fechar tutorial"
          >
            <Text style={[styles.cancelLinkText, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  highlightsBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  highlightText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
  },
  secondaryBtnDisabled: {
    opacity: 0.5,
  },
  secondaryBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  primaryBtn: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelLinkBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLinkText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
