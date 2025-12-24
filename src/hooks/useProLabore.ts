import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import type { ProLabore, ProLaboreForm } from '@/types/database';

// Buscar pro-labore por ano
export function useProLabore(ano: number) {
  return useQuery({
    queryKey: ['pro_labore', ano],
    queryFn: async (): Promise<ProLabore[]> => {
      const { data, error } = await supabase
        .from('pro_labore')
        .select('*')
        .gte('competencia', `${ano}-01`)
        .lte('competencia', `${ano}-12`)
        .order('competencia', { ascending: false });

      if (error) handleSupabaseError(error);
      return data as ProLabore[];
    },
  });
}

// Criar pro-labore
export function useCreateProLabore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProLaboreForm) => {
      const { error } = await supabase
        .from('pro_labore')
        .insert(data);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro_labore'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Atualizar pro-labore
export function useUpdateProLabore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: ProLaboreForm & { id: string }) => {
      const { error } = await supabase
        .from('pro_labore')
        .update(data)
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro_labore'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Excluir pro-labore
export function useDeleteProLabore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pro_labore')
        .delete()
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro_labore'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Total de pro-labore do ano
export function useProLaboreTotal(ano: number) {
  return useQuery({
    queryKey: ['pro_labore', 'total', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_labore')
        .select('valor')
        .gte('competencia', `${ano}-01`)
        .lte('competencia', `${ano}-12`);

      if (error) handleSupabaseError(error);

      const total = data?.reduce((sum, item) => sum + item.valor, 0) || 0;
      return { total, quantidade: data?.length || 0 };
    },
  });
}
