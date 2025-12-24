# 🏥 Sistema de Gestão Financeira Médica - CDC Gabriela

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │ Dashboard │ │ Atendi-   │ │ Recebi-   │ │  Relatórios   │   │
│  │   (KPIs)  │ │  mentos   │ │   veis    │ │  & Gráficos   │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Tailwind CSS + shadcn/ui                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS (API REST + Realtime)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐   │
│  │   Auth    │ │ PostgreSQL│ │  Storage  │ │   Realtime    │   │
│  │  (Login)  │ │   (Dados) │ │ (Arquivos)│ │  (Updates)    │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Row Level Security (RLS)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | React 18 + TypeScript | Tipagem, componentes, grande ecossistema |
| **Estilização** | Tailwind CSS + shadcn/ui | Rapidez, responsividade, componentes prontos |
| **Gráficos** | Recharts | Leve, declarativo, boa documentação |
| **Estado** | React Query (TanStack) | Cache, sincronização, loading states |
| **Roteamento** | React Router v6 | Padrão de mercado |
| **Backend** | Supabase | Auth + DB + API + Realtime em um só |
| **Banco** | PostgreSQL (via Supabase) | Robusto, gratuito, SQL completo |
| **Deploy** | Vercel ou Netlify | Gratuito, CI/CD automático |
| **PWA** | Vite PWA Plugin | Funciona offline, instala no celular |

## Funcionalidades por Módulo

### 1. Dashboard Principal
- Card: Faturamento Bruto do Mês
- Card: Despesas Totais
- Card: Lucro Líquido Previsto
- Card: Total a Receber (Convênios)
- Gráfico: Receita por Fonte (Pix vs Convênio vs Cartão)
- Lista: Recebíveis Previstos para Este Mês
- Gráfico: Evolução Mensal (últimos 12 meses)

### 2. Novo Atendimento (Formulário)
- Tipo: Consulta ou Procedimento
- Paciente: Autocomplete ou novo cadastro
- Procedimento: Dropdown (SIBO, Manometria, Phmetria, etc.)
- Valor: Campo numérico
- Forma de Pagamento: Pix, Dinheiro, Crédito, Débito, Convênio
- Se Convênio: Data Prevista de Recebimento
- Se Cartão: Maquininha (para futura integração Rede)

### 3. Gestão de Recebíveis
- Lista de pagamentos pendentes de convênio
- Filtro por mês de previsão
- Botão "Confirmar Recebimento" (baixa)
- Histórico de conciliações

### 4. Despesas
- Cadastro de despesas fixas e variáveis
- Categorização (Material, Marketing, Pessoal, etc.)
- Recorrência (mensal, única)

### 5. Relatórios
- Ranking de Procedimentos por Rentabilidade
- Comparativo Mensal/Anual
- Exportar para Excel/PDF

## Estrutura de Pastas

```
medical-finance/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── dashboard/          # Cards, gráficos
│   │   ├── forms/              # Formulários
│   │   └── layout/             # Header, Sidebar, etc.
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── NovoAtendimento.tsx
│   │   ├── Recebiveis.tsx
│   │   ├── Despesas.tsx
│   │   └── Relatorios.tsx
│   ├── hooks/
│   │   ├── useAtendimentos.ts
│   │   ├── useRecebiveis.ts
│   │   └── useDespesas.ts
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── utils.ts            # Helpers
│   │   └── constants.ts        # Enums, tipos
│   ├── types/
│   │   └── database.ts         # Tipos do banco
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/             # SQL do banco
├── public/
├── package.json
└── vite.config.ts
```

## Fluxo de Dados Principal

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Consulta   │     │ Procedimento │     │   Despesa    │
│  realizada   │     │  realizado   │     │  registrada  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                    TRANSAÇÃO FINANCEIRA                   │
│  - tipo: receita/despesa                                  │
│  - valor                                                  │
│  - data_competencia (quando foi realizado)                │
│  - data_pagamento (quando o dinheiro entra/sai)           │
│  - status: pendente/recebido/cancelado                    │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                      DASHBOARD                            │
│  Regime de COMPETÊNCIA: quando foi realizado              │
│  Regime de CAIXA: quando o dinheiro movimentou            │
│  Recebíveis: data_pagamento futura + status pendente      │
└──────────────────────────────────────────────────────────┘
```

## Considerações de Segurança

1. **Autenticação**: Login com email/senha via Supabase Auth
2. **RLS (Row Level Security)**: Cada query verifica o user_id
3. **HTTPS**: Obrigatório em produção (Vercel/Netlify fazem automaticamente)
4. **Backup**: Supabase faz backup diário automático no plano gratuito

## Limites do Plano Gratuito Supabase

| Recurso | Limite Free Tier |
|---------|------------------|
| Banco de dados | 500 MB |
| Storage | 1 GB |
| Bandwidth | 2 GB/mês |
| Usuários Auth | Ilimitado |
| Requests API | 50.000/mês |

**Estimativa para seu uso**: Com ~100 atendimentos/mês, você usará menos de 1% desses limites.

## Roadmap de Desenvolvimento

### Fase 1 - MVP (2-3 semanas)
- [x] Schema do banco de dados
- [ ] Setup do projeto React + Supabase
- [ ] Formulário de Novo Atendimento
- [ ] Lista de Atendimentos do Mês
- [ ] Dashboard básico (cards de KPI)

### Fase 2 - Completo (2-3 semanas)
- [ ] Gestão de Recebíveis (baixa de convênios)
- [ ] Cadastro de Despesas
- [ ] Gráficos interativos
- [ ] Filtros por período

### Fase 3 - Polimento (1-2 semanas)
- [ ] PWA (instalar no celular)
- [ ] Relatórios exportáveis
- [ ] Tema claro/escuro
- [ ] Melhorias de UX

### Fase 4 - Futuro (opcional)
- [ ] Integração com Rede (API de maquininha)
- [ ] Agenda de consultas
- [ ] Notificações de recebíveis
