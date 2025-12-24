-- =====================================================
-- SCHEMA DO BANCO DE DADOS - CDC GABRIELA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: pacientes
-- Cadastro de pacientes
-- =====================================================
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    data_nascimento DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por nome
CREATE INDEX idx_pacientes_nome ON pacientes(nome);

-- =====================================================
-- TABELA: tipos_procedimento
-- Catálogo de procedimentos disponíveis
-- =====================================================
CREATE TABLE tipos_procedimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL, -- 'consulta' ou 'exame'
    valor_padrao DECIMAL(10,2),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir procedimentos baseados no Excel analisado
INSERT INTO tipos_procedimento (nome, categoria, valor_padrao) VALUES
    ('Consulta', 'consulta', 400.00),
    ('Retorno', 'consulta', 0.00),
    ('SIBO', 'exame', 380.00),
    ('Manometria Anorretal', 'exame', 700.00),
    ('Manometria Esofágica', 'exame', 750.00),
    ('Manometria Alta', 'exame', 750.00),
    ('Phmetria', 'exame', 330.00),
    ('Phmetria Esofágica', 'exame', 330.00),
    ('Impedanciometria', 'exame', 1250.00),
    ('Teste de Lactose', 'exame', 380.00);

-- =====================================================
-- TABELA: formas_pagamento
-- Formas de pagamento disponíveis
-- =====================================================
CREATE TABLE formas_pagamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL, -- 'imediato', 'cartao', 'convenio'
    dias_para_recebimento INTEGER DEFAULT 0, -- dias até cair na conta
    ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO formas_pagamento (nome, tipo, dias_para_recebimento) VALUES
    ('Pix', 'imediato', 0),
    ('Dinheiro', 'imediato', 0),
    ('Crédito', 'cartao', 30),
    ('Débito', 'cartao', 1),
    ('Unimed', 'convenio', 60),
    ('Outros Convênios', 'convenio', 60),
    ('Ético', 'convenio', 0); -- Cortesia/sem cobrança

-- =====================================================
-- TABELA: atendimentos
-- Registro de cada consulta ou procedimento realizado
-- =====================================================
CREATE TABLE atendimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    tipo_procedimento_id UUID NOT NULL REFERENCES tipos_procedimento(id),
    forma_pagamento_id UUID NOT NULL REFERENCES formas_pagamento(id),
    
    -- Dados do atendimento
    data_atendimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    
    -- Controle de recebimento
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'recebido', 'cancelado'
    data_prevista_recebimento DATE, -- para convênios/cartões
    data_recebimento DATE, -- quando efetivamente recebeu
    
    -- Observações (ex: "pg 04/11", "10/24 ok")
    observacoes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries frequentes
CREATE INDEX idx_atendimentos_data ON atendimentos(data_atendimento);
CREATE INDEX idx_atendimentos_status ON atendimentos(status);
CREATE INDEX idx_atendimentos_data_prevista ON atendimentos(data_prevista_recebimento);
CREATE INDEX idx_atendimentos_paciente ON atendimentos(paciente_id);

-- =====================================================
-- TABELA: categorias_despesa
-- Categorização de despesas
-- =====================================================
CREATE TABLE categorias_despesa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL, -- 'fixa', 'variavel', 'pessoal'
    ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO categorias_despesa (nome, tipo) VALUES
    ('Aluguel', 'fixa'),
    ('Software/Sistemas', 'fixa'),
    ('Marketing', 'fixa'),
    ('Material Médico', 'variavel'),
    ('Fornecedores', 'variavel'),
    ('Clube/Academia', 'pessoal'),
    ('Estética', 'pessoal'),
    ('Outros', 'variavel');

-- =====================================================
-- TABELA: despesas
-- Registro de despesas
-- =====================================================
CREATE TABLE despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    categoria_id UUID NOT NULL REFERENCES categorias_despesa(id),
    
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_despesa DATE NOT NULL,
    data_pagamento DATE, -- quando foi pago
    
    -- Para despesas recorrentes
    recorrente BOOLEAN DEFAULT FALSE,
    
    -- Controle
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
    forma_pagamento VARCHAR(50), -- 'pix', 'boleto', 'cartao', etc.
    
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_despesas_data ON despesas(data_despesa);
CREATE INDEX idx_despesas_categoria ON despesas(categoria_id);

-- =====================================================
-- TABELA: resumo_mensal
-- Cache de resumos mensais para performance
-- =====================================================
CREATE TABLE resumo_mensal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- Receitas
    total_consultas DECIMAL(10,2) DEFAULT 0,
    total_procedimentos DECIMAL(10,2) DEFAULT 0,
    total_pix_dinheiro DECIMAL(10,2) DEFAULT 0,
    total_cartao DECIMAL(10,2) DEFAULT 0,
    total_convenio DECIMAL(10,2) DEFAULT 0,
    
    -- Despesas
    total_despesas_fixas DECIMAL(10,2) DEFAULT 0,
    total_despesas_variaveis DECIMAL(10,2) DEFAULT 0,
    
    -- Calculados
    faturamento_bruto DECIMAL(10,2) DEFAULT 0,
    lucro_liquido DECIMAL(10,2) DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(ano, mes)
);

-- =====================================================
-- VIEWS: Consultas úteis pré-definidas
-- =====================================================

-- View: Recebíveis pendentes
CREATE OR REPLACE VIEW vw_recebiveis_pendentes WITH (security_invoker = true) AS
SELECT 
    a.id,
    p.nome AS paciente,
    tp.nome AS procedimento,
    fp.nome AS forma_pagamento,
    a.valor,
    a.data_atendimento,
    a.data_prevista_recebimento,
    a.observacoes
FROM atendimentos a
JOIN pacientes p ON p.id = a.paciente_id
JOIN tipos_procedimento tp ON tp.id = a.tipo_procedimento_id
JOIN formas_pagamento fp ON fp.id = a.forma_pagamento_id
WHERE a.status = 'pendente'
  AND fp.tipo IN ('cartao', 'convenio')
ORDER BY a.data_prevista_recebimento;

-- View: Faturamento por mês
CREATE OR REPLACE VIEW vw_faturamento_mensal WITH (security_invoker = true) AS
SELECT 
    EXTRACT(YEAR FROM data_atendimento) AS ano,
    EXTRACT(MONTH FROM data_atendimento) AS mes,
    SUM(valor) AS faturamento_total,
    SUM(CASE WHEN fp.tipo = 'imediato' THEN valor ELSE 0 END) AS total_imediato,
    SUM(CASE WHEN fp.tipo = 'cartao' THEN valor ELSE 0 END) AS total_cartao,
    SUM(CASE WHEN fp.tipo = 'convenio' THEN valor ELSE 0 END) AS total_convenio,
    COUNT(*) AS total_atendimentos
FROM atendimentos a
JOIN formas_pagamento fp ON fp.id = a.forma_pagamento_id
WHERE a.status != 'cancelado'
GROUP BY EXTRACT(YEAR FROM data_atendimento), EXTRACT(MONTH FROM data_atendimento)
ORDER BY ano DESC, mes DESC;

-- View: Ranking de procedimentos
CREATE OR REPLACE VIEW vw_ranking_procedimentos WITH (security_invoker = true) AS
SELECT 
    tp.nome AS procedimento,
    tp.categoria,
    COUNT(*) AS quantidade,
    SUM(a.valor) AS faturamento_total,
    AVG(a.valor) AS ticket_medio
FROM atendimentos a
JOIN tipos_procedimento tp ON tp.id = a.tipo_procedimento_id
WHERE a.status != 'cancelado'
GROUP BY tp.nome, tp.categoria
ORDER BY faturamento_total DESC;

-- =====================================================
-- FUNCTIONS: Funções auxiliares
-- =====================================================

-- Função para calcular recebíveis do mês
CREATE OR REPLACE FUNCTION fn_recebiveis_mes(p_ano INTEGER, p_mes INTEGER)
RETURNS TABLE (
    forma_pagamento VARCHAR,
    total_previsto DECIMAL,
    quantidade INTEGER
) 
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.nome::VARCHAR,
        SUM(a.valor)::DECIMAL,
        COUNT(*)::INTEGER
    FROM atendimentos a
    JOIN formas_pagamento fp ON fp.id = a.forma_pagamento_id
    WHERE a.status = 'pendente'
      AND EXTRACT(YEAR FROM a.data_prevista_recebimento) = p_ano
      AND EXTRACT(MONTH FROM a.data_prevista_recebimento) = p_mes
    GROUP BY fp.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para dar baixa em recebível
CREATE OR REPLACE FUNCTION fn_confirmar_recebimento(p_atendimento_id UUID, p_data_recebimento DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN 
SET search_path = public
AS $$
BEGIN
    UPDATE atendimentos
    SET status = 'recebido',
        data_recebimento = p_data_recebimento,
        updated_at = NOW()
    WHERE id = p_atendimento_id
      AND status = 'pendente';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Automações
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_pacientes_updated
    BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_atendimentos_updated
    BEFORE UPDATE ON atendimentos
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_despesas_updated
    BEFORE UPDATE ON despesas
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- Trigger para definir status como 'recebido' se pagamento imediato
CREATE OR REPLACE FUNCTION fn_set_status_imediato()
RETURNS TRIGGER 
SET search_path = public
AS $$
DECLARE
    v_tipo_pagamento VARCHAR;
BEGIN
    SELECT tipo INTO v_tipo_pagamento
    FROM formas_pagamento
    WHERE id = NEW.forma_pagamento_id;
    
    IF v_tipo_pagamento = 'imediato' THEN
        NEW.status = 'recebido';
        NEW.data_recebimento = NEW.data_atendimento;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_atendimentos_status
    BEFORE INSERT ON atendimentos
    FOR EACH ROW EXECUTE FUNCTION fn_set_status_imediato();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- =====================================================
-- TABELA: profiles
-- Perfil estendido do usuário (vinculado ao auth.users)
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user', -- 'admin' ou 'user'
    nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para criar profile automaticamente ao criar usuário no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = public
AS $$
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_procedimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumo_mensal ENABLE ROW LEVEL SECURITY;

-- Helper function para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de acesso

-- PROFILES
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Ver próprio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins podem ver todos os perfis e editar
CREATE POLICY "Admins total acesso a profiles" ON profiles
    FOR ALL USING (is_admin());

-- PACIENTES, PROCEDIMENTOS, PAGAMENTOS (Leitura pública/autenticada, Escrita restrita)
-- Para facilitar o dev local, vamos permitir leitura para authenticated e escrita para admin ou authenticated
-- Mas o requisito original era resolver o problema do 'anon'.
-- Como vamos implementar Login, vamos restringir a authenticated.

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

CREATE POLICY "Acesso total a resumo_mensal" ON resumo_mensal
    FOR ALL USING (auth.role() = 'authenticated');

-- OBSERVAÇÃO IMPORTANTE:
-- Se quiser permitir que usuários NÃO logados criem atendimentos (cenário anterior),
-- você teria que mudar auth.role() = 'authenticated' para true ou auth.role() IN ('anon', 'authenticated').
-- Mas como vamos implementar Login, mantivemos 'authenticated'.

-- =====================================================
-- DADOS DE EXEMPLO (opcional, para testes)
-- =====================================================

-- Inserir alguns pacientes de exemplo
INSERT INTO pacientes (nome, telefone) VALUES
    ('Maria Silva', '41999999999'),
    ('João Santos', '41988888888'),
    ('Ana Oliveira', '41977777777');

-- Comentário: Após rodar este script, o banco está pronto!
-- Próximo passo: Configurar o cliente Supabase no React
