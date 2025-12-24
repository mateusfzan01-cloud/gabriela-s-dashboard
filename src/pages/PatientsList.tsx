import { useState } from 'react';
import { usePacientes } from '@/hooks/usePacientes';
import { Link } from 'react-router-dom';
import { Input, Card, Spinner, EmptyState } from '@/components/ui';

export default function PatientsList() {
    const [search, setSearch] = useState('');
    const { data: patients, isLoading } = usePacientes(search);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
                    <p className="text-gray-500">Gerencie os dados dos seus pacientes</p>
                </div>
                {/* Placeholder for future specific "New Patient" standalone action if needed */}
            </div>

            <Card className="flex gap-4">
                <Input
                    placeholder="Buscar paciente por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
            </Card>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : !patients?.length ? (
                <EmptyState
                    title="Nenhum paciente encontrado"
                    description="Tente buscar por outro nome."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patients.map((patient) => (
                        <Link key={patient.id} to={`/pacientes/${patient.id}`} className="block">
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{patient.nome}</h3>
                                        {patient.email && (
                                            <p className="text-sm text-gray-500 mt-1">{patient.email}</p>
                                        )}
                                        {patient.telefone && (
                                            <p className="text-sm text-gray-500 mt-1">{patient.telefone}</p>
                                        )}
                                    </div>
                                    <div className="bg-primary-50 p-2 rounded-full text-primary-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
