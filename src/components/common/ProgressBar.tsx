import React from 'react';
import { AnimatedProgressBar, AnimatedProgressBarProps } from '../animated/AnimatedProgressBar';

export type ProgressBarProps = AnimatedProgressBarProps;

/**
 * ProgressBar com animação fluida Reanimated e suporte a Movimento Reduzido.
 * Mantém 100% de compatibilidade com a interface de ProgressBar.
 */
export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  return <AnimatedProgressBar {...props} />;
};

export default ProgressBar;
