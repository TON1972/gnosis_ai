# 🚀 Deploy GNOSIS AI no Vercel

## 📋 Pré-requisitos

✅ Conta no GitHub (TON1972/gnosis-ai-app)  
✅ Conta no Clerk (autenticação)  
✅ Conta no Supabase (banco de dados)  
✅ Conta no Vercel (hospedagem)

---

## 🔧 Configuração

### 1. Variáveis de Ambiente no Vercel

Após fazer deploy, configure estas variáveis no painel do Vercel:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c3F1YXJlLXdlZXZpbC04MC5jbGVyay5hY2NvdW50cy5kZXYk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3F1YXJlLXdlZXZpbC04MC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_CfZsH8u2BCSj8jykkIpIWCnfjNwBL2poIbUP8UThc9
DATABASE_URL=postgresql://postgres:Gnosis@ai-base26@db.oogjsbskwuetvatgmwgb.supabase.co:5432/postgres
VITE_APP_TITLE=GNOSIS AI
VITE_APP_LOGO=https://files.manuscdn.com/user_upload_by_module/session_file/310519663169314957/eRLFubileexzOKHZ.png
JWT_SECRET=gnosis-ai-super-secret-jwt-key-change-in-production
NODE_ENV=production
```

### 2. Variáveis que VOCÊ precisa adicionar:

```
OPENAI_API_KEY=sua-chave-openai-aqui
MERCADOPAGO_ACCESS_TOKEN=seu-token-mercadopago-aqui
```

---

## 📦 Deploy

### Opção 1: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opção 2: Via GitHub

1. Acesse https://vercel.com/new
2. Conecte o repositório `TON1972/gnosis-ai-app`
3. Configure as variáveis de ambiente
4. Clique em "Deploy"

---

## ✅ Verificação

Após deploy, teste:

1. ✅ Site carrega
2. ✅ Login com Clerk funciona
3. ✅ Ferramentas de IA funcionam
4. ✅ Sistema de créditos funciona
5. ✅ Pagamentos Mercado Pago funcionam

---

## 🔗 Links Úteis

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Supabase Dashboard:** https://supabase.com/dashboard

---

## 🆘 Problemas?

Se algo der errado:

1. Verifique os logs no Vercel Dashboard
2. Verifique se todas as variáveis estão configuradas
3. Verifique se o banco Supabase está acessível
4. Verifique se as chaves do Clerk estão corretas

