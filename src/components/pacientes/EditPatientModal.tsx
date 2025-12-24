import { useState, useEffect } from 'react';
import { Modal, Button, Input, Spinner } from '@/components/ui';
import { useSavePaciente } from '@/hooks/usePacientes';
import type { Paciente } from '@/types/database';

interface EditPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    paciente: Paciente;
}

export function EditPatientModal({ isOpen, onClose, paciente }: EditPatientModalProps) {
    const [form, setForm] = useState<Partial<Paciente>>({});
    const { mutate: salvarPaciente, isPending: salvando } = useSavePaciente();

    useEffect(() => {
        if (isOpen && paciente) {
            setForm({
                id: paciente.id,
                nome: paciente.nome,
                email: paciente.email || '',
                telefone: paciente.telefone || '',
                data_nascimento: paciente.data_nascimento || '',
                observacoes: paciente.observacoes || '',
            });
        }
    }, [isOpen, paciente]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        salvarPaciente(form, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Perfil do Paciente"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome Completo"
                    value={form.nome || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="E-mail"
                        type="email"
                        value={form.email || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                        label="Telefone"
                        value={form.telefone || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                    />
                </div>

                <Input
                    label="Data de Nascimento"
                    type="date"
                    value={form.data_nascimento || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, data_nascimento: e.target.value }))}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                    </label>
                    <textarea
                        value={form.observacoes || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={salvando || !form.nome}
                    >
                        {salvando ? <Spinner size="sm" /> : 'Salvar Alterações'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
