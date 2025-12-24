import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, Select, Spinner, Badge, EmptyState, Modal } from '@/components/ui';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { formatCurrency, formatDate, getTodayISO, getMonthName } from '@/lib/utils';
import { useUpdateDespesa } from '@/hooks/useMutations';
import type { DespesaCompleta, CategoriaDespesa } from '@/types/database';

export function Despesas() {
  const now = new Date();
  const queryClient = useQueryClient();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<DespesaCompleta | null>(null);
  const [form, setForm] = useState({
    categoria_id: '',
    descricao: '',
    valor: '',
    data_despesa: getTodayISO(),
    forma_pagamento: 'pix',
  });

  // Buscar categorias
  const { data: categorias } = useQuery({
    queryKey: ['categorias_despesa'],
    queryFn: async (): Promise<CategoriaDespesa[]> => {
      const { data, error } = await supabase
        .from('categorias_despesa')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) handleSupabaseError(error);
      return data as CategoriaDespesa[];
    },
  });

  // Buscar despesas do mês
  const { data: despesas, isLoading } = useQuery({
    queryKey: ['despesas', now.getFullYear(), now.getMonth() + 1],
    queryFn: async (): Promise<DespesaCompleta[]> => {
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('despesas')
        .select(`*, categoria:categorias_despesa(*)`)
        .gte('data_despesa', startDate)
        .lte('data_despesa', endDate)
        .order('data_despesa', { ascending: false });

      if (error) handleSupabaseError(error);
      return data as DespesaCompleta[];
    },
  });

  // Helpers
  const resetForm = () => {
    setForm({
      categoria_id: '',
      descricao: '',
      valor: '',
      data_despesa: getTodayISO(),
      forma_pagamento: 'pix',
    });
    setMostrarFormulario(false);
    setEditando(null);
  };

  // Mutation para criar despesa
  const { mutate: criarDespesa, isPending: criando } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('despesas')
        .insert({
          categoria_id: form.categoria_id,
          descricao: form.descricao,
          valor: parseFloat(form.valor),
          data_despesa: form.data_despesa,
          forma_pagamento: form.forma_pagamento,
          status: 'pago',
        });
      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm();
    },
  });

  // Mutation para excluir despesa
  const { mutate: excluirDespesa } = useMutation({
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

  // Mutation para atualizar despesa
  const { mutate: atualizarDespesa, isPending: atualizando } = useUpdateDespesa();

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoria_id || !form.descricao || !form.valor) return;

    if (editando) {
      atualizarDespesa({
        id: editando.id,
        categoria_id: form.categoria_id,
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        data_despesa: form.data_despesa,
        forma_pagamento: form.forma_pagamento,
      }, { onSuccess: resetForm });
    } else {
      criarDespesa();
    }
  };

  const handleEditar = (despesa: DespesaCompleta) => {
    setEditando(despesa);
    setForm({
      categoria_id: despesa.categoria_id,
      descricao: despesa.descricao,
      valor: String(despesa.valor),
      data_despesa: despesa.data_despesa,
      forma_pagamento: despesa.forma_pagamento || 'pix',
    });
  };

  const handleExcluir = (id: string, descricao: string) => {
    if (confirm(`Excluir despesa "${descricao}"?`)) {
      excluirDespesa(id);
    }
  };

  // Total do mês
  const totalMes = despesas?.reduce((sum, d) => sum + d.valor, 0) || 0;

  // Options
  const optionsCategorias = categorias?.map(c => ({
    value: c.id,
    label: `${c.nome} (${c.tipo})`,
  })) || [];

  const optionsFormaPagamento = [
    { value: 'pix', label: 'Pix' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cartao', label: 'Cartão' },
    { value: 'dinheiro', label: 'Dinheiro' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Despesas de {getMonthName(now.getMonth() + 1)}
          </h2>
          <p className="text-sm text-gray-500">
            Total: {formatCurrency(totalMes)}
          </p>
        </div>
        <Button onClick={() => setMostrarFormulario(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nova Despesa
        </Button>
      </div>

      {/* Lista de despesas */}
      {despesas && despesas.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {despesas.map((d) => (
                  <tr key={d.id} className="text-sm hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(d.data_despesa)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {d.descricao}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          d.categoria.tipo === 'fixa' ? 'info' :
                          d.categoria.tipo === 'variavel' ? 'warning' : 'default'
                        }
                      >
                        {d.categoria.nome}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">
                      -{formatCurrency(d.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditar(d)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(d.id, d.descricao)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="Nenhuma despesa registrada"
            description="Clique em 'Nova Despesa' para começar"
            action={
              <Button onClick={() => setMostrarFormulario(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Despesa
              </Button>
            }
          />
        </Card>
      )}

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={mostrarFormulario || !!editando}
        onClose={resetForm}
        title={editando ? 'Editar Despesa' : 'Nova Despesa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria"
              options={optionsCategorias}
              value={form.categoria_id}
              onChange={(v) => setForm(prev => ({ ...prev, categoria_id: v }))}
              placeholder="Selecione..."
            />

            <Input
              label="Data"
              type="date"
              value={form.data_despesa}
              onChange={(e) => setForm(prev => ({ ...prev, data_despesa: e.target.value }))}
            />
          </div>

          <Input
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Ex: Marketing Google, Material..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="0"
              value={form.valor}
              onChange={(e) => setForm(prev => ({ ...prev, valor: e.target.value }))}
            />

            <Select
              label="Forma de Pagamento"
              options={optionsFormaPagamento}
              value={form.forma_pagamento}
              onChange={(v) => setForm(prev => ({ ...prev, forma_pagamento: v }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criando || atualizando}>
              {criando || atualizando ? <Spinner size="sm" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
