import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import type { Paciente, PacienteWithHistory } from '@/types/database';

// Buscar todos os pacientes
export function usePacientes(search?: string) {
    return useQuery({
        queryKey: ['pacientes', search],
        queryFn: async (): Promise<Paciente[]> => {
            let query = supabase
                .from('pacientes')
                .select('*')
                .order('nome');

            if (search) {
                query = query.ilike('nome', `%${search}%`);
            }

            const { data, error } = await query;

            if (error) handleSupabaseError(error);
            return data as Paciente[];
        },
    });
}

// Buscar paciente específico com histórico
export function usePaciente(id: string) {
    return useQuery({
        queryKey: ['paciente', id],
        queryFn: async (): Promise<PacienteWithHistory> => {
            // 1. Buscar dados do paciente
            const { data: paciente, error: errPaciente } = await supabase
                .from('pacientes')
                .select('*')
                .eq('id', id)
                .single();

            if (errPaciente) handleSupabaseError(errPaciente);

            // 2. Buscar histórico de atendimentos
            const { data: atendimentos, error: errAtendimentos } = await supabase
                .from('atendimentos')
                .select(`
          *,
          tipo_procedimento:tipos_procedimento(*),
          forma_pagamento:formas_pagamento(*)
        `)
                .eq('paciente_id', id)
                .order('data_atendimento', { ascending: false });

            if (errAtendimentos) handleSupabaseError(errAtendimentos);

            // 3. Calcular totais
            const total_gasto = atendimentos?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
            const total_atendimentos = atendimentos?.length || 0;
            const ultima_visita = atendimentos?.[0]?.data_atendimento;

            return {
                ...paciente,
                atendimentos: atendimentos || [],
                total_gasto,
                total_atendimentos,
                ultima_visita
            } as PacienteWithHistory;
        },
        enabled: !!id,
    });
}

// Criar/Editar paciente (se necessário separadamente do modal de atendimento)
export function useSavePaciente() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (paciente: Partial<Paciente>) => {
            const { data, error } = await supabase
                .from('pacientes')
                .upsert(paciente)
                .select()
                .single();

            if (error) handleSupabaseError(error);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pacientes'] });
            queryClient.invalidateQueries({ queryKey: ['paciente'] }); // Invalida detalhes se estiver editando
            toast.success('Paciente salvo com sucesso!');
        },
        onError: (error: Error) => {
            toast.error('Erro ao salvar paciente: ' + error.message);
        },
    });
}
