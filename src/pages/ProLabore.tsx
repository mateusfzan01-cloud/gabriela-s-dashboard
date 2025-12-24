import { useState } from 'react';
import { Plus, Trash2, Edit, DollarSign } from 'lucide-react';
import { Card, Button, Input, Select, Spinner, Badge, EmptyState, Modal } from '@/components/ui';
import { useProLabore, useCreateProLabore, useUpdateProLabore, useDeleteProLabore } from '@/hooks/useProLabore';
import { formatCurrency, getMonthName } from '@/lib/utils';
import type { ProLabore } from '@/types/database';

export function ProLabore() {
  const now = new Date();
  const [filtroAno, setFiltroAno] = useState(now.getFullYear());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<ProLabore | null>(null);

  const [form, setForm] = useState({
    competencia: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    valor: '',
    data_pagamento: '',
    observacoes: '',
  });

  // Queries e mutations
  const { data: proLabores, isLoading } = useProLabore(filtroAno);
  const { mutate: criar, isPending: criando } = useCreateProLabore();
  const { mutate: atualizar, isPending: atualizando } = useUpdateProLabore();
  const { mutate: excluir } = useDeleteProLabore();

  // Total do ano
  const totalAno = proLabores?.reduce((sum, p) => sum + p.valor, 0) || 0;

  // Options
  const optionsAnos = [
    { value: String(now.getFullYear() - 1), label: String(now.getFullYear() - 1) },
    { value: String(now.getFullYear()), label: String(now.getFullYear()) },
    { value: String(now.getFullYear() + 1), label: String(now.getFullYear() + 1) },
  ];

  const optionsMeses = Array.from({ length: 12 }, (_, i) => ({
    value: `${filtroAno}-${String(i + 1).padStart(2, '0')}`,
    label: `${getMonthName(i + 1)}/${filtroAno}`,
  }));

  // Handlers
  const resetForm = () => {
    setForm({
      competencia: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      valor: '',
      data_pagamento: '',
      observacoes: '',
    });
    setMostrarFormulario(false);
    setEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.competencia || !form.valor) return;

    const data = {
      competencia: form.competencia,
      valor: parseFloat(form.valor),
      data_pagamento: form.data_pagamento || undefined,
      observacoes: form.observacoes || undefined,
    };

    if (editando) {
      atualizar({ id: editando.id, ...data }, { onSuccess: resetForm });
    } else {
      criar(data, { onSuccess: resetForm });
    }
  };

  const handleEditar = (item: ProLabore) => {
    setEditando(item);
    setForm({
      competencia: item.competencia,
      valor: String(item.valor),
      data_pagamento: item.data_pagamento || '',
      observacoes: item.observacoes || '',
    });
  };

  const handleExcluir = (id: string, competencia: string) => {
    const mes = parseInt(competencia.split('-')[1]);
    if (confirm(`Excluir pró-labore de ${getMonthName(mes)}?`)) {
      excluir(id);
    }
  };

  // Formatar competência para exibição
  const formatCompetencia = (competencia: string) => {
    const [ano, mes] = competencia.split('-');
    return `${getMonthName(parseInt(mes))}/${ano}`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pró-labore</h2>
          <p className="text-sm text-gray-500">
            Total em {filtroAno}: {formatCurrency(totalAno)}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="w-28">
            <Select
              options={optionsAnos}
              value={String(filtroAno)}
              onChange={(v) => setFiltroAno(parseInt(v))}
            />
          </div>
          <Button onClick={() => setMostrarFormulario(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {/* Lista */}
      {proLabores && proLabores.length > 0 ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Competência</th>
                  <th className="px-4 py-3 font-medium">Data Pagamento</th>
                  <th className="px-4 py-3 font-medium">Observações</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proLabores.map((item) => (
                  <tr key={item.id} className="text-sm hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Badge variant="info">{formatCompetencia(item.competencia)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.data_pagamento
                        ? new Date(item.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')
                        : <span className="text-yellow-600">Pendente</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {item.observacoes || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditar(item)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(item.id, item.competencia)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t">
                  <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-700">
                    Total do Ano
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    {formatCurrency(totalAno)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="Nenhum pró-labore registrado"
            description={`Adicione o pró-labore de ${filtroAno}`}
            icon={<DollarSign className="w-12 h-12" />}
            action={
              <Button onClick={() => setMostrarFormulario(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Novo Pró-labore
              </Button>
            }
          />
        </Card>
      )}

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={mostrarFormulario || !!editando}
        onClose={resetForm}
        title={editando ? 'Editar Pró-labore' : 'Novo Pró-labore'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Competência (Mês/Ano)"
            options={optionsMeses}
            value={form.competencia}
            onChange={(v) => setForm((prev) => ({ ...prev, competencia: v }))}
          />

          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0"
            value={form.valor}
            onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
            placeholder="0,00"
          />

          <Input
            label="Data de Pagamento"
            type="date"
            value={form.data_pagamento}
            onChange={(e) => setForm((prev) => ({ ...prev, data_pagamento: e.target.value }))}
          />

          <Input
            label="Observações"
            value={form.observacoes}
            onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Opcional"
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
