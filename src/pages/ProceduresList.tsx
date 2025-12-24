import { useState } from 'react';
import { useAtendimentosFiltrados, useDeleteAtendimento } from '@/hooks/useAtendimentos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input, Button, Select, Card, Badge, Spinner, EmptyState } from '@/components/ui';
import { NovoAtendimentoModal } from '@/components/atendimentos/NovoAtendimentoModal';
import { formatCurrency, formatDate } from '@/utils/format';
import type { StatusAtendimento } from '@/types/database';

export default function ProceduresList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filters State
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        pacienteNome: '',
        tipoProcedimentoId: 'all',
        status: 'all' as StatusAtendimento | 'all',
    });

    // Fetch Data
    const { data: atendimentos, isLoading } = useAtendimentosFiltrados(filters);
    const { mutate: deleteAtendimento } = useDeleteAtendimento();

    // Fetch Procedure Types for filter
    const { data: tiposProcedimento } = useQuery({
        queryKey: ['tipos_procedimento'],
        queryFn: async () => {
            const { data } = await supabase.from('tipos_procedimento').select('*').order('nome');
            return data || [];
        },
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita.')) {
            deleteAtendimento(id);
        }
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            pacienteNome: '',
            tipoProcedimentoId: 'all',
            status: 'all',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Procedimentos e Consultas</h1>
                    <p className="text-gray-500">Gerencie todo o histórico de atendimentos</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    + Novo Procedimento
                </Button>
            </div>

            {/* Filters */}
            <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                    label="Paciente"
                    placeholder="Buscar por nome..."
                    value={filters.pacienteNome}
                    onChange={(e) => setFilters(prev => ({ ...prev, pacienteNome: e.target.value }))}
                />
                <Input
                    label="Data Início"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                    label="Data Fim"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
                <Select
                    label="Tipo"
                    options={[
                        { value: 'all', label: 'Todos' },
                        ...(tiposProcedimento?.map(t => ({ value: t.id, label: t.nome })) || [])
                    ]}
                    value={filters.tipoProcedimentoId}
                    onChange={(val) => setFilters(prev => ({ ...prev, tipoProcedimentoId: val }))}
                />
                <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                        Limpar Filtros
                    </Button>
                </div>
            </Card>

            {/* Table */}
            <Card padding="none" className="overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center flex justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : !atendimentos?.length ? (
                    <EmptyState
                        title="Nenhum procedimento encontrado"
                        description="Tente ajustar os filtros ou adicione um novo registro."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Paciente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Procedimento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {atendimentos.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(item.data_atendimento)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.paciente.nome}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.tipo_procedimento.nome}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(item.valor)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={
                                                item.status === 'recebido' ? 'success' :
                                                    item.status === 'cancelado' ? 'danger' : 'warning'
                                            }>
                                                {item.status === 'recebido' ? 'Recebido' :
                                                    item.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(item.id)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Edit/Create Modal */}
            <NovoAtendimentoModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editId={editingId} // Assuming the modal supports this prop now or will be updated
            />
        </div>
    );
}
