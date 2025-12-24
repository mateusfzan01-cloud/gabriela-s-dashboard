import { useState, useMemo } from 'react';
import { Check, Calendar, Filter, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Spinner, EmptyState, Select, Modal, Input } from '@/components/ui';
import { useRecebiveisPendentes, useConfirmarRecebimento } from '@/hooks/useAtendimentos';
import { useUpdateAtendimento, useDeleteAtendimento } from '@/hooks/useMutations';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import type { RecebívelPendente } from '@/types/database';

export function Recebiveis() {
  const now = new Date();
  const [filtroAno, setFiltroAno] = useState(now.getFullYear());
  const [filtroMes, setFiltroMes] = useState(now.getMonth() + 1);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [editando, setEditando] = useState<RecebívelPendente | null>(null);
  const [formEdit, setFormEdit] = useState({
    valor: '',
    data_prevista_recebimento: '',
    observacoes: '',
  });

  // Buscar recebíveis
  const { data: recebiveis, isLoading } = useRecebiveisPendentes(
    mostrarTodos ? undefined : filtroAno,
    mostrarTodos ? undefined : filtroMes
  );

  // Mutations
  const { mutate: confirmarRecebimento, isPending: confirmando } = useConfirmarRecebimento();
  const { mutate: atualizarAtendimento, isPending: atualizando } = useUpdateAtendimento();
  const { mutate: excluirAtendimento } = useDeleteAtendimento();

  // Agrupar por forma de pagamento
  const agrupado = useMemo(() => {
    if (!recebiveis) return {};

    return recebiveis.reduce((acc, item) => {
      const key = item.forma_pagamento;
      if (!acc[key]) acc[key] = { items: [], total: 0 };
      acc[key].items.push(item);
      acc[key].total += item.valor;
      return acc;
    }, {} as Record<string, { items: typeof recebiveis; total: number }>);
  }, [recebiveis]);

  // Total geral
  const totalGeral = useMemo(() => {
    return recebiveis?.reduce((sum, item) => sum + item.valor, 0) || 0;
  }, [recebiveis]);

  // Options para filtros
  const optionsMeses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const optionsAnos = [
    { value: String(now.getFullYear() - 1), label: String(now.getFullYear() - 1) },
    { value: String(now.getFullYear()), label: String(now.getFullYear()) },
    { value: String(now.getFullYear() + 1), label: String(now.getFullYear() + 1) },
  ];

  // Handlers
  const handleConfirmar = (id: string) => {
    if (confirm('Confirmar recebimento deste valor?')) {
      confirmarRecebimento({ id });
    }
  };

  const handleEditar = (item: RecebívelPendente) => {
    setEditando(item);
    setFormEdit({
      valor: String(item.valor),
      data_prevista_recebimento: item.data_prevista_recebimento,
      observacoes: item.observacoes || '',
    });
  };

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando || !formEdit.valor) return;

    atualizarAtendimento({
      id: editando.id,
      valor: parseFloat(formEdit.valor),
      data_prevista_recebimento: formEdit.data_prevista_recebimento,
      observacoes: formEdit.observacoes || undefined,
    }, {
      onSuccess: () => {
        setEditando(null);
        setFormEdit({ valor: '', data_prevista_recebimento: '', observacoes: '' });
      }
    });
  };

  const handleExcluir = (id: string, paciente: string) => {
    if (confirm(`Excluir recebível de "${paciente}"? Esta ação não pode ser desfeita.`)) {
      excluirAtendimento(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtrar por:</span>
          </div>

          <div className="flex flex-wrap gap-3 flex-1">
            <div className="w-32">
              <Select
                options={optionsMeses}
                value={String(filtroMes)}
                onChange={(v) => {
                  setFiltroMes(parseInt(v));
                  setMostrarTodos(false);
                }}
                disabled={mostrarTodos}
              />
            </div>

            <div className="w-28">
              <Select
                options={optionsAnos}
                value={String(filtroAno)}
                onChange={(v) => {
                  setFiltroAno(parseInt(v));
                  setMostrarTodos(false);
                }}
                disabled={mostrarTodos}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarTodos}
                onChange={(e) => setMostrarTodos(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Mostrar todos</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Resumo */}
      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            {mostrarTodos
              ? 'Todos os recebíveis pendentes'
              : `Previsão para ${getMonthName(filtroMes)}/${filtroAno}`}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-yellow-600">Total esperado</p>
          <p className="text-2xl font-bold text-yellow-800">{formatCurrency(totalGeral)}</p>
        </div>
      </div>

      {/* Lista de recebíveis */}
      {recebiveis && recebiveis.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(agrupado).map(([formaPagamento, { items, total }]) => (
            <Card key={formaPagamento}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="info">{formaPagamento}</Badge>
                  <span className="text-sm text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2 font-medium">Paciente</th>
                      <th className="pb-2 font-medium">Procedimento</th>
                      <th className="pb-2 font-medium">Atendimento</th>
                      <th className="pb-2 font-medium">Previsão</th>
                      <th className="pb-2 font-medium text-right">Valor</th>
                      <th className="pb-2 font-medium text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-3 font-medium text-gray-900">{item.paciente}</td>
                        <td className="py-3 text-gray-600">{item.procedimento}</td>
                        <td className="py-3 text-gray-600">{formatDate(item.data_atendimento)}</td>
                        <td className="py-3">
                          <span className="text-yellow-700 font-medium">
                            {formatDate(item.data_prevista_recebimento)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(item.valor)}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleEditar(item)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExcluir(item.id, item.paciente)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmar(item.id)}
                              disabled={confirmando}
                              className="whitespace-nowrap ml-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Recebido
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botão para confirmar todos do grupo */}
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Confirmar recebimento de todos os ${items.length} itens de ${formaPagamento}?`)) {
                      items.forEach(item => confirmarRecebimento({ id: item.id }));
                    }
                  }}
                  disabled={confirmando}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Confirmar todos ({items.length})
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Nenhum recebível pendente"
            description={mostrarTodos
              ? "Todos os pagamentos foram confirmados!"
              : `Não há recebíveis previstos para ${getMonthName(filtroMes)}/${filtroAno}`}
            icon={<Check className="w-12 h-12" />}
          />
        </Card>
      )}

      {/* Modal de Edição */}
      <Modal
        isOpen={!!editando}
        onClose={() => {
          setEditando(null);
          setFormEdit({ valor: '', data_prevista_recebimento: '', observacoes: '' });
        }}
        title="Editar Recebível"
      >
        <form onSubmit={handleSalvarEdicao} className="space-y-4">
          <div className="text-sm text-gray-500 mb-4">
            <p><strong>Paciente:</strong> {editando?.paciente}</p>
            <p><strong>Procedimento:</strong> {editando?.procedimento}</p>
          </div>

          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0"
            value={formEdit.valor}
            onChange={(e) => setFormEdit(prev => ({ ...prev, valor: e.target.value }))}
          />

          <Input
            label="Data Prevista de Recebimento"
            type="date"
            value={formEdit.data_prevista_recebimento}
            onChange={(e) => setFormEdit(prev => ({ ...prev, data_prevista_recebimento: e.target.value }))}
          />

          <Input
            label="Observações"
            value={formEdit.observacoes}
            onChange={(e) => setFormEdit(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Opcional"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditando(null);
                setFormEdit({ valor: '', data_prevista_recebimento: '', observacoes: '' });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizando}>
              {atualizando ? <Spinner size="sm" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
