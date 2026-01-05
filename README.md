# GNOSIS AI - Estudos Bíblicos Profundos

Plataforma completa com 19 ferramentas de estudos bíblicos profundos.

## Última Atualização
25/11/2025 - 00:35h

## Ferramentas Disponíveis
- 18 ferramentas anteriores
- **NOVA:** Escatologia Bíblica (disponível para planos Lumen e Gnosis Premium)

## Versão
v1.0.1 - Checkpoint Publicável com todas as atualizações mais recentes

---

## Contexto de Migração Vercel Serverless (04/01/2026)

### 🔹 Stack
- Next.js App Router (Frontend) / Vite (Atual)
- tRPC
- Drizzle ORM
- Supabase (Auth + DB)
- Vercel (Serverless)

### 🔹 Problema atual
Deploy na Vercel retornava:
`FUNCTION_INVOCATION_FAILED`
`500 Internal Server Error`

O projeto misturava backend Express tradicional com Serverless, causando erros de runtime incompatíveis.

### 🔹 O que já foi feito
- Removido Express do build (exclusão de `api/index.ts`).
- Migrado tRPC para fetch adapter (`api/trpc/[trpc].ts`).
- Corrigidos imports com alias (`@shared` -> relativo).
- Cookies adaptados para serverless (`res.headers.append` vs `res.cookie`).
- Rotas REST isoladas em Serverless Functions (`api/login`, `api/register`, etc).

### 🔹 Como rodar localmente
Recomendado usar `vercel dev` para simular o ambiente serverless.
Se usar `npm run dev`, o servidor Express (`server/_core/index.ts`) pode apresentar incompatibilidades com os novos handlers adaptados para Fetch API (ex: tRPC context usando Headers em vez de Express Response).
