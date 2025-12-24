import { useQuery } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import type {
  Paciente,
  TipoProcedimento,
  FormaPagamento,
  ResumoMensal,
  RankingProcedimento
} from '@/types/database';

// Buscar todos os pacientes (para autocomplete)
export function usePacientes(busca?: string) {
  return useQuery({
    queryKey: ['pacientes', busca],
    queryFn: async (): Promise<Paciente[]> => {
      let query = supabase
        .from('pacientes')
        .select('*')
        .order('nome');

      if (busca) {
        query = query.ilike('nome', `%${busca}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) handleSupabaseError(error);
      return data as Paciente[];
    },
  });
}

// Buscar tipos de procedimento
export function useTiposProcedimento() {
  return useQuery({
    queryKey: ['tipos_procedimento'],
    queryFn: async (): Promise<TipoProcedimento[]> => {
      const { data, error } = await supabase
        .from('tipos_procedimento')
        .select('*')
        .eq('ativo', true)
        .order('categoria')
        .order('nome');

      if (error) handleSupabaseError(error);
      return data as TipoProcedimento[];
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
  });
}

// Buscar formas de pagamento
export function useFormasPagamento() {
  return useQuery({
    queryKey: ['formas_pagamento'],
    queryFn: async (): Promise<FormaPagamento[]> => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) handleSupabaseError(error);
      return data as FormaPagamento[];
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
  });
}

// Dashboard - Faturamento do mês atual
export function useFaturamentoMes(ano: number, mes: number) {
  return useQuery({
    queryKey: ['dashboard', 'faturamento', ano, mes],
    queryFn: async () => {
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          valor,
          status,
          forma_pagamento:formas_pagamento(tipo)
        `)
        .gte('data_atendimento', startDate)
        .lte('data_atendimento', endDate)
        .neq('status', 'cancelado');

      if (error) handleSupabaseError(error);

      const resultado = {
        faturamento_total: 0,
        total_imediato: 0,
        total_cartao: 0,
        total_convenio: 0,
        total_recebido: 0,
        total_pendente: 0,
        quantidade: data?.length || 0,
      };

      // Cast data to any to avoid complex typing of dynamic Supabase query results
      (data as any[])?.forEach((item) => {
        resultado.faturamento_total += item.valor;

        // Supabase sometimes returns arrays for joins even if single, or TS infers it so.
        // Handling both object and array cases for safety.
        const formaPagamento = Array.isArray(item.forma_pagamento)
          ? item.forma_pagamento[0]
          : item.forma_pagamento;

        const tipo = formaPagamento?.tipo;

        if (tipo === 'imediato') resultado.total_imediato += item.valor;
        else if (tipo === 'cartao') resultado.total_cartao += item.valor;
        else if (tipo === 'convenio') resultado.total_convenio += item.valor;

        if (item.status === 'recebido') resultado.total_recebido += item.valor;
        else if (item.status === 'pendente') resultado.total_pendente += item.valor;
      });

      return resultado;
    },
  });
}

// Dashboard - Total de despesas do mês
export function useDespesasMes(ano: number, mes: number) {
  return useQuery({
    queryKey: ['dashboard', 'despesas', ano, mes],
    queryFn: async () => {
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('despesas')
        .select(`
          valor,
          status,
          categoria:categorias_despesa(tipo)
        `)
        .gte('data_despesa', startDate)
        .lte('data_despesa', endDate)
        .neq('status', 'cancelado');

      if (error) handleSupabaseError(error);

      const resultado = {
        total: 0,
        fixas: 0,
        variaveis: 0,
        pessoais: 0,
      };

      (data as any[])?.forEach((item) => {
        resultado.total += item.valor;

        const categoria = Array.isArray(item.categoria) ? item.categoria[0] : item.categoria;
        const tipo = categoria?.tipo;

        if (tipo === 'fixa') resultado.fixas += item.valor;
        else if (tipo === 'variavel') resultado.variaveis += item.valor;
        else if (tipo === 'pessoal') resultado.pessoais += item.valor;
      });

      return resultado;
    },
  });
}

// Dashboard - Faturamento mensal (últimos 12 meses)
export function useFaturamentoAnual() {
  return useQuery({
    queryKey: ['dashboard', 'faturamento_anual'],
    queryFn: async (): Promise<ResumoMensal[]> => {
      const { data, error } = await supabase
        .from('vw_faturamento_mensal')
        .select('*')
        .limit(12);

      if (error) handleSupabaseError(error);
      return data as ResumoMensal[];
    },
  });
}

// Relatórios - Ranking de procedimentos
export function useRankingProcedimentos(ano?: number, mes?: number) {
  return useQuery({
    queryKey: ['relatorios', 'ranking', ano, mes],
    queryFn: async (): Promise<RankingProcedimento[]> => {
      // Se tiver filtro de data, precisa fazer query manual
      if (ano && mes) {
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;

        const { data, error } = await supabase
          .from('atendimentos')
          .select(`
            valor,
            tipo_procedimento:tipos_procedimento(nome, categoria)
          `)
          .gte('data_atendimento', startDate)
          .lte('data_atendimento', endDate)
          .neq('status', 'cancelado');

        if (error) handleSupabaseError(error);

        // Agrupar manualmente
        const grouped = new Map<string, RankingProcedimento>();

        (data as any[])?.forEach((item) => {
          const tipoProc = Array.isArray(item.tipo_procedimento) ? item.tipo_procedimento[0] : item.tipo_procedimento;
          const nome = tipoProc?.nome;

          if (!nome) return;

          const existing = grouped.get(nome);

          if (existing) {
            existing.quantidade += 1;
            existing.faturamento_total += item.valor;
            existing.ticket_medio = existing.faturamento_total / existing.quantidade;
          } else {
            grouped.set(nome, {
              procedimento: nome,
              categoria: tipoProc.categoria,
              quantidade: 1,
              faturamento_total: item.valor,
              ticket_medio: item.valor,
            });
          }
        });

        return Array.from(grouped.values())
          .sort((a, b) => b.faturamento_total - a.faturamento_total);
      }

      // Sem filtro, usar a view
      const { data, error } = await supabase
        .from('vw_ranking_procedimentos')
        .select('*');

      if (error) handleSupabaseError(error);
      return data as RankingProcedimento[];
    },
  });
}

// Total de recebíveis pendentes
export function useTotalRecebiveis() {
  return useQuery({
    queryKey: ['dashboard', 'total_recebiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('valor')
        .eq('status', 'pendente');

      if (error) handleSupabaseError(error);

      const total = data?.reduce((sum, item) => sum + item.valor, 0) || 0;
      const quantidade = data?.length || 0;

      return { total, quantidade };
    },
  });
}
