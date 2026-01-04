# 🔄 GUIA COMPLETO DE RESTAURAÇÃO DO BACKUP - GNOSIS AI

**Versão:** 1.0  
**Data:** 28 de Outubro de 2025  
**Checkpoint:** a8de0379

---

## 📋 ÍNDICE

1. [Informações Importantes](#informações-importantes)
2. [Método 1: Restauração via Checkpoint (RECOMENDADO)](#método-1-restauração-via-checkpoint)
3. [Método 2: Restauração via ZIP](#método-2-restauração-via-zip)
4. [Verificação Pós-Restauração](#verificação-pós-restauração)
5. [Solução de Problemas](#solução-de-problemas)
6. [Como Continuar o Desenvolvimento](#como-continuar-o-desenvolvimento)

---

## ⚠️ INFORMAÇÕES IMPORTANTES

### O Que Você Precisa Ter:

✅ **Checkpoint ID:** `a8de0379`  
✅ **Checkpoint URL:** `manus-webdev://a8de0379`  
✅ **Arquivo ZIP:** `gnosis-ai-backup-20251028.zip` (4.1 MB)  
✅ **Documentação:** 
   - `BACKUP_DOCUMENTATION.md`
   - `AGENT_TRANSFER_CONTEXT.md`
   - `FILES_MODIFIED.md`

### O Que Será Restaurado:

- ✅ Projeto completo com 15 ferramentas de IA
- ✅ Sistema de pagamento (mensal e anual)
- ✅ 4 planos de assinatura
- ✅ Sistema de créditos
- ✅ FAQ com 30 perguntas
- ✅ Integração Mercado Pago
- ✅ Banco de dados com schema e dados iniciais

---

## 🎯 MÉTODO 1: RESTAURAÇÃO VIA CHECKPOINT (RECOMENDADO)

Este é o método **mais rápido e seguro**. Use este método sempre que possível.

### Passo 1: Iniciar Conversa com Novo Agente

Abra uma nova conversa com o Manus AI e envie a seguinte mensagem:

```
Olá! Preciso restaurar o projeto GNOSIS AI a partir de um checkpoint.

Checkpoint ID: a8de0379
Checkpoint URL: manus-webdev://a8de0379

Por favor, restaure este checkpoint usando o comando webdev_rollback_checkpoint.
```

### Passo 2: Aguardar Restauração

O agente executará automaticamente:

```bash
webdev_rollback_checkpoint
  brief: "Restaurar projeto GNOSIS AI do backup"
  version_id: "a8de0379"
```

Você verá uma mensagem confirmando que o projeto foi restaurado com sucesso.

### Passo 3: Verificar Status

Peça ao agente para verificar o status:

```
Por favor, verifique o status do projeto usando webdev_check_status.
```

O agente executará:

```bash
webdev_check_status
  brief: "Verificar status do projeto restaurado"
```

### Passo 4: Confirmar Funcionalidades

Peça ao agente para abrir o preview e verificar:

```
Por favor, abra o preview do projeto e verifique se:
1. A Home page está carregando corretamente
2. O toggle Mensal/Anual funciona
3. O Dashboard mostra as ferramentas
4. O modal de upgrade abre corretamente
```

### Passo 5: Fornecer Documentação

Envie os arquivos de documentação ao agente:

```
Aqui estão os arquivos de documentação do projeto para referência:
[anexar BACKUP_DOCUMENTATION.md]
[anexar AGENT_TRANSFER_CONTEXT.md]
[anexar FILES_MODIFIED.md]

Por favor, leia estes arquivos para entender a estrutura completa do projeto.
```

### ✅ Pronto!

Se tudo correu bem, o projeto está 100% restaurado e pronto para continuar o desenvolvimento.

---

## 💾 MÉTODO 2: RESTAURAÇÃO VIA ZIP

Use este método **apenas se o Método 1 falhar** ou se o checkpoint não estiver disponível.

### Passo 1: Iniciar Novo Projeto

Abra uma nova conversa com o Manus AI e envie:

```
Olá! Preciso criar um novo projeto web com banco de dados e autenticação.

Nome do projeto: gnosis-ai
Título: GNOSIS AI - Estudos Bíblicos Profundos
Features: web-db-user

Por favor, crie o projeto usando webdev_init_project.
```

### Passo 2: Enviar Arquivo ZIP

Após o projeto ser criado, envie:

```
Tenho um backup completo do projeto em formato ZIP. Vou enviar agora.
[anexar gnosis-ai-backup-20251028.zip]

Por favor, extraia este arquivo e substitua os arquivos do projeto pelos arquivos do backup.
```

### Passo 3: Extrair e Substituir Arquivos

O agente executará:

```bash
cd /home/ubuntu
unzip gnosis-ai-backup-20251028.zip -d gnosis-ai-restored
cp -r gnosis-ai-restored/gnosis-ai/* /home/ubuntu/gnosis-ai/
```

### Passo 4: Instalar Dependências

Peça ao agente:

```
Por favor, instale as dependências do projeto:
cd /home/ubuntu/gnosis-ai && pnpm install
```

### Passo 5: Configurar Banco de Dados

Peça ao agente:

```
Por favor, configure o banco de dados:
1. Aplicar o schema: pnpm db:push
2. Popular dados iniciais: pnpm db:seed
```

O agente executará:

```bash
cd /home/ubuntu/gnosis-ai
pnpm db:push
pnpm db:seed
```

### Passo 6: Reiniciar Servidor

Peça ao agente:

```
Por favor, reinicie o servidor de desenvolvimento:
webdev_restart_server
```

### Passo 7: Verificar Funcionamento

Peça ao agente:

```
Por favor, verifique se o projeto está funcionando:
1. Abra o preview
2. Teste a Home page
3. Teste o Dashboard
4. Verifique se há erros no console
```

### ✅ Pronto!

Se tudo correu bem, o projeto está restaurado e funcionando.

---

## 🔍 VERIFICAÇÃO PÓS-RESTAURAÇÃO

Após restaurar o projeto (por qualquer método), execute esta checklist de verificação:

### Checklist de Verificação Básica

Peça ao agente para verificar cada item:

```
Por favor, verifique os seguintes itens:

✅ SERVIDOR:
- [ ] Servidor rodando sem erros (porta 3000)
- [ ] TypeScript compilando sem erros
- [ ] Sem erros no console do navegador

✅ BANCO DE DADOS:
- [ ] 4 planos cadastrados (FREE, Aliança, Lumen, Premium)
- [ ] 15 ferramentas cadastradas
- [ ] Relações plan-tools configuradas

✅ FRONTEND:
- [ ] Home page carrega corretamente
- [ ] Logo GNOSIS AI aparece
- [ ] Toggle Mensal/Anual funciona na Home
- [ ] Preços mensais: R$ 18,98 / R$ 33,98 / R$ 62,98
- [ ] Preços anuais: R$ 189,95 / R$ 340,07 / R$ 630,30

✅ DASHBOARD:
- [ ] Dashboard carrega
- [ ] Mostra 15 ferramentas
- [ ] CreditsPanel exibe saldo
- [ ] Botões de upgrade funcionam

✅ MODAL DE UPGRADE:
- [ ] Modal abre ao clicar "Upgrade de Plano"
- [ ] Toggle Mensal/Anual funciona no modal
- [ ] 3 planos são exibidos (Aliança, Lumen, Premium)
- [ ] Preços calculam corretamente

✅ FAQ:
- [ ] FAQ carrega com 30 perguntas
- [ ] Accordion funciona
- [ ] 6 categorias visíveis
```

### Comando para Verificação Rápida

Peça ao agente:

```
Execute este comando para verificar os dados do banco:

webdev_execute_sql --query "SELECT id, displayName, priceMonthly, priceYearly FROM plans"
```

Resultado esperado:

```
id | displayName    | priceMonthly | priceYearly
---|----------------|--------------|-------------
1  | FREE           | 0.00         | 0.00
2  | Aliança        | 18.98        | 189.95
3  | Lumen          | 33.98        | 340.07
4  | GNOSIS Premium | 62.98        | 630.30
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Problema 1: Checkpoint Não Encontrado

**Erro:** "Version ID not found" ou "Checkpoint does not exist"

**Solução:**

```
1. Verifique se o version_id está correto: a8de0379
2. Se o erro persistir, use o Método 2 (Restauração via ZIP)
3. Informe ao agente que o checkpoint pode ter expirado
```

### Problema 2: Servidor Não Inicia

**Erro:** "Failed to start dev server" ou "Port 3000 already in use"

**Solução:**

Peça ao agente:

```
Por favor, execute os seguintes comandos:

1. Verificar processos na porta 3000:
   lsof -ti:3000 | xargs kill -9

2. Reiniciar servidor:
   webdev_restart_server

3. Verificar logs:
   webdev_check_status
```

### Problema 3: Banco de Dados Vazio

**Erro:** "No plans found" ou "No tools found"

**Solução:**

Peça ao agente:

```
Por favor, reexecute o seed do banco de dados:

cd /home/ubuntu/gnosis-ai
pnpm db:seed

Depois verifique:
webdev_execute_sql --query "SELECT COUNT(*) FROM plans"
webdev_execute_sql --query "SELECT COUNT(*) FROM tools"
```

Resultado esperado:
- plans: 4
- tools: 15

### Problema 4: Erros de TypeScript

**Erro:** "Type error" ou "Cannot find module"

**Solução:**

Peça ao agente:

```
Por favor, reinstale as dependências:

cd /home/ubuntu/gnosis-ai
rm -rf node_modules
pnpm install
webdev_restart_server
```

### Problema 5: Toggle Mensal/Anual Não Funciona

**Erro:** Preços não mudam ao clicar no toggle

**Solução:**

Peça ao agente:

```
Por favor, verifique os seguintes arquivos:

1. client/src/pages/Home.tsx - linha 25 (estado billingPeriod)
2. client/src/components/NoCreditsModal.tsx - linha 77 (estado billingPeriod)

Certifique-se de que a função getYearlyPrice está calculando corretamente:
(monthly * 12) * 0.834
```

### Problema 6: Mercado Pago Não Funciona

**Erro:** "Payment failed" ou "Checkout not created"

**Solução:**

Peça ao agente:

```
Verifique se a variável de ambiente MERCADOPAGO_ACCESS_TOKEN está configurada:

1. Abra Management UI → Settings → Secrets
2. Adicione MERCADOPAGO_ACCESS_TOKEN com o token de teste/produção
3. Reinicie o servidor

Nota: Use credenciais de TESTE primeiro para validar o fluxo.
```

---

## 🚀 COMO CONTINUAR O DESENVOLVIMENTO

Após restaurar o projeto com sucesso, você pode continuar o desenvolvimento normalmente.

### Passo 1: Entender o Projeto

Peça ao agente para ler a documentação:

```
Por favor, leia os seguintes arquivos para entender o projeto:

1. BACKUP_DOCUMENTATION.md - Visão geral completa
2. AGENT_TRANSFER_CONTEXT.md - Contexto técnico
3. FILES_MODIFIED.md - Arquivos do projeto
4. todo.md - Tarefas pendentes

Depois, me dê um resumo do que você entendeu sobre o projeto.
```

### Passo 2: Verificar Tarefas Pendentes

Peça ao agente:

```
Por favor, abra o arquivo todo.md e me mostre quais tarefas ainda estão pendentes.
```

### Passo 3: Definir Próximas Ações

Escolha o que fazer a seguir:

**Opção A: Configurar Mercado Pago para Produção**

```
Preciso configurar o Mercado Pago para produção.

1. Já tenho o Access Token: [seu token aqui]
2. Por favor, adicione-o às variáveis de ambiente
3. Teste o fluxo de pagamento em sandbox
```

**Opção B: Adicionar Novas Funcionalidades**

```
Quero adicionar uma nova funcionalidade: [descreva aqui]

Por favor:
1. Adicione esta tarefa ao todo.md
2. Planeje a implementação
3. Implemente a funcionalidade
4. Teste e salve um checkpoint
```

**Opção C: Corrigir Bugs**

```
Encontrei um bug: [descreva o problema]

Por favor:
1. Adicione ao todo.md como bug
2. Investigue a causa
3. Corrija o problema
4. Teste e salve um checkpoint
```

**Opção D: Deploy para Produção**

```
O projeto está pronto para produção.

Por favor:
1. Crie um checkpoint final
2. Me oriente sobre como publicar via Management UI
3. Configure domínio customizado (se necessário)
```

### Passo 4: Salvar Checkpoints Regularmente

**IMPORTANTE:** Sempre que fizer alterações significativas, peça ao agente:

```
Por favor, salve um checkpoint com a descrição:
"[Descreva o que foi feito]"
```

Isso garante que você sempre terá um ponto de restauração.

---

## 📝 TEMPLATE DE MENSAGEM PARA NOVO AGENTE

Copie e cole esta mensagem ao iniciar com um novo agente:

```
Olá! Preciso restaurar e continuar o desenvolvimento do projeto GNOSIS AI.

📦 INFORMAÇÕES DO BACKUP:
- Checkpoint ID: a8de0379
- Checkpoint URL: manus-webdev://a8de0379
- Projeto: Plataforma brasileira de estudos bíblicos com IA
- Status: 100% funcional, pronto para produção

🔄 AÇÕES NECESSÁRIAS:
1. Restaure o checkpoint usando: webdev_rollback_checkpoint com version_id: a8de0379
2. Verifique o status do projeto: webdev_check_status
3. Abra o preview e confirme que está funcionando
4. Leia a documentação que vou enviar a seguir

📄 DOCUMENTAÇÃO:
[anexar BACKUP_DOCUMENTATION.md]
[anexar AGENT_TRANSFER_CONTEXT.md]
[anexar FILES_MODIFIED.md]

Após restaurar, me confirme que tudo está funcionando e me dê um resumo do projeto.
```

---

## 🎯 CHECKLIST FINAL

Antes de considerar a restauração completa, verifique:

### ✅ Restauração Completa

- [ ] Checkpoint restaurado OU ZIP extraído
- [ ] Servidor rodando sem erros
- [ ] Banco de dados populado (4 planos, 15 ferramentas)
- [ ] Home page carrega corretamente
- [ ] Dashboard funciona
- [ ] Modal de upgrade funciona
- [ ] Toggle mensal/anual funciona
- [ ] FAQ carrega
- [ ] Sem erros no console

### ✅ Documentação Lida

- [ ] BACKUP_DOCUMENTATION.md lido
- [ ] AGENT_TRANSFER_CONTEXT.md lido
- [ ] FILES_MODIFIED.md consultado
- [ ] todo.md revisado

### ✅ Agente Preparado

- [ ] Agente entende a estrutura do projeto
- [ ] Agente sabe onde estão os arquivos principais
- [ ] Agente conhece os fluxos de pagamento
- [ ] Agente sabe como salvar checkpoints

### ✅ Pronto para Continuar

- [ ] Tarefas pendentes identificadas
- [ ] Próximos passos definidos
- [ ] Ambiente de desenvolvimento configurado
- [ ] Backup adicional criado (opcional)

---

## 📞 INFORMAÇÕES ADICIONAIS

### Links Úteis

- **Manus Platform:** https://manus.im
- **Suporte Manus:** https://help.manus.im
- **Mercado Pago Developers:** https://www.mercadopago.com.br/developers
- **tRPC Docs:** https://trpc.io
- **Drizzle ORM:** https://orm.drizzle.team

### Comandos Úteis

```bash
# Verificar status do projeto
webdev_check_status

# Reiniciar servidor
webdev_restart_server

# Executar query SQL
webdev_execute_sql --query "SELECT * FROM plans"

# Salvar checkpoint
webdev_save_checkpoint --description "Descrição das mudanças"

# Restaurar checkpoint
webdev_rollback_checkpoint --version_id "a8de0379"

# Aplicar schema do banco
pnpm db:push

# Popular dados iniciais
pnpm db:seed

# Instalar dependências
pnpm install

# Rodar servidor dev
pnpm dev
```

---

## ✅ CONCLUSÃO

Este guia fornece **dois métodos completos** para restaurar o projeto GNOSIS AI:

1. **Método 1 (Checkpoint):** Rápido, automático, recomendado
2. **Método 2 (ZIP):** Manual, para casos de falha do checkpoint

Siga os passos cuidadosamente e verifique cada item da checklist. Se encontrar problemas, consulte a seção de Solução de Problemas.

**Boa sorte com o desenvolvimento! 🚀**

---

**Criado em:** 28/10/2025 22:40 GMT-3  
**Versão:** 1.0 - Completo  
**Checkpoint:** a8de0379  
**Autor:** Manus AI Agent

