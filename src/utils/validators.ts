const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRequired(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(email: string): boolean {
  if (!isRequired(email)) {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password: string, minLength = 6): boolean {
  if (typeof password !== 'string') {
    return false;
  }
  return password.trim().length >= minLength;
}

export function isPositiveNumber(value: number | string): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/\./g, '').replace(',', '.').trim();
    const num = Number(cleaned);
    return Number.isFinite(num) && num > 0;
  }
  return false;
}

export function validateEmailField(email: string): string | undefined {
  if (!isRequired(email)) {
    return 'Informe o seu e-mail.';
  }
  if (!isValidEmail(email)) {
    return 'Informe um endereço de e-mail válido (ex: seu@email.com).';
  }
  return undefined;
}

export function validatePasswordField(password: string, minLength = 6): string | undefined {
  if (!isRequired(password)) {
    return 'Informe a sua senha.';
  }
  if (!isValidPassword(password, minLength)) {
    return `A senha deve ter pelo menos ${minLength} caracteres.`;
  }
  return undefined;
}

/**
 * Máscara para telefone brasileiro: (XX) XXXXX-XXXX (11 dígitos) ou (XX) XXXX-XXXX (10 dígitos).
 */
export function formatPhoneInputMask(rawText: string): string {
  if (!rawText) return '';
  const digits = rawText.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Validação de telefone brasileiro (10 ou 11 dígitos, DDD entre 11 e 99).
 */
export function isValidBRPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  if (digits.length === 11 && digits[2] !== '9') return false;
  return true;
}

