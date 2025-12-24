# 🏥 CDC Gabriela - Sistema de Gestão Financeira Médica

Sistema web moderno para gestão financeira de consultório médico, com foco em controle de recebíveis de convênios e fluxo de caixa.

## 📸 Funcionalidades

- **Dashboard** com KPIs em tempo real (faturamento, despesas, lucro)
- **Novo Atendimento** - formulário otimizado para registro rápido
- **Gestão de Recebíveis** - controle de pagamentos de convênios/cartões
- **Despesas** - registro e categorização de gastos
- **Relatórios** - ranking de procedimentos e evolução mensal

## 🚀 Setup Rápido (15 minutos)

### 1. Criar Projeto no Supabase (Gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome (ex: `cdc-gabriela`) e senha
4. Selecione a região mais próxima (São Paulo)
5. Aguarde a criação (~2 minutos)

### 2. Configurar o Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase/schema.sql`
4. Cole no editor e clique em **Run**
5. Verifique se aparece "Success" (sem erros)

### 3. Obter as Credenciais

1. No Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public key** (a chave longa que começa com `eyJ...`)

### 4. Configurar o Projeto Local

```bash
# Clone ou baixe o projeto
cd medical-finance

# Instale as dependências
npm install

# Crie o arquivo de configuração
cp .env.example .env.local

# Edite o .env.local com suas credenciais:
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Inicie o servidor de desenvolvimento
npm run dev
```

### 5. Acessar a Aplicação

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📦 Deploy em Produção (Gratuito)

### Opção A: Vercel (Recomendado)

1. Crie conta em [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em Deploy

### Opção B: Netlify

1. Crie conta em [netlify.com](https://netlify.com)
2. Arraste a pasta `dist` (após rodar `npm run build`)
3. Ou conecte o GitHub para deploy automático
4. Configure as variáveis de ambiente em Site Settings

## 🔧 Estrutura do Projeto

```
medical-finance/
├── src/
│   ├── components/
│   │   ├── ui/          # Componentes base (Button, Card, Input)
│   │   └── layout/      # Layout principal (Sidebar, Header)
│   ├── pages/           # Páginas da aplicação
│   ├── hooks/           # Custom hooks (useAtendimentos, etc.)
│   ├── lib/             # Configurações (Supabase, utils)
│   └── types/           # Tipos TypeScript
├── supabase/
│   └── schema.sql       # Schema do banco de dados
└── public/              # Assets estáticos
```

## 📱 Uso no Celular

O sistema é totalmente responsivo. Para melhor experiência mobile:

1. Acesse a URL do deploy no navegador do celular
2. No Chrome: Menu (⋮) > "Adicionar à tela inicial"
3. No Safari: Compartilhar > "Adicionar à Tela de Início"

## ❓ Problemas Comuns

### "Supabase não configurado"
- Verifique se o arquivo `.env.local` existe e tem as credenciais corretas
- Reinicie o servidor (`npm run dev`)

### Dados não aparecem
- Verifique se o schema SQL foi executado sem erros
- No Supabase, vá em Table Editor e confirme se as tabelas existem

### Erro de CORS
- Certifique-se de usar a URL correta do Supabase (com `https://`)

## 🛠️ Manutenção

### Adicionar novo tipo de procedimento
1. Supabase > Table Editor > `tipos_procedimento`
2. Clique em "Insert Row"
3. Preencha: nome, categoria ('consulta' ou 'exame'), valor_padrao

### Adicionar nova forma de pagamento
1. Supabase > Table Editor > `formas_pagamento`
2. Clique em "Insert Row"
3. Preencha: nome, tipo ('imediato', 'cartao', 'convenio'), dias_para_recebimento

### Backup dos dados
O Supabase faz backup automático diário. Para exportar manualmente:
1. Supabase > Settings > Database
2. Clique em "Download backup"

## 📄 Licença

Projeto desenvolvido para uso pessoal. 

---

Desenvolvido com ❤️ usando React, TypeScript e Supabase
