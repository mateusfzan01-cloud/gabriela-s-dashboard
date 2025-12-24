import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Utilitário para classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatação de moeda brasileira
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formatação de data
export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

// Formatação de data por extenso
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Nome do mês
export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || '';
}

// Data atual no formato ISO (para inputs de data)
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Primeiro dia do mês atual
export function getFirstDayOfMonth(): string {
  const now = new Date();
  return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
}

// Último dia do mês atual
export function getLastDayOfMonth(): string {
  const now = new Date();
  return format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
}

// Calcular data prevista de recebimento baseado na forma de pagamento
export function calcularDataPrevistaRecebimento(
  dataAtendimento: string,
  diasParaRecebimento: number
): string {
  const date = parseISO(dataAtendimento);
  date.setDate(date.getDate() + diasParaRecebimento);
  return format(date, 'yyyy-MM-dd');
}

// Validação de CPF (opcional para futuro)
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

// Formatar telefone
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// Cores para gráficos
export const CHART_COLORS = {
  pix: '#22c55e',      // verde
  cartao: '#3b82f6',   // azul
  convenio: '#f59e0b', // amarelo/laranja
  dinheiro: '#10b981', // verde esmeralda
  total: '#6366f1',    // indigo
};

// Status badges
export const STATUS_CONFIG = {
  pendente: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800',
  },
  recebido: {
    label: 'Recebido',
    className: 'bg-green-100 text-green-800',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800',
  },
  pago: {
    label: 'Pago',
    className: 'bg-green-100 text-green-800',
  },
};
