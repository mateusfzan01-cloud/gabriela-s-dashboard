import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Card, StatCard, Spinner, Badge, Button } from '@/components/ui';
import { 
  useFaturamentoMes, 
  useDespesasMes, 
  useTotalRecebiveis,
  useFaturamentoAnual 
} from '@/hooks/useDashboard';
import { useRecebiveisPendentes } from '@/hooks/useAtendimentos';
import { formatCurrency, getMonthName, formatDate, CHART_COLORS } from '@/lib/utils';

export function Dashboard() {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;

  const { data: faturamento, isLoading: loadingFat } = useFaturamentoMes(ano, mes);
  const { data: despesas, isLoading: loadingDesp } = useDespesasMes(ano, mes);
  const { data: recebiveis, isLoading: loadingRec } = useTotalRecebiveis();
  const { data: recebiveisMes } = useRecebiveisPendentes(ano, mes);
  const { data: faturamentoAnual } = useFaturamentoAnual();

  const isLoading = loadingFat || loadingDesp || loadingRec;

  // Dados para o gráfico de pizza (receita por fonte)
  const dadosPizza = faturamento ? [
    { name: 'Pix/Dinheiro', value: faturamento.total_imediato, color: CHART_COLORS.pix },
    { name: 'Cartão', value: faturamento.total_cartao, color: CHART_COLORS.cartao },
    { name: 'Convênio', value: faturamento.total_convenio, color: CHART_COLORS.convenio },
  ].filter(d => d.value > 0) : [];

  // Dados para o gráfico de barras (evolução mensal)
  const dadosBarras = faturamentoAnual?.map(item => ({
    mes: getMonthName(item.mes).substring(0, 3),
    valor: item.faturamento_total,
  })).reverse() || [];

  // Cálculo do lucro
  const lucro = (faturamento?.faturamento_total || 0) - (despesas?.total || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com mês atual */}
      <div className="flex items-center gap-2 text-gray-500">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">{getMonthName(mes)} de {ano}</span>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(faturamento?.faturamento_total || 0)}
          subtitle={`${faturamento?.quantidade || 0} atendimentos`}
          icon={<DollarSign className="w-6 h-6" />}
        />
        
        <StatCard
          title="Despesas Totais"
          value={formatCurrency(despesas?.total || 0)}
          subtitle="Fixas + Variáveis"
          icon={<TrendingDown className="w-6 h-6" />}
          variant="warning"
        />
        
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(lucro)}
          icon={<TrendingUp className="w-6 h-6" />}
          variant={lucro >= 0 ? 'success' : 'danger'}
        />
        
        <StatCard
          title="A Receber"
          value={formatCurrency(recebiveis?.total || 0)}
          subtitle={`${recebiveis?.quantidade || 0} pendentes`}
          icon={<Clock className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Receita por Fonte */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Receita por Forma de Pagamento
          </h3>
          {dadosPizza.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {dadosPizza.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Sem dados para exibir
            </div>
          )}
        </Card>

        {/* Gráfico de Barras - Evolução Mensal */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Evolução do Faturamento
          </h3>
          {dadosBarras.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarras}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="valor" fill={CHART_COLORS.total} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Sem dados para exibir
            </div>
          )}
        </Card>
      </div>

      {/* Recebíveis do mês */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recebíveis Previstos para {getMonthName(mes)}
          </h3>
          <Link to="/recebiveis">
            <Button variant="ghost" size="sm">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        {recebiveisMes && recebiveisMes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Paciente</th>
                  <th className="pb-3 font-medium">Procedimento</th>
                  <th className="pb-3 font-medium">Forma</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                  <th className="pb-3 font-medium">Previsão</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recebiveisMes.slice(0, 5).map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="py-3 font-medium text-gray-900">{item.paciente}</td>
                    <td className="py-3 text-gray-600">{item.procedimento}</td>
                    <td className="py-3">
                      <Badge variant="info">{item.forma_pagamento}</Badge>
                    </td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.valor)}</td>
                    <td className="py-3 text-gray-600">{formatDate(item.data_prevista_recebimento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Nenhum recebível previsto para este mês
          </p>
        )}
      </Card>

      {/* Resumo de Despesas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-50">
          <p className="text-sm text-gray-500">Despesas Fixas</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatCurrency(despesas?.fixas || 0)}
          </p>
        </Card>
        <Card className="bg-gray-50">
          <p className="text-sm text-gray-500">Despesas Variáveis</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatCurrency(despesas?.variaveis || 0)}
          </p>
        </Card>
        <Card className="bg-gray-50">
          <p className="text-sm text-gray-500">Despesas Pessoais</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatCurrency(despesas?.pessoais || 0)}
          </p>
        </Card>
      </div>
    </div>
  );
}
