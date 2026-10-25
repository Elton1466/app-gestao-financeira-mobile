import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing, useReducedMotion } from 'react-native-reanimated';

/**
 * Sistema Centralizado de Tokens de Movimento (DESIGN.md & Reanimated)
 *
 * - fast: 120–180 ms (microinterações, toques em botões, seleção de chips/switches)
 * - normal: 200–280 ms (transições de filtros, abertura de menus, expansão de seções)
 * - emphasis: 350–500 ms (avanço de metas, barras de orçamento, contagem de valores)
 * - entrance: 250–400 ms (entrada suave escalonada de elementos na tela)
 */
export const motion = {
  duration: {
    fast: 150,
    normal: 240,
    emphasis: 400,
    entrance: 300,
    stagger: 60,
  },
  easing: {
    // Curva cúbica padrão para movimento natural
    standard: Easing.bezier(0.25, 0.1, 0.25, 1),
    // Desaceleração para entradas
    decelerate: Easing.out(Easing.cubic),
    // Aceleração para saídas
    accelerate: Easing.in(Easing.cubic),
    // Curva enfatizada para dados e progresso
    emphasized: Easing.bezier(0.2, 0.0, 0, 1.0),
  },
  // Deslocamento vertical discreto para transições de entrada (8 a 12 px)
  distance: {
    subtle: 6,
    entrance: 10,
    modal: 16,
  },
  // Escala para microinterações táteis em botões e cards
  scale: {
    pressedButton: 0.97,
    pressedCard: 0.985,
    normal: 1,
  },
} as const;

export type MotionTokens = typeof motion;

/**
 * Hook universal de detecção de Movimento Reduzido (Reduced Motion)
 *
 * Consulta a API nativa do Reanimated e sincroniza com o AccessibilityInfo do SO
 * para garantir acessibilidade integral para usuários com sensibilidade vestibular.
 */
export function useReducedMotionPreference(): boolean {
  const reanimatedReducedMotion = useReducedMotion();
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setSystemReducedMotion(enabled);
        }
      })
      .catch(() => {
        // Fallback silencioso
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (mounted) {
          setSystemReducedMotion(enabled);
        }
      },
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return Boolean(reanimatedReducedMotion || systemReducedMotion);
}
