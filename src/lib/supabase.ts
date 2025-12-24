import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente - configurar no .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase não configurado. Crie um arquivo .env.local com:\n' +
    'VITE_SUPABASE_URL=sua_url\n' +
    'VITE_SUPABASE_ANON_KEY=sua_chave'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para tratamento de erros
export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new SupabaseError(
      (error as { message: string }).message,
      (error as { code?: string }).code
    );
  }
  throw new SupabaseError('Erro desconhecido ao acessar o banco de dados');
}
