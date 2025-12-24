# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Medical clinic financial management system (CDC Gabriela) built with React + TypeScript frontend and Supabase backend. Designed for tracking appointments, receivables from insurance plans/cards, expenses, and cash flow for a medical practice.

## Commands

```bash
npm run dev      # Start development server on port 3000
npm run build    # Type-check and build for production
npm run lint     # ESLint with zero warnings tolerance
npm run preview  # Preview production build
```

## Architecture

**Frontend Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Query (TanStack), React Router v6, Recharts

**Backend**: Supabase (PostgreSQL + Auth + Realtime)

### Path Alias
Use `@/` for imports from `src/` (configured in vite.config.ts)

### Data Flow
1. **Atendimentos (Appointments)** record consultations/procedures with payment method
2. Payment types determine receivable status:
   - `imediato` (Pix/Cash): Auto-marked as `recebido` via database trigger
   - `cartao`/`convenio`: Stay `pendente` until manually confirmed
3. **Dashboard** shows KPIs based on competence regime (when service occurred) vs cash regime (when payment received)

### Key Database Entities
- `pacientes` - Patient records
- `tipos_procedimento` - Procedure catalog (consulta/exame)
- `formas_pagamento` - Payment methods with `dias_para_recebimento`
- `atendimentos` - Appointments with status tracking (pendente/recebido/cancelado)
- `despesas` - Expenses with categories (fixa/variavel/pessoal)

### Database Views (Supabase)
- `vw_recebiveis_pendentes` - Pending receivables from cards/insurance
- `vw_faturamento_mensal` - Monthly revenue breakdown
- `vw_ranking_procedimentos` - Procedure profitability ranking

### Custom Hooks Pattern
Hooks in `src/hooks/` encapsulate Supabase queries with React Query for caching and loading states.

### UI Components
Located in `src/components/ui/` - base components following shadcn/ui patterns. Custom colors defined in `tailwind.config.js`: primary (blue), success (green), warning (amber), danger (red).

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Run `supabase/schema.sql` in Supabase SQL Editor to create all tables, views, functions, and triggers.
