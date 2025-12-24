-- =====================================================
-- MIGRATION: AUTH & ADMIN SYSTEM
-- Execute este script para atualizar seu banco de dados existente
-- =====================================================

-- 1. Criar tabela de perfis (se não existir)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user', -- 'admin' ou 'user'
    nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Função e Trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'nome',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger anterior se existir para evitar duplicação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Habilitar RLS na nova tabela
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Função auxiliar de verificação de Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Políticas de Acesso (RLS)
-- Removemos as políticas antigas para recriar atualizadas

-- Policies para PROFILES
DROP POLICY IF EXISTS "Ver próprio perfil" ON profiles;
CREATE POLICY "Ver próprio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins total acesso a profiles" ON profiles;
CREATE POLICY "Admins total acesso a profiles" ON profiles
    FOR ALL USING (is_admin());

-- Policies para tabelas existentes (Garantir que apenas autenticados acessem)
-- Vamos recriar para garantir consistência

-- Pacientes
DROP POLICY IF EXISTS "Acesso total a pacientes" ON pacientes;
CREATE POLICY "Acesso total a pacientes" ON pacientes
    FOR ALL USING (auth.role() = 'authenticated');

-- Tipos Procedimento
DROP POLICY IF EXISTS "Acesso total a tipos_procedimento" ON tipos_procedimento;
CREATE POLICY "Acesso total a tipos_procedimento" ON tipos_procedimento
    FOR ALL USING (auth.role() = 'authenticated');

-- Formas Pagamento
DROP POLICY IF EXISTS "Acesso total a formas_pagamento" ON formas_pagamento;
CREATE POLICY "Acesso total a formas_pagamento" ON formas_pagamento
    FOR ALL USING (auth.role() = 'authenticated');

-- Atendimentos
DROP POLICY IF EXISTS "Acesso total a atendimentos" ON atendimentos;
CREATE POLICY "Acesso total a atendimentos" ON atendimentos
    FOR ALL USING (auth.role() = 'authenticated');

-- Categorias Despesa
DROP POLICY IF EXISTS "Acesso total a categorias_despesa" ON categorias_despesa;
CREATE POLICY "Acesso total a categorias_despesa" ON categorias_despesa
    FOR ALL USING (auth.role() = 'authenticated');

-- Despesas
DROP POLICY IF EXISTS "Acesso total a despesas" ON despesas;
CREATE POLICY "Acesso total a despesas" ON despesas
    FOR ALL USING (auth.role() = 'authenticated');

