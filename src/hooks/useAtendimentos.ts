import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import type {
  Atendimento,
  AtendimentoCompleto,
  AtendimentosFilter,
  NovoAtendimentoForm,
  RecebívelPendente
} from '@/types/database';

// Buscar todos os atendimentos do mês
export function useAtendimentosMes(ano: number, mes: number) {
  return useQuery({
    queryKey: ['atendimentos', ano, mes],
    queryFn: async (): Promise<AtendimentoCompleto[]> => {
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          paciente:pacientes(*),
          tipo_procedimento:tipos_procedimento(*),
          forma_pagamento:formas_pagamento(*)
        `)
        .gte('data_atendimento', startDate)
        .lte('data_atendimento', endDate)
        .order('data_atendimento', { ascending: false });

      if (error) handleSupabaseError(error);
      return data as AtendimentoCompleto[];
    },
  });
}

// Buscar atendimentos com filtros
export function useAtendimentosFiltrados(filters: AtendimentosFilter) {
  return useQuery({
    queryKey: ['atendimentos', filters],
    queryFn: async (): Promise<AtendimentoCompleto[]> => {
      let query = supabase
        .from('atendimentos')
        .select(`
          *,
          paciente:pacientes!inner(*),
          tipo_procedimento:tipos_procedimento(*),
          forma_pagamento:formas_pagamento(*)
        `);

      if (filters.startDate) {
        query = query.gte('data_atendimento', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('data_atendimento', filters.endDate);
      }

      if (filters.tipoProcedimentoId && filters.tipoProcedimentoId !== 'all') {
        query = query.eq('tipo_procedimento_id', filters.tipoProcedimentoId);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.pacienteNome) {
        // Busca textual no nome do paciente (requer join com !inner)
        query = query.ilike('paciente.nome', `%${filters.pacienteNome}%`);
      }

      const { data, error } = await query.order('data_atendimento', { ascending: false });

      if (error) handleSupabaseError(error);
      return data as AtendimentoCompleto[];
    },
  });
}

// Buscar recebíveis pendentes
export function useRecebiveisPendentes(ano?: number, mes?: number) {
  return useQuery({
    queryKey: ['recebiveis', ano, mes],
    queryFn: async (): Promise<RecebívelPendente[]> => {
      let query = supabase
        .from('vw_recebiveis_pendentes')
        .select('*');

      if (ano && mes) {
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;
        query = query
          .gte('data_prevista_recebimento', startDate)
          .lte('data_prevista_recebimento', endDate);
      }

      const { data, error } = await query.order('data_prevista_recebimento');

      if (error) handleSupabaseError(error);
      return data as RecebívelPendente[];
    },
  });
}

// Criar novo atendimento
export function useNovoAtendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: NovoAtendimentoForm): Promise<Atendimento> => {
      let pacienteId = form.paciente_id;

      // Se não tem paciente_id, criar novo paciente
      if (!pacienteId && form.paciente_nome) {
        const { data: novoPaciente, error: errPaciente } = await supabase
          .from('pacientes')
          .insert({ nome: form.paciente_nome })
          .select()
          .single();

        if (errPaciente) handleSupabaseError(errPaciente);
        pacienteId = novoPaciente.id;
      }

      const { data, error } = await supabase
        .from('atendimentos')
        .insert({
          paciente_id: pacienteId,
          tipo_procedimento_id: form.tipo_procedimento_id,
          forma_pagamento_id: form.forma_pagamento_id,
          data_atendimento: form.data_atendimento,
          valor: form.valor,
          data_prevista_recebimento: form.data_prevista_recebimento,
          observacoes: form.observacoes,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Atendimento salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar atendimento: ' + error.message);
    },
  });
}

// Confirmar recebimento
export function useConfirmarRecebimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dataRecebimento }: { id: string; dataRecebimento?: string }) => {
      const { error } = await supabase
        .from('atendimentos')
        .update({
          status: 'recebido',
          data_recebimento: dataRecebimento || new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Recebimento confirmado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao confirmar recebimento: ' + error.message);
    },
  });
}

// Deletar atendimento (Delete físico)
export function useDeleteAtendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('atendimentos')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Atendimento excluído permanentemente.');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });
}
