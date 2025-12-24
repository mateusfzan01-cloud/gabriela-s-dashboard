-- =====================================================
-- MIGRATION: HABILITAR RLS
-- Execute este arquivo para adicionar segurança às tabelas existentes
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_procedimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar erro de duplicidade)
DROP POLICY IF EXISTS "Acesso total a pacientes" ON pacientes;
DROP POLICY IF EXISTS "Acesso total a tipos_procedimento" ON tipos_procedimento;
DROP POLICY IF EXISTS "Acesso total a formas_pagamento" ON formas_pagamento;
DROP POLICY IF EXISTS "Acesso total a atendimentos" ON atendimentos;
DROP POLICY IF EXISTS "Acesso total a categorias_despesa" ON categorias_despesa;
DROP POLICY IF EXISTS "Acesso total a despesas" ON despesas;

-- Criar novas políticas
CREATE POLICY "Acesso total a pacientes" ON pacientes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a tipos_procedimento" ON tipos_procedimento
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a formas_pagamento" ON formas_pagamento
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a atendimentos" ON atendimentos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a categorias_despesa" ON categorias_despesa
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total a despesas" ON despesas
    FOR ALL USING (auth.role() = 'authenticated');
