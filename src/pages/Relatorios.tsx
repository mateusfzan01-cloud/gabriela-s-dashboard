import { useState } from 'react';
import { BarChart3, TrendingUp, Award } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, Spinner, Select, Badge } from '@/components/ui';
import { useRankingProcedimentos, useFaturamentoAnual } from '@/hooks/useDashboard';
import { formatCurrency, getMonthName, CHART_COLORS } from '@/lib/utils';

const CORES_PROCEDIMENTOS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export function Relatorios() {
  const now = new Date();
  const [filtroAno, setFiltroAno] = useState<number | undefined>(now.getFullYear());
  const [filtroMes, setFiltroMes] = useState<number | undefined>(undefined);

  // Dados
  const { data: ranking, isLoading: loadingRanking } = useRankingProcedimentos(filtroAno, filtroMes);
  const { data: faturamentoAnual, isLoading: loadingAnual } = useFaturamentoAnual();

  // Dados para gráfico de evolução
  const dadosEvolucao = faturamentoAnual?.map(item => ({
    mes: `${getMonthName(item.mes).substring(0, 3)}/${String(item.ano).substring(2)}`,
    faturamento: item.faturamento_total,
    atendimentos: item.total_atendimentos,
  })).reverse() || [];

  // Dados para gráfico de pizza (procedimentos)
  const dadosPizza = ranking?.slice(0, 5).map((item, index) => ({
    name: item.procedimento,
    value: item.faturamento_total,
    color: CORES_PROCEDIMENTOS[index],
  })) || [];

  // Options para filtros
  const optionsMeses = [
    { value: '', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const optionsAnos = [
    { value: '', label: 'Todos os anos' },
    { value: String(now.getFullYear() - 1), label: String(now.getFullYear() - 1) },
    { value: String(now.getFullYear()), label: String(now.getFullYear()) },
  ];

  const isLoading = loadingRanking || loadingAnual;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-2 text-gray-500">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          
          <div className="w-36">
            <Select
              options={optionsAnos}
              value={filtroAno ? String(filtroAno) : ''}
              onChange={(v) => setFiltroAno(v ? parseInt(v) : undefined)}
            />
          </div>
          
          <div className="w-40">
            <Select
              options={optionsMeses}
              value={filtroMes ? String(filtroMes) : ''}
              onChange={(v) => setFiltroMes(v ? parseInt(v) : undefined)}
            />
          </div>
        </div>
      </Card>

      {/* Gráfico de Evolução Mensal */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Evolução do Faturamento
          </h3>
        </div>
        
        {dadosEvolucao.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'faturamento' ? formatCurrency(value) : value,
                    name === 'faturamento' ? 'Faturamento' : 'Atendimentos'
                  ]}
                />
                <Bar 
                  dataKey="faturamento" 
                  fill={CHART_COLORS.total} 
                  radius={[4, 4, 0, 0]} 
                  name="Faturamento"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Sem dados para exibir
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Procedimentos */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Ranking de Procedimentos
            </h3>
          </div>
          
          {ranking && ranking.length > 0 ? (
            <div className="space-y-3">
              {ranking.map((item, index) => (
                <div 
                  key={item.procedimento}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: CORES_PROCEDIMENTOS[index] || '#6b7280' }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.procedimento}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantidade} {item.quantidade === 1 ? 'realizado' : 'realizados'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.faturamento_total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Média: {formatCurrency(item.ticket_medio)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Sem dados para exibir
            </div>
          )}
        </Card>

        {/* Gráfico de Pizza - Distribuição */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Procedimento (Top 5)
          </h3>
          
          {dadosPizza.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {dadosPizza.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Sem dados para exibir
            </div>
          )}
        </Card>
      </div>

      {/* Tabela Detalhada */}
      {ranking && ranking.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhamento por Procedimento
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-3 font-medium">Procedimento</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium text-center">Quantidade</th>
                  <th className="pb-3 font-medium text-right">Faturamento</th>
                  <th className="pb-3 font-medium text-right">Ticket Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ranking.map((item) => (
                  <tr key={item.procedimento} className="text-sm">
                    <td className="py-3 font-medium text-gray-900">
                      {item.procedimento}
                    </td>
                    <td className="py-3">
                      <Badge variant={item.categoria === 'consulta' ? 'info' : 'warning'}>
                        {item.categoria}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {item.quantidade}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.faturamento_total)}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(item.ticket_medio)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50">
                  <td className="py-3 font-bold text-gray-900">Total</td>
                  <td></td>
                  <td className="py-3 text-center font-bold">
                    {ranking.reduce((sum, r) => sum + r.quantidade, 0)}
                  </td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    {formatCurrency(ranking.reduce((sum, r) => sum + r.faturamento_total, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
