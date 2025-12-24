import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import type {
  UpdateDespesaForm,
  UpdateAtendimentoForm,
  TipoProcedimentoForm
} from '@/types/database';

// ========================================
// DESPESAS
// ========================================

export function useUpdateDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateDespesaForm & { id: string }) => {
      const { error } = await supabase
        .from('despesas')
        .update(data)
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ========================================
// ATENDIMENTOS
// ========================================

export function useUpdateAtendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAtendimentoForm & { id: string }) => {
      const { error } = await supabase
        .from('atendimentos')
        .update(data)
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['recebiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

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
    },
  });
}

// ========================================
// TIPOS DE PROCEDIMENTO
// ========================================

export function useCreateTipoProcedimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TipoProcedimentoForm) => {
      const { error } = await supabase
        .from('tipos_procedimento')
        .insert(data);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_procedimento'] });
    },
  });
}

export function useUpdateTipoProcedimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: TipoProcedimentoForm & { id: string }) => {
      const { error } = await supabase
        .from('tipos_procedimento')
        .update(data)
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_procedimento'] });
    },
  });
}

export function useDeleteTipoProcedimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativar
      const { error } = await supabase
        .from('tipos_procedimento')
        .update({ ativo: false })
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos_procedimento'] });
    },
  });
}
