-- =====================================================
-- MIGRATION: Updates for CDC Gabriela
-- Execute no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR FORMAS DE PAGAMENTO
-- Trocar Unimed por Promed
-- =====================================================
UPDATE formas_pagamento
SET nome = 'Promed'
WHERE nome = 'Unimed';

-- =====================================================
-- 2. ATUALIZAR CATEGORIAS DE DESPESA
-- Remover: Aluguel, Software/Sistemas
-- Adicionar: Cartão Pessoal, Cartão Conjunto
-- =====================================================

-- Desativar categorias (soft delete para manter histórico)
UPDATE categorias_despesa
SET ativo = false
WHERE nome IN ('Aluguel', 'Software/Sistemas');

-- Adicionar novas categorias
INSERT INTO categorias_despesa (nome, tipo, ativo) VALUES
    ('Cartão Pessoal', 'pessoal', true),
    ('Cartão Conjunto', 'pessoal', true)
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- 3. CRIAR TABELA PRO-LABORE
-- =====================================================
CREATE TABLE IF NOT EXISTS pro_labore (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competencia VARCHAR(7) NOT NULL, -- Formato YYYY-MM (ex: '2024-01')
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    data_pagamento DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competencia)
);

-- Índice para busca por competência
CREATE INDEX IF NOT EXISTS idx_pro_labore_competencia ON pro_labore(competencia DESC);

-- Trigger para updated_at (usar função existente se já existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'tr_pro_labore_updated'
    ) THEN
        CREATE TRIGGER tr_pro_labore_updated
            BEFORE UPDATE ON pro_labore
            FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
    END IF;
END $$;

-- Comentários
COMMENT ON TABLE pro_labore IS 'Registro mensal de pró-labore (salário médico)';
COMMENT ON COLUMN pro_labore.competencia IS 'Mês/ano no formato YYYY-MM (ex: 2024-01)';
COMMENT ON COLUMN pro_labore.valor IS 'Valor do pró-labore em reais';
COMMENT ON COLUMN pro_labore.data_pagamento IS 'Data efetiva do pagamento (NULL se pendente)';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Execute estas queries para verificar as mudanças:

-- SELECT * FROM formas_pagamento ORDER BY nome;
-- SELECT * FROM categorias_despesa ORDER BY ativo DESC, nome;
-- SELECT * FROM pro_labore ORDER BY competencia DESC;
