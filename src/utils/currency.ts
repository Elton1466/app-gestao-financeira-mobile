/**
 * Utilitário de Formatação Monetária (BRL - Real Brasileiro)
 * Regra Crítica (Heurística 2 - Correspondência entre o sistema e o mundo real):
 * NUNCA utilizar sufixos abreviados como "k" ou "M".
 * Sempre formatar explicitamente no padrão "R$ 1.230,00", adicionando
 * "+R$ " para receitas e "-R$ " para despesas quando showSign for verdadeiro.
 * Motor determinístico via Regex para total compatibilidade com o Hermes / React Native.
 */

/**
 * Formata um valor numérico em Real Brasileiro determinístico: R$ 1.000,00.
 * Garante separador de milhares com ponto (.) e centavos com vírgula (,).
 */
export function formatCurrency(
  value: number,
  showSign = false,
  type?: 'expense' | 'income',
): string {
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  const [intPart, decPart] = safeValue.toFixed(2).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = `R$ ${formattedInt},${decPart}`;

  if (showSign) {
    const resolvedType = type ?? (value < 0 ? 'expense' : 'income');
    const sign = resolvedType === 'expense' ? '-' : '+';
    return `${sign}${formatted}`;
  }

  if (value < 0 && !type) {
    return `-${formatted}`;
  }

  return formatted;
}

/**
 * Máscara monetária em tempo real para campos TextInput.
 * Extrai apenas dígitos, divide por 100 (centavos) e formata com ponto de milhar e vírgula decimal.
 * Exemplos:
 *  - "100000" -> "1.000,00"
 *  - "280000" -> "2.800,00"
 *  - "5000"   -> "50,00"
 */
export function formatCurrencyInput(rawText: string): string {
  if (!rawText) {
    return '';
  }
  const digits = rawText.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  const numericValue = parseInt(digits, 10) / 100;
  const [intPart, decPart] = numericValue.toFixed(2).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInt},${decPart}`;
}

/**
 * Converte um valor numérico (ex: 2800) para string de input formatada ("2.800,00").
 * Usado ao abrir formulários e modais em modo de Edição.
 */
export function numberToCurrencyInput(value: number): string {
  if (!Number.isFinite(value)) {
    return '0,00';
  }
  const safeValue = Math.abs(value);
  const [intPart, decPart] = safeValue.toFixed(2).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInt},${decPart}`;
}

/**
 * Converte a string mascarada ("2.800,00" ou "R$ 2.800,00") de volta para número (2800.00).
 * Seguro para salvar no banco de dados SQLite.
 */
export function parseCurrencyInput(maskedText: string | number): number {
  if (typeof maskedText === 'number') {
    return Number.isFinite(maskedText) ? maskedText : 0;
  }
  if (!maskedText || typeof maskedText !== 'string') {
    return 0;
  }
  const trimmed = maskedText.trim();
  if (!trimmed) {
    return 0;
  }
  // Se for string numérica inteira pura sem pontuação (ex: "2800")
  if (/^\d+$/.test(trimmed)) {
    const val = parseFloat(trimmed);
    return Number.isFinite(val) ? val : 0;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) / 100 : 0;
}

/**
 * Aliases de compatibilidade
 */
export const formatCentsInput = formatCurrencyInput;
export const parseCentsDigits = parseCurrencyInput;
