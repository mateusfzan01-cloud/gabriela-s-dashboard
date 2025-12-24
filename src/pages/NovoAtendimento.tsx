import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Search } from 'lucide-react';
import { Card, Button, Input, Select, Spinner } from '@/components/ui';
import { useTiposProcedimento, useFormasPagamento, usePacientes } from '@/hooks/useDashboard';
import { useNovoAtendimento } from '@/hooks/useAtendimentos';
import { formatCurrency, getTodayISO, calcularDataPrevistaRecebimento } from '@/lib/utils';
import type { NovoAtendimentoForm } from '@/types/database';

export function NovoAtendimento() {
  const navigate = useNavigate();
  
  // Dados de referência
  const { data: tiposProcedimento, isLoading: loadingTipos } = useTiposProcedimento();
  const { data: formasPagamento, isLoading: loadingFormas } = useFormasPagamento();
  
  // Busca de pacientes
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<{ id: string; nome: string } | null>(null);
  const [mostrarNovoPaciente, setMostrarNovoPaciente] = useState(false);
  const { data: pacientes } = usePacientes(buscaPaciente);
  
  // Formulário
  const [form, setForm] = useState<Partial<NovoAtendimentoForm>>({
    data_atendimento: getTodayISO(),
    valor: 0,
  });
  
  // Mutation
  const { mutate: salvarAtendimento, isPending: salvando } = useNovoAtendimento();
  
  // Procedimento selecionado (para pegar o valor padrão)
  const procedimentoSelecionado = useMemo(() => {
    return tiposProcedimento?.find(p => p.id === form.tipo_procedimento_id);
  }, [tiposProcedimento, form.tipo_procedimento_id]);
  
  // Forma de pagamento selecionada (para verificar se precisa de data prevista)
  const formaPagamentoSelecionada = useMemo(() => {
    return formasPagamento?.find(f => f.id === form.forma_pagamento_id);
  }, [formasPagamento, form.forma_pagamento_id]);
  
  // Atualizar valor quando selecionar procedimento
  useEffect(() => {
    if (procedimentoSelecionado?.valor_padrao) {
      setForm(prev => ({ ...prev, valor: procedimentoSelecionado.valor_padrao }));
    }
  }, [procedimentoSelecionado]);
  
  // Calcular data prevista de recebimento
  useEffect(() => {
    if (formaPagamentoSelecionada && form.data_atendimento) {
      if (formaPagamentoSelecionada.tipo !== 'imediato' && formaPagamentoSelecionada.dias_para_recebimento > 0) {
        const dataPrevista = calcularDataPrevistaRecebimento(
          form.data_atendimento,
          formaPagamentoSelecionada.dias_para_recebimento
        );
        setForm(prev => ({ ...prev, data_prevista_recebimento: dataPrevista }));
      } else {
        setForm(prev => ({ ...prev, data_prevista_recebimento: undefined }));
      }
    }
  }, [formaPagamentoSelecionada, form.data_atendimento]);
  
  // Options para selects
  const optionsProcedimentos = useMemo(() => {
    if (!tiposProcedimento) return [];
    return tiposProcedimento.map(p => ({
      value: p.id,
      label: `${p.nome} ${p.valor_padrao ? `(${formatCurrency(p.valor_padrao)})` : ''}`,
    }));
  }, [tiposProcedimento]);
  
  const optionsFormasPagamento = useMemo(() => {
    if (!formasPagamento) return [];
    return formasPagamento.map(f => ({
      value: f.id,
      label: f.nome,
    }));
  }, [formasPagamento]);
  
  // Validação
  const isFormValid = useMemo(() => {
    const temPaciente = pacienteSelecionado?.id || (mostrarNovoPaciente && buscaPaciente.trim());
    return temPaciente && form.tipo_procedimento_id && form.forma_pagamento_id && form.valor && form.data_atendimento;
  }, [pacienteSelecionado, mostrarNovoPaciente, buscaPaciente, form]);
  
  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    const dados: NovoAtendimentoForm = {
      paciente_id: pacienteSelecionado?.id || '',
      paciente_nome: mostrarNovoPaciente ? buscaPaciente.trim() : undefined,
      tipo_procedimento_id: form.tipo_procedimento_id!,
      forma_pagamento_id: form.forma_pagamento_id!,
      data_atendimento: form.data_atendimento!,
      valor: form.valor!,
      data_prevista_recebimento: form.data_prevista_recebimento,
      observacoes: form.observacoes,
    };
    
    salvarAtendimento(dados, {
      onSuccess: () => {
        navigate('/');
      },
    });
  };
  
  // Selecionar paciente existente
  const selecionarPaciente = (paciente: { id: string; nome: string }) => {
    setPacienteSelecionado(paciente);
    setBuscaPaciente(paciente.nome);
    setMostrarNovoPaciente(false);
  };
  
  // Limpar seleção de paciente
  const limparPaciente = () => {
    setPacienteSelecionado(null);
    setBuscaPaciente('');
    setMostrarNovoPaciente(false);
  };
  
  if (loadingTipos || loadingFormas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paciente
            </label>
            
            {pacienteSelecionado ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
                <span className="flex-1 font-medium text-green-800">
                  {pacienteSelecionado.nome}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limparPaciente}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaPaciente}
                    onChange={(e) => {
                      setBuscaPaciente(e.target.value);
                      setMostrarNovoPaciente(false);
                    }}
                    placeholder="Digite o nome do paciente..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                {/* Lista de pacientes encontrados */}
                {buscaPaciente && !mostrarNovoPaciente && pacientes && pacientes.length > 0 && (
                  <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                    {pacientes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selecionarPaciente(p)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        {p.nome}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Opção de criar novo paciente */}
                {buscaPaciente && !pacienteSelecionado && (
                  <button
                    type="button"
                    onClick={() => setMostrarNovoPaciente(true)}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar "{buscaPaciente}" como novo paciente
                  </button>
                )}
                
                {mostrarNovoPaciente && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Novo paciente: <strong>{buscaPaciente}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Data do Atendimento */}
          <Input
            label="Data do Atendimento"
            type="date"
            value={form.data_atendimento || ''}
            onChange={(e) => setForm(prev => ({ ...prev, data_atendimento: e.target.value }))}
          />
          
          {/* Procedimento */}
          <Select
            label="Procedimento"
            options={optionsProcedimentos}
            value={form.tipo_procedimento_id || ''}
            onChange={(value) => setForm(prev => ({ ...prev, tipo_procedimento_id: value }))}
            placeholder="Selecione o procedimento"
          />
          
          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.valor || ''}
              onChange={(e) => setForm(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {procedimentoSelecionado?.valor_padrao && form.valor !== procedimentoSelecionado.valor_padrao && (
              <p className="mt-1 text-xs text-gray-500">
                Valor padrão: {formatCurrency(procedimentoSelecionado.valor_padrao)}
              </p>
            )}
          </div>
          
          {/* Forma de Pagamento */}
          <Select
            label="Forma de Pagamento"
            options={optionsFormasPagamento}
            value={form.forma_pagamento_id || ''}
            onChange={(value) => setForm(prev => ({ ...prev, forma_pagamento_id: value }))}
            placeholder="Selecione a forma de pagamento"
          />
          
          {/* Data Prevista de Recebimento (apenas para convênio/cartão) */}
          {formaPagamentoSelecionada && formaPagamentoSelecionada.tipo !== 'imediato' && (
            <Input
              label="Data Prevista de Recebimento"
              type="date"
              value={form.data_prevista_recebimento || ''}
              onChange={(e) => setForm(prev => ({ ...prev, data_prevista_recebimento: e.target.value }))}
            />
          )}
          
          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={form.observacoes || ''}
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={2}
              placeholder="Ex: pg 15/08, paciente retorno..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {/* Resumo */}
          {isFormValid && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Paciente:</strong> {pacienteSelecionado?.nome || buscaPaciente}</p>
                <p><strong>Procedimento:</strong> {procedimentoSelecionado?.nome}</p>
                <p><strong>Valor:</strong> {formatCurrency(form.valor || 0)}</p>
                <p><strong>Pagamento:</strong> {formaPagamentoSelecionada?.nome}</p>
                {form.data_prevista_recebimento && (
                  <p className="text-yellow-700">
                    <strong>⚠️ Recebimento previsto:</strong> {new Date(form.data_prevista_recebimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isFormValid || salvando}
            >
              {salvando ? <Spinner size="sm" /> : 'Salvar Atendimento'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
