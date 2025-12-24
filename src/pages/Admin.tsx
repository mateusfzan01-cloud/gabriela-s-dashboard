import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { toast } from 'sonner';
import { Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, ShieldAlert, User as UserIcon } from 'lucide-react';

export function Admin() {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar usuários: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (profileId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';

        // Evitar que o próprio usuário tire seu admin
        if (profileId === currentUser?.id && newRole === 'user') {
            const confirm = window.confirm('Tem certeza? Você perderá acesso a esta página imediatamente.');
            if (!confirm) return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profileId);

            if (error) throw error;

            toast.success(`Permissão alterada para ${newRole}`);
            fetchProfiles();
        } catch (error: any) {
            toast.error('Erro ao atualizar permissão: ' + error.message);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchProfiles}>
                        Atualizar
                    </Button>
                </div>
            </div>

            <Card>
                <div className="mb-6">
                    <Input
                        label=""
                        placeholder="Buscar usuário por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 border-b">
                                <tr>
                                    <th className="py-3 px-4">Usuário</th>
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Função</th>
                                    <th className="py-3 px-4">Data Cadastro</th>
                                    <th className="py-3 px-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredProfiles.map((profile) => (
                                    <tr key={profile.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium flex items-center gap-2">
                                            <div className="bg-gray-100 p-2 rounded-full">
                                                <UserIcon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            {profile.nome || 'Sem nome'}
                                            {profile.id === currentUser?.id && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Você</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{profile.email}</td>
                                        <td className="py-3 px-4">
                                            {profile.role === 'admin' ? (
                                                <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded-full w-fit">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full w-fit">
                                                    Usuário
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRole(profile.id, profile.role)}
                                                className={profile.role === 'admin' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'}
                                            >
                                                {profile.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredProfiles.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Nenhum usuário encontrado.
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    Informações Importantes
                </h3>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>Usuários com perfil <strong>Admin</strong> têm acesso total a todas as funções e dados.</li>
                    <li>Usuários com perfil <strong>Usuário</strong> podem visualizar e criar registros, mas não podem gerenciar outros usuários.</li>
                    <li>Para adicionar um novo usuário, peça para ele se cadastrar na tela de login. Ele entrará como "Usuário" e você poderá promovê-lo aqui.</li>
                </ul>
            </div>
        </div>
    );
}
