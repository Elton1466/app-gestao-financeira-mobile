import { Platform, TextStyle } from 'react-native';

/**
 * Tipografia Oficial nexo — Controle Financeiro Pessoal (DESIGN.md)
 * - Títulos: Montserrat nos pesos 600 (SemiBold) e 700 (Bold).
 * - Texto, formulários e navegação: Roboto nos pesos 400 (Regular) e 500 (Medium).
 * - Valores financeiros: tabular-nums obrigatório para alinhamento numérico perfeito.
 */
export const fontFamilies = {
  titleSemiBold: Platform.select({
    ios: 'Montserrat-SemiBold',
    android: 'Montserrat_600SemiBold',
    default: 'System',
  }),
  titleBold: Platform.select({
    ios: 'Montserrat-Bold',
    android: 'Montserrat_700Bold',
    default: 'System',
  }),
  bodyRegular: Platform.select({
    ios: 'Roboto-Regular',
    android: 'Roboto_400Regular',
    default: 'System',
  }),
  bodyMedium: Platform.select({
    ios: 'Roboto-Medium',
    android: 'Roboto_500Medium',
    default: 'System',
  }),
};

export const tabularNums: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};

export const headerTitleShadow: Pick<
  TextStyle,
  'textShadowColor' | 'textShadowOffset' | 'textShadowRadius'
> = {
  textShadowColor: 'rgba(0, 0, 0, 0.35)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

export const typography = {
  fontFamily: {
    regular: fontFamilies.bodyRegular,
    medium: fontFamilies.bodyMedium,
    semibold: fontFamilies.titleSemiBold,
    bold: fontFamilies.titleBold,
    titleSemiBold: fontFamilies.titleSemiBold,
    titleBold: fontFamilies.titleBold,
    bodyRegular: fontFamilies.bodyRegular,
    bodyMedium: fontFamilies.bodyMedium,
  },
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    amountLg: 28,
    display: 32,
  },
  // Escala Tipográfica Obrigatória (DESIGN.md Seção 5)
  scale: {
    pageTitle: { fontSize: 30, fontWeight: '700' as TextStyle['fontWeight'] }, // 28 a 32 px
    sectionTitle: { fontSize: 22, fontWeight: '600' as TextStyle['fontWeight'] }, // 20 a 24 px
    cardTitle: { fontSize: 15, fontWeight: '600' as TextStyle['fontWeight'] }, // 14 a 16 px
    body: { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'] }, // 16 px
    caption: { fontSize: 13, fontWeight: '400' as TextStyle['fontWeight'] }, // 13 a 14 px
    button: { fontSize: 15, fontWeight: '600' as TextStyle['fontWeight'] }, // 14 a 16 px
    display: { fontSize: 32, fontWeight: '700' as TextStyle['fontWeight'] },
    heading1: { fontSize: 28, fontWeight: '700' as TextStyle['fontWeight'] },
    heading2: { fontSize: 22, fontWeight: '600' as TextStyle['fontWeight'] },
    heading3: { fontSize: 18, fontWeight: '600' as TextStyle['fontWeight'] },
    bodySmall: { fontSize: 14, fontWeight: '400' as TextStyle['fontWeight'] },
  },
  fontWeight: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
  },
  lineHeight: {
    tight: 18,
    sm: 20,
    normal: 22,
    md: 24,
    relaxed: 26,
    title: 30,
    display: 38,
  },
  headerTitleShadow,
  tabularNums,
} as const;
