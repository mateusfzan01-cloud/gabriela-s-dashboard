import { useState } from 'react';
import { Plus, Trash2, Edit, Settings } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, Select, Spinner, Badge, EmptyState, Modal } from '@/components/ui';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useCreateTipoProcedimento, useUpdateTipoProcedimento, useDeleteTipoProcedimento } from '@/hooks/useMutations';
import type { TipoProcedimento } from '@/types/database';

export function Configuracoes() {
  const queryClient = useQueryClient();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<TipoProcedimento | null>(null);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    categoria: 'consulta' as 'consulta' | 'exame',
    valor_padrao: '',
    descricao: '',
  });

  // Query para buscar todos os tipos de procedimento (incluindo inativos se selecionado)
  const { data: tiposProcedimento, isLoading } = useQuery({
    queryKey: ['tipos_procedimento', 'all', mostrarInativos],
    queryFn: async (): Promise<TipoProcedimento[]> => {
      let query = supabase
        .from('tipos_procedimento')
        .select('*')
        .order('categoria')
        .order('nome');

      if (!mostrarInativos) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error);
      return data as TipoProcedimento[];
    },
  });

  // Mutations
  const { mutate: criar, isPending: criando } = useCreateTipoProcedimento();
  const { mutate: atualizar, isPending: atualizando } = useUpdateTipoProcedimento();
  const { mutate: excluir } = useDeleteTipoProcedimento();

  // Options
  const optionsCategorias = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'exame', label: 'Exame' },
  ];

  // Handlers
  const resetForm = () => {
    setForm({
      nome: '',
      categoria: 'consulta',
      valor_padrao: '',
      descricao: '',
    });
    setMostrarFormulario(false);
    setEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return;

    const data = {
      nome: form.nome,
      categoria: form.categoria,
      valor_padrao: form.valor_padrao ? parseFloat(form.valor_padrao) : undefined,
      descricao: form.descricao || undefined,
      ativo: true,
    };

    if (editando) {
      atualizar({ id: editando.id, ...data }, {
        onSuccess: () => {
          resetForm();
          queryClient.invalidateQueries({ queryKey: ['tipos_procedimento'] });
        }
      });
    } else {
      criar(data, {
        onSuccess: () => {
          resetForm();
          queryClient.invalidateQueries({ queryKey: ['tipos_procedimento'] });
        }
      });
    }
  };

  const handleEditar = (item: TipoProcedimento) => {
    setEditando(item);
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      valor_padrao: item.valor_padrao?.toString() || '',
      descricao: item.descricao || '',
    });
  };

  const handleExcluir = (id: string, nome: string) => {
    if (confirm(`Desativar procedimento "${nome}"? Isso não afeta atendimentos já registrados.`)) {
      excluir(id);
    }
  };

  const handleReativar = async (id: string) => {
    const { error } = await supabase
      .from('tipos_procedimento')
      .update({ ativo: true })
      .eq('id', id);

    if (error) {
      handleSupabaseError(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['tipos_procedimento'] });
    }
  };

  // Agrupar por categoria
  const consultas = tiposProcedimento?.filter(t => t.categoria === 'consulta') || [];
  const exames = tiposProcedimento?.filter(t => t.categoria === 'exame') || [];

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Configurações</h2>
          <p className="text-sm text-gray-500">
            Gerencie os tipos de procedimento e valores padrão
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(e) => setMostrarInativos(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Mostrar inativos
          </label>
          <Button onClick={() => setMostrarFormulario(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Novo Procedimento
          </Button>
        </div>
      </div>

      {/* Consultas */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="info">Consultas</Badge>
          <span className="text-sm text-gray-500">{consultas.length} itens</span>
        </div>

        {consultas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium text-right">Valor Padrão</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {consultas.map((item) => (
                  <tr key={item.id} className={`text-sm ${!item.ativo ? 'opacity-50' : ''}`}>
                    <td className="py-3 font-medium text-gray-900">{item.nome}</td>
                    <td className="py-3 text-gray-500 text-xs">{item.descricao || '-'}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {item.valor_padrao ? formatCurrency(item.valor_padrao) : '-'}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={item.ativo ? 'success' : 'default'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditar(item)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {item.ativo ? (
                          <button
                            onClick={() => handleExcluir(item.id, item.nome)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativar(item.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma consulta cadastrada</p>
        )}
      </Card>

      {/* Exames */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="warning">Exames</Badge>
          <span className="text-sm text-gray-500">{exames.length} itens</span>
        </div>

        {exames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium text-right">Valor Padrão</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exames.map((item) => (
                  <tr key={item.id} className={`text-sm ${!item.ativo ? 'opacity-50' : ''}`}>
                    <td className="py-3 font-medium text-gray-900">{item.nome}</td>
                    <td className="py-3 text-gray-500 text-xs">{item.descricao || '-'}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {item.valor_padrao ? formatCurrency(item.valor_padrao) : '-'}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={item.ativo ? 'success' : 'default'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditar(item)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {item.ativo ? (
                          <button
                            onClick={() => handleExcluir(item.id, item.nome)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativar(item.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum exame cadastrado</p>
        )}
      </Card>

      {/* Empty State quando não há procedimentos */}
      {(!consultas.length && !exames.length) && (
        <Card>
          <EmptyState
            title="Nenhum procedimento cadastrado"
            description="Adicione procedimentos para usar no sistema"
            icon={<Settings className="w-12 h-12" />}
            action={
              <Button onClick={() => setMostrarFormulario(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Novo Procedimento
              </Button>
            }
          />
        </Card>
      )}

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={mostrarFormulario || !!editando}
        onClose={resetForm}
        title={editando ? 'Editar Procedimento' : 'Novo Procedimento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: Consulta, SIBO, Manometria..."
          />

          <Select
            label="Categoria"
            options={optionsCategorias}
            value={form.categoria}
            onChange={(v) => setForm((prev) => ({ ...prev, categoria: v as 'consulta' | 'exame' }))}
          />

          <Input
            label="Valor Padrão (R$)"
            type="number"
            step="0.01"
            min="0"
            value={form.valor_padrao}
            onChange={(e) => setForm((prev) => ({ ...prev, valor_padrao: e.target.value }))}
            placeholder="0,00 (opcional)"
          />

          <Input
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
            placeholder="Descrição opcional"
          />

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
