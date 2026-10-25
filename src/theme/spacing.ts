export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  // Escala baseada em múltiplos de 4 px (DESIGN.md — Seção 6)
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space6: 24,
  space8: 32,
  space12: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16, // Raio padrão para cards (16px)
  xl: 24, // Raio para Bottom Sheets e painéis (24px)
  xxl: 32, // Raio inferior do cabeçalho global (32px)
  full: 999, // Pílulas, barras de progresso e avatares (999px)
  // Aliases do DESIGN.md
  radiusSmall: 6,
  radiusMedium: 10,
  radiusLarge: 14,
  radiusXLarge: 20,
  radiusFull: 999,
} as const;

export const radius = borderRadius;

/**
 * Áreas de toque recomendadas (DESIGN.md Seção 6 e WCAG 2.5.5):
 * Altura mínima 44x44 px, priorizando 48x48 px nos botões e campos principais.
 */
export const MIN_TOUCH_TARGET = 44;
export const RECOMMENDED_TOUCH_TARGET = 48;
