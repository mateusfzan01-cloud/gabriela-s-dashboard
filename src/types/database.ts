// Tipos gerados a partir do schema do banco de dados

export interface Paciente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  data_nascimento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  nome?: string;
  created_at: string;
  updated_at: string;
}

export interface TipoProcedimento {
  id: string;
  nome: string;
  categoria: 'consulta' | 'exame';
  valor_padrao?: number;
  descricao?: string;
  ativo: boolean;
  created_at: string;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  tipo: 'imediato' | 'cartao' | 'convenio';
  dias_para_recebimento: number;
  ativo: boolean;
}

export type StatusAtendimento = 'pendente' | 'recebido' | 'cancelado';

export interface Atendimento {
  id: string;
  paciente_id: string;
  tipo_procedimento_id: string;
  forma_pagamento_id: string;
  data_atendimento: string;
  valor: number;
  status: StatusAtendimento;
  data_prevista_recebimento?: string;
  data_recebimento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Atendimento com relacionamentos expandidos
export interface AtendimentoCompleto extends Atendimento {
  paciente: Paciente;
  tipo_procedimento: TipoProcedimento;
  forma_pagamento: FormaPagamento;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  tipo: 'fixa' | 'variavel' | 'pessoal';
  ativo: boolean;
}

export type StatusDespesa = 'pendente' | 'pago' | 'cancelado';

export interface Despesa {
  id: string;
  categoria_id: string;
  descricao: string;
  valor: number;
  data_despesa: string;
  data_pagamento?: string;
  recorrente: boolean;
  status: StatusDespesa;
  forma_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface DespesaCompleta extends Despesa {
  categoria: CategoriaDespesa;
}

// Tipos para formulários
export interface NovoAtendimentoForm {
  paciente_id: string;
  paciente_nome?: string; // Para criar novo paciente
  tipo_procedimento_id: string;
  forma_pagamento_id: string;
  data_atendimento: string;
  valor: number;
  data_prevista_recebimento?: string;
  observacoes?: string;
}

export interface NovaDespesaForm {
  categoria_id: string;
  descricao: string;
  valor: number;
  data_despesa: string;
  forma_pagamento?: string;
  recorrente: boolean;
  observacoes?: string;
}

// Tipos para dashboard
export interface ResumoMensal {
  ano: number;
  mes: number;
  faturamento_total: number;
  total_imediato: number;
  total_cartao: number;
  total_convenio: number;
  total_atendimentos: number;
}

export interface RecebívelPendente {
  id: string;
  paciente: string;
  procedimento: string;
  forma_pagamento: string;
  valor: number;
  data_atendimento: string;
  data_prevista_recebimento: string;
  observacoes?: string;
}

export interface RankingProcedimento {
  procedimento: string;
  categoria: string;
  quantidade: number;
  faturamento_total: number;
  ticket_medio: number;
}

// Tipos para gráficos
export interface DadosGraficoMensal {
  mes: string;
  pix: number;
  cartao: number;
  convenio: number;
  total: number;
}

export interface DadosGraficoPizza {
  name: string;
  value: number;
  color: string;
}

// Pro-labore
export interface ProLabore {
  id: string;
  competencia: string; // Formato YYYY-MM
  valor: number;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProLaboreForm {
  competencia: string;
  valor: number;
  data_pagamento?: string;
  observacoes?: string;
}

// Tipos para edição
export interface UpdateDespesaForm {
  categoria_id?: string;
  descricao?: string;
  valor?: number;
  data_despesa?: string;
  forma_pagamento?: string;
  observacoes?: string;
}

export interface UpdateAtendimentoForm {
  valor?: number;
  data_atendimento?: string;
  data_prevista_recebimento?: string;
  observacoes?: string;
  status?: StatusAtendimento;
}

export interface TipoProcedimentoForm {
  nome: string;
  categoria: 'consulta' | 'exame';
  valor_padrao?: number;
  descricao?: string;
  ativo?: boolean;
}

export interface AtendimentosFilter {
  startDate?: string;
  endDate?: string;
  pacienteNome?: string;
  tipoProcedimentoId?: string;
  status?: StatusAtendimento | 'all';
}

export interface PacienteWithHistory extends Paciente {
  atendimentos: AtendimentoCompleto[];
  total_gasto: number;
  total_atendimentos: number;
  ultima_visita?: string;
}

