const MONTH_NAMES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export const WEEK_DAYS_SHORT_PT_BR = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
] as const;

export function isValidDate(value: unknown): value is Date {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }
  return false;
}

export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Extrai com segurança ano e mês de uma string de data, aceitando formatos
 * ISO ("2026-10-15", "2026-10-15T12:00:00Z", "2026-10-15 14:00") e BR ("15/10/2026").
 * Retorna { year, month, yearMonth } onde month varia de 1 a 12 e yearMonth é "YYYY-MM",
 * ou null caso a string seja inválida.
 */
export function extractYearMonth(
  dateStr?: string | null,
): { year: number; month: number; yearMonth: string } | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  // Remove espaços externos e sufixos de hora/timestamp ('T...' ou ' HH:MM...')
  const clean = dateStr.trim().split('T')[0].split(' ')[0];

  // Caso 1: Formato ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      return { year, month, yearMonth };
    }
  }

  // Caso 2: Formato BR DD/MM/YYYY
  const brMatch = clean.match(/^(?:\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const month = parseInt(brMatch[1], 10);
    const year = parseInt(brMatch[2], 10);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      return { year, month, yearMonth };
    }
  }

  // Fallback: tentar instanciar Date
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      return { year, month, yearMonth };
    }
  }

  return null;
}

/**
 * Retorna true somente se a data pertencer ao mês e ano da data de referência (padrão: data atual).
 */
export function isCurrentMonth(
  dateStr?: string | null,
  refDate: Date = new Date(),
): boolean {
  const ym = extractYearMonth(dateStr);
  if (!ym) {
    return false;
  }
  const curYear = refDate.getFullYear();
  const curMonth = refDate.getMonth() + 1;
  return ym.year === curYear && ym.month === curMonth;
}

export type PeriodFilterType = 'month' | 'semester' | 'year' | 'all';

/**
 * Filtra uma data conforme o período selecionado:
 *  - 'month': mês e ano correntes da data de referência
 *  - 'semester': semestre corrente do ano corrente (1-6 ou 7-12)
 *  - 'year': ano corrente da data de referência
 *  - 'all': qualquer data válida no histórico
 */
export function matchesPeriodFilter(
  dateStr?: string | null,
  filter: PeriodFilterType = 'month',
  refDate: Date = new Date(),
): boolean {
  const ym = extractYearMonth(dateStr);
  if (!ym) {
    return false;
  }

  if (filter === 'all') {
    return true;
  }

  const curYear = refDate.getFullYear();
  const curMonth = refDate.getMonth() + 1;

  if (filter === 'month') {
    return ym.year === curYear && ym.month === curMonth;
  }

  if (filter === 'semester') {
    if (ym.year !== curYear) {
      return false;
    }
    const isFirstSemester = curMonth <= 6;
    return isFirstSemester
      ? ym.month >= 1 && ym.month <= 6
      : ym.month >= 7 && ym.month <= 12;
  }

  if (filter === 'year') {
    return ym.year === curYear;
  }

  return true;
}

/**
 * Retorna a data atual no formato brasileiro DD/MM/AAAA (ex: "20/10/2026").
 */
export function getTodayBRDate(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Máscara DD/MM/AAAA em tempo real para campos de TextInput.
 * Limita a 8 dígitos e insere barras automaticamente:
 *  - "31"       -> "31"
 *  - "3112"     -> "31/12"
 *  - "31122026" -> "31/12/2026"
 */
export function formatDateInputMask(rawText: string): string {
  if (!rawText) {
    return '';
  }
  const digits = rawText.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Converte data ISO ("2026-12-31" ou ISO completo) para formato brasileiro DD/MM/AAAA ("31/12/2026").
 * Se já estiver no formato DD/MM/AAAA, retorna inalterado.
 */
export function isoToBRDate(isoOrDate?: string | null): string {
  if (!isoOrDate) {
    return '';
  }
  const trimmed = isoOrDate.trim();
  // Já é DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  // YYYY-MM-DD ou ISO com T (ex: 2026-12-31T12:00:00.000Z)
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  // Tenta via Date
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return trimmed;
}

/**
 * Converte data no formato brasileiro DD/MM/AAAA ("31/12/2026") para ISO ("2026-12-31").
 * Ideal para persistência e ordenação cronológica no banco SQLite.
 */
export function brDateToISO(brDate: string): string {
  if (!brDate) {
    return '';
  }
  const trimmed = brDate.trim();
  // Se já for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}

/**
 * Valida se uma string é uma data brasileira real e válida no formato DD/MM/AAAA.
 * Rejeita dias e meses fora da faixa e considera anos bissextos.
 */
export function isValidBRDate(brDate: string): boolean {
  if (!brDate || typeof brDate !== 'string') {
    return false;
  }
  const trimmed = brDate.trim();
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return false;
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }

  // Verifica dias máximos válidos no mês especificado
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Formata data no padrão curto DD/MM (ex: "12/06"), usado na lista da Dashboard.
 */
export function formatDateShort(value: Date | string | number): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}`;
    }
    const brMatch = trimmed.match(/^(\d{2})\/(\d{2})/);
    if (brMatch) {
      return `${brMatch[1]}/${brMatch[2]}`;
    }
  }
  const date = toDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Formata data no padrão completo DD/MM/AAAA (ex: "12/06/2026"), usado em Lançamentos.
 */
export function formatDateFull(value: Date | string | number): string {
  if (typeof value === 'string') {
    return isoToBRDate(value);
  }
  const date = toDate(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Retorna o nome do mês e ano por extenso (ex: "Junho de 2026").
 */
export function getMonthYearLabel(date: Date = new Date()): string {
  const validDate = isValidDate(date) ? date : new Date();
  const monthName = MONTH_NAMES_PT_BR[validDate.getMonth()];
  const year = validDate.getFullYear();
  return `${monthName} de ${year}`;
}

/**
 * Retorna apenas o nome do mês e ano sem preposição (ex: "Junho 2026"), usado no MiniCalendar.
 */
export function getMonthYearCompact(year: number, monthIndex: number): string {
  const safeMonth = ((monthIndex % 12) + 12) % 12;
  return `${MONTH_NAMES_PT_BR[safeMonth]} ${year}`;
}
