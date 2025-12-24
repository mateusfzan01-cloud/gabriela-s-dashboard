-- Security Fixes
-- Run this script in standard SQL editor to apply fixes

-- 1. Fix Security Definer Views (add security_invoker = true)
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

-- 2. Enable RLS on resumo_mensal
ALTER TABLE resumo_mensal ENABLE ROW LEVEL SECURITY;

-- 3. Add Policy for resumo_mensal (Drop first to be safe if re-running)
DROP POLICY IF EXISTS "Acesso total a resumo_mensal" ON resumo_mensal;

CREATE POLICY "Acesso total a resumo_mensal" ON resumo_mensal
    FOR ALL USING (auth.role() = 'authenticated');
