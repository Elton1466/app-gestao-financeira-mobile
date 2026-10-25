/**
 * Utilitário de Iniciais de Nome de Usuário
 * - Para nomes com 2 ou mais palavras: 1ª letra do 1º nome + 1ª letra do último sobrenome (ex: "ELTON ARAUJO" -> "EA")
 * - Para nomes com 1 palavra: 2 primeiras letras em maiúsculas (ex: "JOAO" -> "JO")
 * - Fallback para valores vazios ou nulos: "US"
 */
export function getUserInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return 'US';
  }

  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (!cleanName) {
    return 'US';
  }

  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  // Nome composto por apenas 1 palavra
  if (parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return parts[0].charAt(0).toUpperCase();
}
