import React, { useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { motion, useReducedMotionPreference } from '../../theme/motion';

export interface AnimatedEntranceProps {
  children: React.ReactNode;
  /** Atraso antes do início da animação em ms (escalonamento/stagger) */
  delay?: number;
  /** Duração da transição em ms (250 a 400 ms, padrão: motion.duration.entrance = 300ms) */
  duration?: number;
  /** Deslocamento vertical inicial em pixels (8 a 12 px, padrão: motion.distance.entrance = 10px) */
  distance?: number;
  /** Estilos do container */
  style?: StyleProp<ViewStyle>;
}

/**
 * Container de entrada animada suave com FadeIn + leve translação vertical (8–12 px).
 *
 * Características:
 * - Executa apenas na montagem inicial (não reanima a cada atualização de dados).
 * - Suporte a escalonamento com delays progressivos entre grupos de componentes.
 * - Conteúdo 100% utilizável imediatamente.
 * - Desativação instantânea com Movimento Reduzido (Reduced Motion).
 */
export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  delay = 0,
  duration = motion.duration.entrance,
  distance = motion.distance.entrance,
  style,
}) => {
  const isReducedMotion = useReducedMotionPreference();
  const hasAnimatedRef = useRef<boolean>(false);

  // Inicializa com 1 e 0 se for Movimento Reduzido; caso contrário, 0 e distance
  const opacity = useSharedValue(isReducedMotion ? 1 : 0);
  const translateY = useSharedValue(isReducedMotion ? 0 : distance);

  useEffect(() => {
    if (isReducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      opacity.value = withDelay(
        delay,
        withTiming(1, {
          duration,
          easing: motion.easing.decelerate,
        }),
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, {
          duration,
          easing: motion.easing.decelerate,
        }),
      );
    }
  }, [delay, duration, distance, isReducedMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedEntrance;
