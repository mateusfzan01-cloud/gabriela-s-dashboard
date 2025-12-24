import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Spinner } from '@/components/ui';

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast.success('Login realizado com sucesso!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao realizar login');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!name && isSignUp) {
            toast.error('Por favor, informe seu nome');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nome: name,
                    }
                }
            });

            if (error) throw error;

            toast.success('Cadastro realizado! Verifique seu email para confirmar.');
            setIsSignUp(false);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao realizar cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Medical Finance</h1>
                    <p className="text-gray-600 mt-2">Faça login para acessar o sistema</p>
                </div>

                <Card>
                    <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
                        {isSignUp && (
                            <Input
                                label="Nome Completo"
                                type="text"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        )}

                        <Input
                            label="Email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="sm" /> : (isSignUp ? 'Cadastrar' : 'Entrar')}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="text-sm text-primary-600 hover:text-primary-800"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
