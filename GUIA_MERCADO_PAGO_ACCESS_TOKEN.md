# 🔑 GUIA COMPLETO: Como Obter o Access Token do Mercado Pago

**Projeto:** GNOSIS AI  
**Data:** 28 de Outubro de 2025  
**Objetivo:** Configurar pagamentos reais via Mercado Pago

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Passo a Passo para Obter o Access Token](#passo-a-passo)
3. [Diferença entre Teste e Produção](#diferença-entre-teste-e-produção)
4. [Como Configurar no Projeto](#como-configurar-no-projeto)
5. [Como Testar se Está Funcionando](#como-testar)
6. [Solução de Problemas](#solução-de-problemas)
7. [Segurança e Boas Práticas](#segurança)

---

## ⚠️ PRÉ-REQUISITOS

Antes de começar, você precisa:

✅ **Conta no Mercado Pago**
   - Se não tem: Crie em https://www.mercadopago.com.br

✅ **Conta Verificada**
   - Documentos enviados e aprovados
   - Conta bancária vinculada

✅ **Ser Vendedor (Seller)**
   - Ativar conta como vendedor no Mercado Pago
   - Aceitar os termos de uso para desenvolvedores

---

## 🚀 PASSO A PASSO PARA OBTER O ACCESS TOKEN

### Passo 1: Acessar o Portal de Desenvolvedores

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Faça login** com sua conta do Mercado Pago
3. Você será redirecionado para o painel de desenvolvedores

### Passo 2: Criar uma Aplicação

1. No menu lateral, clique em **"Suas integrações"** ou **"Your integrations"**
2. Clique no botão **"Criar aplicação"** ou **"Create application"**
3. Preencha os dados:
   - **Nome da aplicação:** GNOSIS AI
   - **Descrição:** Plataforma de estudos bíblicos com IA
   - **Tipo de integração:** Pagamentos online
   - **Modelo de negócio:** Marketplace ou Assinaturas
4. Clique em **"Criar aplicação"**

### Passo 3: Acessar as Credenciais

Após criar a aplicação, você será redirecionado para a página da aplicação.

1. No menu lateral da aplicação, clique em **"Credenciais"** ou **"Credentials"**
2. Você verá duas seções:
   - **Credenciais de teste** (Sandbox)
   - **Credenciais de produção** (Production)

### Passo 4: Obter o Access Token de TESTE (Sandbox)

**⚠️ COMECE SEMPRE COM TESTE!**

1. Na seção **"Credenciais de teste"**, você verá:
   - **Public Key** (começa com `TEST-...`)
   - **Access Token** (começa com `TEST-...`)

2. **Copie o Access Token de teste**
   - Clique no ícone de copiar ao lado do token
   - Exemplo: `TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789`

3. **Guarde este token** em um lugar seguro temporariamente

### Passo 5: Obter o Access Token de PRODUÇÃO

**⚠️ SÓ USE PRODUÇÃO DEPOIS DE TESTAR!**

1. Na seção **"Credenciais de produção"**, você verá:
   - **Public Key** (começa com `APP_USR-...`)
   - **Access Token** (começa com `APP_USR-...`)

2. **Copie o Access Token de produção**
   - Clique no ícone de copiar ao lado do token
   - Exemplo: `APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789`

3. **Guarde este token** em um lugar MUITO seguro

---

## 🔍 DIFERENÇA ENTRE TESTE E PRODUÇÃO

### Credenciais de TESTE (Sandbox)

**Quando usar:**
- ✅ Durante o desenvolvimento
- ✅ Para testar o fluxo de pagamento
- ✅ Antes de lançar para o público

**Características:**
- ❌ Não processa pagamentos reais
- ✅ Usa cartões de teste
- ✅ Não cobra dinheiro de verdade
- ✅ Perfeito para validar o código

**Cartões de Teste:**
```
Mastercard Aprovado:
  Número: 5031 4332 1540 6351
  CVV: 123
  Validade: 11/25

Visa Aprovado:
  Número: 4235 6477 2802 5682
  CVV: 123
  Validade: 11/25

PIX de Teste:
  Use qualquer CPF válido
  O pagamento será aprovado automaticamente
```

### Credenciais de PRODUÇÃO (Production)

**Quando usar:**
- ✅ Após testar tudo em sandbox
- ✅ Quando for lançar para o público
- ✅ Para processar pagamentos reais

**Características:**
- ✅ Processa pagamentos reais
- ✅ Cobra dinheiro de verdade dos clientes
- ✅ Transfere dinheiro para sua conta
- ⚠️ Erros podem custar dinheiro!

---

## ⚙️ COMO CONFIGURAR NO PROJETO

### Método 1: Via Management UI (RECOMENDADO)

1. **Abra o projeto GNOSIS AI**
   - Restaure o checkpoint se necessário: `a8de0379`

2. **Acesse o Management UI**
   - Clique no ícone no canto superior direito

3. **Vá para Settings → Secrets**
   - No menu lateral, clique em "Settings"
   - Depois clique em "Secrets"

4. **Adicione o Access Token**
   - Clique em "Add Secret" ou "+"
   - **Key:** `MERCADOPAGO_ACCESS_TOKEN`
   - **Value:** Cole o token (comece com TESTE!)
   - Clique em "Save"

5. **Reinicie o servidor**
   - O agente pode fazer isso automaticamente
   - Ou você pode pedir: "Por favor, reinicie o servidor"

### Método 2: Via Agente (Alternativa)

Envie esta mensagem ao agente:

```
Preciso configurar o Access Token do Mercado Pago.

Por favor, adicione a seguinte variável de ambiente:

Key: MERCADOPAGO_ACCESS_TOKEN
Value: [cole seu token aqui]

Depois, reinicie o servidor.
```

---

## ✅ COMO TESTAR SE ESTÁ FUNCIONANDO

### Teste 1: Verificar se o Token Está Configurado

Peça ao agente:

```
Por favor, verifique se a variável MERCADOPAGO_ACCESS_TOKEN está configurada.
```

O agente pode executar:
```bash
echo $MERCADOPAGO_ACCESS_TOKEN
```

Se retornar o token, está configurado!

### Teste 2: Testar Criação de Checkout

1. **Abra o preview do projeto**
2. **Faça login**
3. **Clique em "Upgrade de Plano"**
4. **Selecione um plano** (ex: Lumen)
5. **Clique em "Assinar Agora"**

**O que deve acontecer:**
- ✅ Você é redirecionado para a página do Mercado Pago
- ✅ Aparece a tela de pagamento com o valor correto
- ✅ Você pode escolher forma de pagamento (PIX, Cartão, Boleto)

**Se usar credenciais de TESTE:**
- Use os cartões de teste mencionados acima
- O pagamento será aprovado automaticamente

**Se usar credenciais de PRODUÇÃO:**
- ⚠️ Use seu próprio cartão para testar
- ⚠️ Você será cobrado de verdade!
- ⚠️ Teste com o plano mais barato primeiro

### Teste 3: Verificar Webhook

Após fazer um pagamento de teste:

1. **Aguarde alguns segundos**
2. **Volte para o Dashboard**
3. **Verifique se:**
   - ✅ Seu plano foi atualizado
   - ✅ Seus créditos aumentaram
   - ✅ Ferramentas foram desbloqueadas

**Se tudo funcionou:**
🎉 Parabéns! O Mercado Pago está configurado corretamente!

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Problema 1: "Access Token inválido"

**Possíveis causas:**
- Token copiado incorretamente (faltou parte)
- Token de teste sendo usado em produção (ou vice-versa)
- Token expirado ou revogado

**Solução:**
1. Volte ao portal de desenvolvedores
2. Copie o token novamente (certifique-se de copiar TUDO)
3. Verifique se está usando o token correto (teste ou produção)
4. Atualize no projeto

### Problema 2: "Não consigo criar aplicação"

**Possíveis causas:**
- Conta não verificada
- Documentos pendentes
- Não aceitou termos de desenvolvedor

**Solução:**
1. Acesse https://www.mercadopago.com.br/settings/account
2. Verifique se sua conta está completa
3. Envie documentos se necessário
4. Aceite os termos de desenvolvedor

### Problema 3: "Checkout não abre"

**Possíveis causas:**
- Token não configurado
- Servidor não reiniciado após configurar
- Erro no código

**Solução:**
1. Verifique se o token está configurado
2. Reinicie o servidor: `webdev_restart_server`
3. Verifique os logs do servidor
4. Peça ao agente para verificar erros

### Problema 4: "Pagamento aprovado mas assinatura não ativa"

**Possíveis causas:**
- Webhook não configurado corretamente
- URL do webhook incorreta
- Erro no processamento do webhook

**Solução:**
1. Verifique os logs do servidor
2. Confirme que a URL do webhook está correta:
   ```
   https://[seu-dominio]/api/webhooks/mercadopago
   ```
3. Teste manualmente o webhook
4. Verifique se o banco de dados foi atualizado

### Problema 5: "Não encontro as credenciais"

**Solução:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique na sua aplicação (GNOSIS AI)
3. No menu lateral, clique em "Credenciais" ou "Credentials"
4. Se não aparecer, sua conta pode não estar ativada como desenvolvedor

---

## 🔒 SEGURANÇA E BOAS PRÁTICAS

### ⚠️ NUNCA FAÇA ISSO:

❌ **Compartilhar seu Access Token publicamente**
❌ **Colocar o token no código-fonte**
❌ **Enviar o token por email não criptografado**
❌ **Usar token de produção para testes**
❌ **Deixar o token em arquivos públicos**

### ✅ SEMPRE FAÇA ISSO:

✅ **Use variáveis de ambiente** (como estamos fazendo)
✅ **Teste primeiro com credenciais de teste**
✅ **Guarde o token em local seguro** (gerenciador de senhas)
✅ **Revogue tokens antigos** se criar novos
✅ **Monitore transações** regularmente

### 🔐 Onde Guardar o Access Token:

**Opção 1: Gerenciador de Senhas**
- LastPass, 1Password, Bitwarden, etc.
- Mais seguro

**Opção 2: Arquivo Criptografado**
- Use um arquivo .txt criptografado
- Guarde em local seguro

**Opção 3: Anotação Física**
- Papel guardado em local seguro
- Menos prático, mas seguro

### 🔄 Quando Renovar o Token:

- Se você suspeitar que foi comprometido
- Se mudou de conta do Mercado Pago
- A cada 6-12 meses (boa prática)
- Se o Mercado Pago solicitar

---

## 📝 CHECKLIST FINAL

Antes de considerar a configuração completa:

### ✅ Configuração Básica

- [ ] Conta do Mercado Pago criada e verificada
- [ ] Aplicação criada no portal de desenvolvedores
- [ ] Access Token de TESTE copiado
- [ ] Access Token de PRODUÇÃO copiado e guardado
- [ ] Token de teste configurado no projeto
- [ ] Servidor reiniciado

### ✅ Testes em Sandbox

- [ ] Checkout abre corretamente
- [ ] Consegue fazer pagamento com cartão de teste
- [ ] Webhook processa o pagamento
- [ ] Assinatura é ativada no banco de dados
- [ ] Créditos são adicionados
- [ ] Ferramentas são desbloqueadas

### ✅ Produção (Após Testes)

- [ ] Todos os testes em sandbox passaram
- [ ] Token de produção configurado
- [ ] Servidor reiniciado
- [ ] Teste com pagamento real (valor baixo)
- [ ] Confirmação de que está funcionando
- [ ] Monitoramento ativo

---

## 🎯 RESUMO EM 5 PASSOS

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Crie aplicação:** GNOSIS AI
3. **Copie o token de TESTE:** Começa com `TEST-...`
4. **Configure no projeto:** Settings → Secrets → `MERCADOPAGO_ACCESS_TOKEN`
5. **Teste:** Faça um pagamento de teste e verifique

---

## 📞 LINKS ÚTEIS

- **Portal de Desenvolvedores:** https://www.mercadopago.com.br/developers
- **Suas Aplicações:** https://www.mercadopago.com.br/developers/panel/app
- **Documentação:** https://www.mercadopago.com.br/developers/pt/docs
- **Suporte:** https://www.mercadopago.com.br/developers/pt/support
- **Status da API:** https://status.mercadopago.com

---

## 🎉 CONCLUSÃO

Seguindo este guia, você conseguirá:

✅ Obter o Access Token do Mercado Pago  
✅ Configurar no projeto GNOSIS AI  
✅ Testar pagamentos em sandbox  
✅ Ativar pagamentos reais em produção  
✅ Resolver problemas comuns  

**Boa sorte com os pagamentos! 🚀**

---

**Criado em:** 28/10/2025 22:50 GMT-3  
**Versão:** 1.0 - Completo  
**Projeto:** GNOSIS AI  
**Autor:** Manus AI Agent

