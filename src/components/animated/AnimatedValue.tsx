import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { formatCurrency } from '../../utils/currency';
import { motion, useReducedMotionPreference } from '../../theme/motion';

export interface AnimatedValueProps {
  /** Valor numérico real a ser animado e formatado */
  value: number;
  /** Se o saldo deve ser ocultado para privacidade (ex: R$ ••••) */
  hidden?: boolean;
  /** Alias para hidden */
  hideValues?: boolean;
  /** Placeholder quando oculto */
  hiddenPlaceholder?: string;
  /** Função customizada de formatação monetária (padrão: formatCurrency) */
  formatter?: (val: number) => string;
  /** Duração em ms da transição (padrão: motion.duration.emphasis = 400ms) */
  duration?: number;
  /** Prefixo opcional (ex: '+' ou '-') */
  prefix?: string;
  /** Sufixo opcional */
  suffix?: string;
  /** Estilos de texto */
  style?: StyleProp<TextStyle>;
  /** Rótulo de acessibilidade */
  accessibilityLabel?: string;
}

/**
 * Componente reutilizável para contagem e transição suave de valores financeiros.
 *
 * Diretrizes:
 * - Duração de 300–500 ms com curva suave.
 * - Formatação determinística no padrão brasileiro (R$ 1.234,56), com suporte a centavos, zero e negativos.
 * - Interpolação eficiente sem sobrecarregar a thread do React.
 * - Respeita rigorosamente a preferência de Movimento Reduzido (exibindo o valor final instantaneamente).
 */
export const AnimatedValue: React.FC<AnimatedValueProps> = ({
  value,
  hidden = false,
  hideValues = false,
  hiddenPlaceholder = 'R$ ••••',
  formatter = formatCurrency,
  duration = motion.duration.emphasis,
  prefix = '',
  suffix = '',
  style,
  accessibilityLabel,
}) => {
  const isReducedMotion = useReducedMotionPreference();
  const effectiveHidden = hidden || hideValues;
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = value;

    // Se o valor não mudou ou o usuário optou por Movimento Reduzido ou privacidade ativa:
    if (startVal === endVal || isReducedMotion || effectiveHidden) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = Date.now();
    const diff = endVal - startVal;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Curva cúbica suave (ease-out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration, isReducedMotion, effectiveHidden]);

  if (effectiveHidden) {
    return (
      <Text
        style={style}
        accessibilityLabel={accessibilityLabel ?? 'Valor oculto'}
        accessibilityRole="text"
      >
        {hiddenPlaceholder}
      </Text>
    );
  }

  const formattedText = `${prefix}${formatter(displayValue)}${suffix}`;
  const finalAccessibleText = `${prefix}${formatter(value)}${suffix}`;

  return (
    <Text
      style={style}
      accessibilityLabel={accessibilityLabel ?? finalAccessibleText}
      accessibilityRole="text"
    >
      {formattedText}
    </Text>
  );
};

export default AnimatedValue;
