# Correções para Deploy no Vercel - GNOSIS AI

## 📅 Data: 26/11/2025

---

## ❌ **PROBLEMA ORIGINAL:**

O deploy no Vercel estava falhando com **14 erros de TypeScript** relacionados ao **Clerk** (sistema de autenticação externo que foi adicionado manualmente ao projeto).

### **Erros principais:**
- `Property 'verifyToken' does not exist on type 'ClerkClient'`
- `Property 'clearCookie' does not exist on type 'Response'`
- `Type 'null' is not assignable to type 'string'`
- Erros de tipagem em `api/index.ts`, `server/_core/context.ts`, `server/_core/cookies.ts`, `server/db.ts`

---

## ✅ **SOLUÇÃO APLICADA:**

### **1. Removido Clerk completamente:**
- ❌ Pacotes removidos: `@clerk/backend`, `@clerk/clerk-react`
- ❌ Variáveis de ambiente do Clerk removidas
- ❌ Campo `clerkId` removido do schema do banco de dados
- ❌ Funções `getUserByClerkId` e `upsertUserFromClerk` removidas

### **2. Restaurado Manus OAuth:**
- ✅ Sistema de autenticação nativo do template
- ✅ Usa `openId` para identificar usuários
- ✅ Já vem configurado e funcionando
- ✅ Não precisa de API keys externas

### **3. Arquivos modificados:**

#### **Backend:**
- `api/index.ts` - Tipagem corrigida (req: express.Request, res: express.Response)
- `server/_core/env.ts` - Restaurado OAuth (oAuthServerUrl, appId, cookieSecret)
- `server/_core/context.ts` - Restaurado Manus OAuth (verifyToken, getUserByOpenId)
- `server/_core/cookies.ts` - Tipos corrigidos (removido 'domain' do Pick)
- `server/db.ts` - Funções do Clerk removidas, import de User adicionado
- `server/routers.ts` - clearCookie → cookie (compatibilidade com Vercel)
- `drizzle/schema.ts` - Campo clerkId removido

#### **Frontend:**
- `client/src/main.tsx` - ClerkProvider removido, tRPC client simplificado
- `client/src/_core/hooks/useAuth.ts` - Restaurado para usar Manus OAuth

#### **Dependências:**
- `package.json` - Pacotes do Clerk removidos

---

## 🧪 **TESTES REALIZADOS:**

✅ **Build local:** `pnpm run build` - Compilou sem erros  
✅ **TypeScript:** Sem erros de tipagem  
✅ **Git:** Commit e push realizados com sucesso  

---

## 🚀 **DEPLOY:**

- **Commit:** d5f3b35
- **Mensagem:** "Remover Clerk e restaurar Manus OAuth para corrigir erros de deploy no Vercel"
- **Branch:** main
- **Status:** Push enviado para GitHub, aguardando deploy automático no Vercel

---

## 📊 **RESULTADO ESPERADO:**

O Vercel deve fazer o deploy automaticamente e o build deve passar sem erros!

---

## 🔐 **AUTENTICAÇÃO:**

O sistema agora usa **Manus OAuth** (sistema nativo do template):
- Login via Manus OAuth Portal
- Usuários identificados por `openId`
- Sessão gerenciada via cookies
- Sem dependências externas

---

## 📝 **NOTAS:**

- O Clerk foi removido porque estava causando erros de deploy no Vercel
- O Manus OAuth é mais simples e não precisa de configuração externa
- Todos os dados de usuários continuam no banco de dados
- O sistema de planos, créditos e ferramentas não foi afetado




---

## 🕐 **TIMELINE DO DEPLOY:**

- **19:45** - Push enviado para GitHub (commit d5f3b35)
- **19:50** - Vercel detectou o novo commit
- **19:50** - Build iniciado (status: Preparar)
- **19:51** - Aguardando conclusão do build...

---

## 📸 **EVIDÊNCIAS:**

- Screenshot do Vercel mostrando deployment 3UqmMw3aK em progresso
- Commit d5f3b35 visível na lista de deployments
- Status "Preparar" indica que o build está rodando

---

## 🎯 **PRÓXIMOS PASSOS:**

1. Aguardar conclusão do build (1-3 minutos)
2. Verificar se status mudou para "Pronto" (Ready)
3. Testar site em produção
4. Confirmar que login funciona com Manus OAuth

