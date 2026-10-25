export const lightPalette = {
  // Paleta Oficial nexo — Modo Claro (DESIGN.md)
  primary: '#081F4D', // Azul-marinho profundo oficial — Navegação, cabeçalhos, títulos principais
  primaryMedium: '#0B57A4', // Azul médio vibrante
  accent: '#009FE3', // Azul-ciano vibrante oficial — Ações primárias, links, abas ativas, FAB (+)
  highlight: '#FDB913', // color-highlight — Destaques pontuais, metas, selos
  background: '#F4F7FA', // color-background — Fundo geral de todas as telas
  surface: '#FFFFFF', // color-surface — Cartões, formulários, modais e áreas de conteúdo
  text: '#081F4D', // color-text — Texto principal e valores neutros
  textMuted: '#64748B', // color-text-muted — Texto secundário e metadados
  border: '#E2E8F0', // color-border — Bordas, divisores e contornos
  success: '#16803C', // color-success — Receitas, confirmações e estados positivos
  successLight: '#E8F5EE', // Superfície suave positiva
  warning: '#A15C00', // color-warning — Alertas e atenção necessária (>= 80% do orçamento)
  warningLight: '#FEF6E7', // Superfície suave de aviso
  danger: '#B42318', // color-danger — Despesas, erros e estouro (> 100% do orçamento)
  dangerLight: '#FDECEB', // Superfície suave de perigo/despesa

  // Cabeçalho Global e Identidade Visual Nexo
  headerBg: '#081F4D', // Azul-marinho oficial
  headerAccent: '#009FE3', // Azul-ciano vibrante
  brandTurquoise: '#009FE3',
  brandTurquoiseLight: '#E0F4FC',
  brandTurquoiseSoft: '#EBF7FD',

  // Superfícies e Fundos Auxiliares
  backgroundAlt: '#EBF0F5',
  surfaceSubtle: '#F8FAFC',
  borderLight: '#EDF2F7',
  divider: '#E2E8F0',

  // Tipografia (Alto Contraste WCAG 2.2 AA)
  textPrimary: '#081F4D', // Contraste alto sobre #FFFFFF
  textSecondary: '#64748B', // Contraste adequado sobre #FFFFFF
  textPlaceholder: '#64748B',
  textInverse: '#FFFFFF',

  // Semânticas Financeiras e Feedback
  income: '#16803C', // Verde positivo
  incomeBg: '#E8F5EE',
  expense: '#B42318', // Vermelho despesa / alerta
  expenseDark: '#912018',
  expenseText: '#B42318',
  expenseBg: '#FDECEB',
  warningDark: '#7E4800',
  warningBg: '#FEF6E7',

  // Ações Primárias e Destaques
  primaryBlue: '#009FE3', // Azul-ciano institucional para ações principais
  primaryBlueDark: '#081F4D',
  primaryBlueBg: '#E0F4FC',
  pinkHighlight: '#009FE3',
  pinkHighlightBg: '#E0F4FC',

  // Aliases semânticos
  primaryDark: '#04102A',
  primaryLight: '#E0F4FC',
  accentLight: '#E0F4FC',
  secondary: '#0B57A4',
  secondaryLight: '#E6EFF7',
  highlightLight: '#FEF8E7',

  // Backdrop translúcido de modais
  overlay: 'rgba(8, 31, 77, 0.55)',
};

export const darkPalette: typeof lightPalette = {
  // Paleta Oficial nexo — Modo Escuro (Noturno)
  primary: '#38BDF8', // Destaque celeste de alto contraste para leitura sobre superfícies escuras
  primaryMedium: '#0B57A4',
  accent: '#009FE3', // Azul-ciano vibrante oficial mantido em botões e abas ativas
  highlight: '#FDB913',
  background: '#0F172A', // Fundo geral Slate 900
  surface: '#1E293B', // Superfície de cartões Slate 800
  text: '#F8FAFC', // Texto principal Slate 50
  textMuted: '#94A3B8', // Texto secundário Slate 400
  border: '#334155', // Bordas Slate 700
  success: '#22C55E', // Verde vibrante
  successLight: 'rgba(34, 197, 94, 0.18)',
  warning: '#F59E0B', // Amarelo-âmbar vibrante
  warningLight: 'rgba(245, 158, 11, 0.18)',
  danger: '#EF4444', // Vermelho vibrante
  dangerLight: 'rgba(239, 68, 68, 0.18)',

  // Cabeçalho Global e Identidade Visual Nexo
  headerBg: '#0B132B', // Azul escuro profundo institucional
  headerAccent: '#009FE3',
  brandTurquoise: '#009FE3',
  brandTurquoiseLight: '#1E3A5F',
  brandTurquoiseSoft: '#132238',

  // Superfícies e Fundos Auxiliares
  backgroundAlt: '#162238',
  surfaceSubtle: '#243248',
  borderLight: '#334155',
  divider: '#334155',

  // Tipografia (Alto Contraste WCAG 2.2 AA)
  textPrimary: '#F8FAFC', // Slate 50 de altíssimo contraste (>= 12.6:1)
  textSecondary: '#CBD5E1', // Slate 300 de alto contraste (>= 8.5:1)
  textPlaceholder: '#94A3B8', // Slate 400 (>= 4.5:1)
  textInverse: '#FFFFFF', // Branco puro

  // Semânticas Financeiras e Feedback
  income: '#22C55E',
  incomeBg: 'rgba(34, 197, 94, 0.18)',
  expense: '#EF4444',
  expenseDark: '#F87171',
  expenseText: '#EF4444',
  expenseBg: 'rgba(239, 68, 68, 0.18)',
  warningDark: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.18)',

  // Ações Primárias e Destaques
  primaryBlue: '#009FE3',
  primaryBlueDark: '#38BDF8',
  primaryBlueBg: 'rgba(0, 159, 227, 0.18)',
  pinkHighlight: '#009FE3',
  pinkHighlightBg: 'rgba(0, 159, 227, 0.18)',

  // Aliases semânticos
  primaryDark: '#04102A',
  primaryLight: 'rgba(0, 159, 227, 0.22)',
  accentLight: 'rgba(0, 159, 227, 0.22)',
  secondary: '#38BDF8',
  secondaryLight: '#1E3A5F',
  highlightLight: '#3D3110',

  // Backdrop translúcido de modais
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export type ColorPalette = typeof lightPalette;
export type ColorToken = keyof ColorPalette;

/**
 * Objeto global de cores reativo sincronizado com o ThemeContext.
 */
export const colors: ColorPalette = { ...lightPalette };
