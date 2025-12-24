import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Verificar sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkAdmin(session?.user);
            setLoading(false);
        });

        // Escutar mudanças na sessão
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkAdmin(session?.user);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function checkAdmin(user: User | null | undefined) {
        if (!user) {
            setIsAdmin(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || !data) {
                setIsAdmin(false);
            } else {
                setIsAdmin(data.role === 'admin');
            }
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            setIsAdmin(false);
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
