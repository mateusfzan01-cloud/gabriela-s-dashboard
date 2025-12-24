import { useParams } from 'react-router-dom';
import { usePaciente } from '@/hooks/usePacientes';
import { Card, Spinner, Badge, Button, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils/format';

export default function PatientDetails() {
    const { id } = useParams<{ id: string }>();
    // Safe check if id is undefined, though route should ensure it
    const { data: paciente, isLoading } = usePaciente(id || '');

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!paciente) {
        return (
            <EmptyState
                title="Paciente não encontrado"
                description="O registro solicitado não existe ou foi removido."
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Profile */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{paciente.nome}</h1>
                    <div className="mt-2 text-gray-500 space-x-4">
                        {paciente.telefone && <span>📞 {paciente.telefone}</span>}
                        {paciente.email && <span>📧 {paciente.email}</span>}
                    </div>
                </div>
                <Button variant="outline">Editar Perfil</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <p className="text-sm font-medium text-blue-600">Total Investido</p>
                    <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(paciente.total_gasto)}
                    </p>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <p className="text-sm font-medium text-purple-600">Total de Visitas</p>
                    <p className="text-2xl font-bold text-purple-900">
                        {paciente.total_atendimentos} check-ins
                    </p>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <p className="text-sm font-medium text-green-600">Última Visita</p>
                    <p className="text-2xl font-bold text-green-900">
                        {paciente.ultima_visita ? formatDate(paciente.ultima_visita) : '-'}
                    </p>
                </Card>
            </div>

            {/* History Timeline/List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Histórico Clínico</h2>

                {!paciente.atendimentos.length ? (
                    <EmptyState
                        title="Sem histórico"
                        description="Este paciente ainda não tem atendimentos registrados."
                    />
                ) : (
                    <div className="space-y-4">
                        {paciente.atendimentos.map((atendimento) => (
                            <Card key={atendimento.id} className="border-l-4 border-l-primary-500">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-gray-900">
                                                {formatDate(atendimento.data_atendimento)}
                                            </span>
                                            <Badge variant="info">{atendimento.tipo_procedimento.nome}</Badge>
                                        </div>
                                        <p className="text-gray-600">
                                            <span className="font-medium">Valor:</span> {formatCurrency(atendimento.valor)}
                                        </p>

                                        {atendimento.observacoes && (
                                            <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                                <span className="font-semibold block mb-1">Observações:</span>
                                                {atendimento.observacoes}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={
                                            atendimento.status === 'recebido' ? 'success' :
                                                atendimento.status === 'cancelado' ? 'danger' : 'warning'
                                        }>
                                            {atendimento.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
