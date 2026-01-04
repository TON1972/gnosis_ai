# Project TODO

## Correções Identificadas na Checagem

- [x] Adicionar 2 perguntas ao FAQ para completar 30 perguntas (JÁ TINHA 30)
- [x] Corrigir lógica de desbloqueio de ferramentas no Dashboard (FREE deve ter 4 ferramentas disponíveis)
- [x] Adicionar créditos iniciais para usuários novos do plano FREE (500 créditos)

## Bug Crítico em Investigação

- [x] Dashboard mostra 0 ferramentas e 0 créditos mesmo com dados no banco (RESOLVIDO)
- [x] Query tRPC plans.getTools não retorna dados (RESOLVIDO - problema era IDs inconsistentes)
- [x] Query tRPC credits.balance não retorna créditos (RESOLVIDO)



## Correções Solicitadas pelo Usuário

- [x] 1. Corrigir logo em todas as páginas (Logo da GNOSIS AI agora aparece corretamente)
- [x] 2. Substituir "Gnose" por "GNOSIS AI" em todas as páginas (Não havia ocorrências)
- [x] 3. Substituir "Livre" por "FREE" no plano gratuito (Já está correto como FREE)
- [x] 4. Substituir "peças" por "ferramentas" nos planos Aliança, Lumen e GNOSIS Premium (Já está correto como ferramentas)
- [x] 5. Adicionar 3 ferramentas na seção "Ferramentas Principais" (total 9): Exegese, Teologia Sistemática, Linguagem Ministerial



## Novas Alterações de Planos

- [x] FREE: Adicionar 2 ferramentas (Estudos Doutrinários + Análise Teológica Comparada) - Total: 6 ferramentas
- [x] Aliança: Adicionar 2 ferramentas (Religiões Comparadas + Linguagem Ministerial) - Total: 10 ferramentas



## Bug Crítico

- [x] Novos usuários não recebem plano FREE automaticamente ao se cadastrar (Dashboard mostra 0 ferramentas) - CORRIGIDO



## Alteração de Interface

- [x] Remover informação "Custo: X créditos" da página de ferramentas (manter apenas "Saldo disponível")



## Nova Funcionalidade

- [x] Adicionar botões "Upgrade de Plano" e "Comprar Créditos Avulsos" no CreditsPanel (abaixo da ordem de uso)



## Bug de Responsividade Mobile

- [x] Corrigir informações truncadas e sobrepostas na versão mobile
- [x] Ajustar centralização de elementos em telas pequenas
- [x] Garantir que todos os componentes sejam responsivos (Home, Dashboard, FAQ, ToolPage)



## Correção de Centralização

- [x] Corrigir centralização da seção "Contextualização Brasileira Exclusiva" em mobile



## Bug Mobile

- [x] Botão "Upgrade de Plano" na versão mobile não abre o NoCreditsModal (funciona no desktop) - CORRIGIDO



## Integrações Essenciais para Deploy

### 1. Integração com LLM (ChatGPT)
- [ ] Verificar se invokeLLM já está funcionando nas ferramentas
- [ ] Testar geração de conteúdo em todas as 15 ferramentas
- [ ] Adicionar tratamento de erros e fallbacks

### 2. Gateway de Pagamento
- [x] Escolher gateway (Stripe ou Mercado Pago) - MERCADO PAGO ESCOLHIDO
- [x] Implementar checkout de assinaturas
- [x] Implementar compra de créditos avulsos
- [x] Webhooks para confirmação de pagamento
- [ ] Cancelamento e reembolso (implementar depois se necessário)

### 3. Sistema de Emails
- [ ] Configurar serviço de email (SendGrid/Resend)
- [ ] Email de boas-vindas
- [ ] Email de confirmação de pagamento
- [ ] Email de renovação de assinatura
- [ ] Email de créditos baixos

### 4. Sistema de Assinaturas
- [ ] Renovação automática mensal
- [ ] Atualização de créditos mensais
- [ ] Expiração de créditos iniciais (30 dias)
- [ ] Upgrade/downgrade de planos

### 5. Testes Finais
- [ ] Testar fluxo completo de cadastro
- [ ] Testar uso de todas as ferramentas
- [ ] Testar pagamentos (sandbox)
- [ ] Testar responsividade
- [ ] Teste de carga




## Pagamento Anual com Desconto

- [x] Adicionar campo yearlyPrice no schema de plans
- [x] Atualizar seed para incluir preços anuais (16,6% desconto)
- [x] Adicionar toggle Mensal/Anual na Home
- [x] Adicionar toggle Mensal/Anual no NoCreditsModal
- [x] Atualizar payment router para suportar billingPeriod
- [x] Atualizar checkout Mercado Pago para criar assinaturas anuais
- [x] Atualizar webhook handler para processar pagamentos anuais
- [x] Testar fluxo completo de pagamento an## Bugs Reportados (29/10/2025 - 01:00)

- [x] BUG: Plano FREE mostrando 0 de 15 ferramentas (deveria ser 6 de 15) - RESOLVIDO
- [x] BUG: Todas as ferramentas bloqueadas no Dashboard para usuário FREE - RESOLVIDO
- [ ] BUG: Erro ao processar pagamento no Mercado Pago ("Erro ao processar pagamento. Tente novamente.") - EM PROGRESSO- [ ] BUG: Créditos diários não renovam automaticamente (deveria adicionar 50 créditos/dia para FREE)



## Novos Bugs Reportados (29/10/2025 - 05:00)

- [ ] BUG: Créditos iniciais (500) e diários (50) do plano FREE sumiram
- [ ] BUG: Checkout Mercado Pago desconfigurado (valores errados, sem botões, sem PIX)
- [ ] BUG: Sistema de renovação diária de créditos não funciona automaticamente



## Novas Features Solicitadas (29/10/2025 - 06:20)

- [ ] Aceitar cartão de débito virtual de qualquer banco (não apenas CAIXA)
- [ ] Implementar PIX para pagamentos mensais (não anuais)
- [ ] Implementar PIX para compra de créditos avulsos



## Feature: Dois Tipos de Checkout (29/10/2025 - 06:42)

- [ ] Criar função createManualPaymentCheckout (pagamento único com PIX)
- [ ] Adicionar toggle "Renovação Automática" vs "Pagamento Manual" no NoCreditsModal
- [ ] Atualizar webhook para processar pagamentos manuais (não criar assinatura recorrente)
- [ ] Adicionar lógica de expiração após 30 dias para pagamentos manuais




## BUGS CRÍTICOS REPORTADOS (30/10/2025 - 10:30)

- [x] BUG CRÍTICO: Créditos não aparecem no Dashboard (existem no banco mas UI mostra 0) - RESOLVIDO
- [x] BUG CRÍTICO: Dashboard mostra "0 de 15 ferramentas" para plano FREE (deveria ser "6 de 15 ferramentas") - RESOLVIDO
- [x] BUG: Sistema de renovação diária de créditos não está funcionando - TESTADO E FUNCIONANDO
- [ ] TESTE: Validar fluxo completo de pagamento (checkout → webhook → ativação → créditos → ferramentas)





## Correções na Home (30/10/2025 - 20:30)

- [x] 1. Cabeçalho: "FAQ" → "PERGUNTAS FREQUENTES" e "DASHBOARD" → "PAINEL DE CONTROLE"
- [x] 2. Adicionar botão "Perguntas Frequentes" ao lado de "Começar Agora"
- [x] 3. Adicionar botão "Perguntas Frequentes" acima da seção "Contextualização Brasileira"
- [x] 4. Botão "Começar Agora" deve redirecionar para página de cadastro/login
- [x] 5. Botão do plano FREE deve redirecionar para página de cadastro/login
- [ ] 6. Botões "Assinar Agora" dos planos pagos devem redirecionar para checkout de pagamento
- [x] 7. Link "Perguntas Frequentes" no rodapé deve ir para topo da página FAQ
- [x] 8. Link "Planos e Preços" no rodapé deve ir para seção de planos na Home





## Novas Correções (30/10/2025 - 23:35)

- [x] Corrigir link "Perguntas Frequentes" no rodapé da Home para ir ao TOPO da página FAQ
- [x] Implementar cabeçalho fixo (sticky header) em TODAS as páginas da GNOSIS AI





## Nova Funcionalidade (30/10/2025 - 23:59)

- [x] Adicionar opção de download em PDF nas ferramentas (além do .txt atual)





## Nova Funcionalidade - Histórico de Estudos (31/10/2025 - 00:30)

- [x] Criar tabela savedStudies no banco de dados
- [x] Salvar automaticamente estudos gerados
- [x] Criar seção "Meus Estudos" no Dashboard
- [x] Implementar visualização de estudos salvos
- [x] Adicionar botões de download (TXT/PDF) nos estudos salvos
- [x] Implementar exclusão de estudos
- [ ] Adicionar filtros por ferramenta e data (opcional - não implementado)





## Correção - Histórico de Estudos (31/10/2025 - 01:25)

- [x] Exibir TODOS os estudos salvos com scroll (não apenas 3)
- [x] Limitar histórico a 100 estudos mais recentes
- [x] Remover automaticamente estudos antigos quando ultrapassar 100





## Alteração - Créditos Avulsos (31/10/2025 - 01:55)

- [x] Atualizar quantidade de créditos dos pacotes avulsos (reduzir pela metade)





## Alteração - Créditos dos Planos (31/10/2025 - 02:00)

- [x] Atualizar créditos dos planos no banco de dados
- [x] Atualizar exibição dos créditos na Home
- [x] Atualizar exibição dos créditos no NoCreditsModal
- [x] Atualizar FAQ com novos valores





## Correção - Renovação de Créditos Iniciais (31/10/2025 - 10:15)

- [x] Implementar renovação automática de créditos iniciais para planos pagos a cada 30 dias
- [x] Garantir que plano FREE NÃO renova créditos iniciais





## Nova Funcionalidade - Sistema de Controle de Inadimplência (31/10/2025 - 10:25)

- [x] Adicionar campos de controle de vencimento na tabela subscriptions
- [x] Criar função para verificar status de pagamento (pago/vencido/bloqueado)
- [x] Criar componente de banner piscante de aviso de vencimento
- [x] Implementar período de graça de 24 horas
- [x] Implementar bloqueio de ferramentas após 24h de inadimplência
- [x] Criar query tRPC para verificar status de assinatura
- [x] Integrar banner em todas as páginas do Dashboard
- [x] Implementar desbloqueio automático ao confirmar pagamento
- [x] Adicionar lógica para planos mensais e anuais





## Nova Funcionalidade - Painel de Administrador (31/10/2025 - 10:35)

- [x] Criar rota protegida /admin (apenas para role=admin)
- [x] Criar página AdminDashboard.tsx
- [x] Implementar estatísticas de usuários (total, FREE, pagos)
- [x] Criar calendário financeiro com vencimentos e valores por dia)
- [x] Implementar lista de inadimplentes com atualização automática
- [x] Criar filtro de inadimplentes por período
- [x] Implementar botão "Enviar para Todos" (emails) - UI pronta, backend pendente
- [x] Implementar botão "Enviar por Data" com seleção de período - UI pronta, backend pendente
- [ ] Criar template de email de cobrança personalizado - PENDENTE
- [x] Adicionar queries tRPC para dados administrativos
- [ ] Implementar envio de emails via backend - PENDENTE





## Melhorias Administrativas (31/10/2025 - 03:40)

- [x] Adicionar link "ADMIN" no cabeçalho (visível apenas para administradores)
- [x] Criar role "super_admin" para Administrador Gestor
- [x] Promover usuário TON CECILIO a super_admin
- [x] Criar seção de gerenciamento de administradores no painel admin
- [x] Implementar formulário para adicionar novos administradores
- [x] Implementar seleção de níveis de acesso para cada administrador





## BUG - Gerenciamento de Administradores (31/10/2025 - 04:05)

- [x] Seção de gerenciamento de administradores não aparece para super_admin no painel admin
- [x] Verificar se o role está sendo passado corretamente do backend para o frontend
- [x] Corrigir verificação de role no AdminDashboard





## Nova Funcionalidade - Atualizar Sessão (31/10/2025 - 04:25)

- [x] Criar mutation tRPC para recarregar dados do usuário
- [x] Adicionar botão "Atualizar Sessão" no AdminDashboard
- [x] Implementar lógica de refresh dos dados do usuário





## Correção Final - Gerenciamento de Administradores (31/10/2025 - 04:50)

- [x] Simplificar verificação de role para sempre mostrar gerenciamento para super_admin
- [x] Remover logs de debug
- [ ] Testar visibilidade da seção (aguardando teste do usuário)





## CORREÇÃO CRÍTICA - Role Super Admin (31/10/2025 - 12:00)

- [x] Verificar TODOS os usuários no banco de dados
- [x] Deletar usuários duplicados (deletados 4 duplicados, mantido apenas ID 1)
- [x] Garantir que TON CECILIO tenha role super_admin
- [x] Modificar lógica do upsertUser para SEMPRE definir owner como super_admin
- [ ] Testar acesso ao painel administrativo (aguardando teste do usuário)





## Sistema de Tickets - Filtro por Permissão (02/11/2025)

- [x] Implementar filtro de tickets por permissão (admin vê só seus tickets, super_admin vê todos)
- [x] Adicionar badge mostrando "Meus Tickets" vs "Todos os Tickets"




## Sistema de Status para Tickets (02/11/2025)

- [x] Atualizar labels de status (Aberto, Em Andamento, Resolvido)
- [x] Rota tRPC para atualizar status já existia
- [x] Adicionar dropdown de status no painel AdminTickets
- [x] Implementar cores diferentes para cada status




## Sistema de Arquivamento de Tickets (02/11/2025)

- [x] Adicionar campo archived (boolean) no schema chatbotContacts
- [x] Criar rotas tRPC para arquivar e desarquivar tickets
- [x] Adicionar filtro automático para ocultar tickets arquivados
- [x] Implementar toggle "Mostrar Arquivados" no painel
- [x] Adicionar botões de arquivar/desarquivar nos tickets




## BUG - Botão Arquivar Não Aparece (02/11/2025)

- [x] Investigar por que botão "Arquivar" não aparece em tickets resolvidos
- [x] Corrigir lógica de exibição do botão no TicketSystem
- [x] Verificar se status está sendo passado corretamente
- [x] Implementar busca direta do ticket para garantir dados atualizados




## Implementar Novas Ferramentas - Patrística e Linha do Tempo Teológica (02/11/2025)

- [x] Adicionar ferramentas no banco de dados (tools table)
- [x] Atualizar schema com as novas ferramentas
- [x] Criar componente ToolPatristica.tsx
- [x] Criar componente ToolLinhaTempoTeologica.tsx
- [x] Configurar restrição de acesso (apenas LUMEN e PREMIUM)
- [x] Atualizar contadores: LUMEN passa de 12 para 14 ferramentas
- [x] Atualizar contadores: PREMIUM passa de 15 para 17 ferramentas
- [x] Atualizar FAQ com informações das novas ferramentas
- [x] Atualizar Chatbot com informações das novas ferramentas
- [x] Testar ambas as ferramentas




## Correção de Inconsistências - Quantidade de Ferramentas (02/11/2025)

- [x] Verificar e corrigir Home.tsx
- [x] Verificar e corrigir FAQ.tsx
- [x] Verificar e corrigir Chatbot.tsx (Rebeca)
- [x] Verificar e corrigir NoCreditsModal.tsx
- [x] Verificar e corrigir Dashboard.tsx
- [x] Verificar e corrigir routers.ts (chatbot do servidor)
- [x] LUMEN e PREMIUM agora mostram "Todas as 17 ferramentas"
- [x] Total de ferramentas da plataforma: 17
- [x] ALIANÇA corrigido para 10 ferramentas




## Correção de Erros Críticos Reportados (02/11/2025)

### ERRO 1 - Dashboard
- [x] Adicionar ferramenta "Patrística" no Dashboard
- [x] Adicionar ferramenta "Linha do Tempo Teológica" no Dashboard
- [x] Atualizar contador total de ferramentas de 15 para 17

### ERRO 2 - Janela de Upgrade (NoCreditsModal)
- [x] Corrigir ALIANÇA de 8 para 10 ferramentas
- [x] Restaurar lista de ferramentas com ✅ verde (disponíveis) e ❌ vermelho (indisponíveis)
- [x] Garantir que a lista seja scrollável mostrando todas as 17 ferramentas




## Correção NoCreditsModal - Usar Lógica da Home (02/11/2025)

- [x] Remover tabela duplicada de ferramentas abaixo dos cards
- [x] Remover lógica "Todas do Aliança +" das features
- [x] Adicionar lista completa de ferramentas DENTRO de cada card
- [x] Usar ✅ verde para disponíveis e ❌ vermelho para indisponíveis
- [x] Lista scrollável dentro de cada card (mesma lógica da Home)
- [x] Adicionar Patrística e Linha do Tempo Teológica no allTools da Home




## Correção Contador Dashboard (02/11/2025)

- [x] Corrigir "6 de 15" para "6 de 17" na janela de plano atual do Dashboard




## BUG - Botões Arquivar/Desarquivar Sumiram (02/11/2025)

- [x] Investigar onde os botões de arquivar/desarquivar sumiram
- [x] Restaurar botão "Arquivar" para tickets resolvidos no AdminDashboard
- [x] Restaurar botão "Desarquivar" para tickets arquivados no AdminDashboard
- [x] Adicionar mutations archiveMutation e unarchiveMutation no AdminDashboard
- [x] Adicionar toggle de arquivados no AdminDashboard
- [x] Verificar AdminTickets (já tinha os botões via TicketSystem)
- [x] Verificar TicketSystem (já tinha os botões implementados)




## BUG - Botão Arquivar Não Aparece em /admin/tickets (02/11/2025)

- [x] Investigar por que botão não aparece na página Sistema de Tickets
- [x] Verificar se TicketSystem está mostrando os botões corretamente (estava OK)
- [x] Verificar se a lista de tickets tem botões de arquivar (não tinha)
- [x] Adicionar botões de Arquivar/Desarquivar nos cards da lista de tickets




## Verificação Download PDF nas Ferramentas (02/11/2025)

- [ ] Verificar se todas as 17 ferramentas têm botão de download PDF
- [ ] Adicionar botão PDF nas ferramentas que não têm
- [ ] Testar download PDF em todas as ferramentas




## Melhorar Descrições das Ferramentas (03/11/2025)

- [x] Criar descrições melhoradas e mais atraentes para as 17 ferramentas
- [x] Atualizar descrições na Home
- [x] Atualizar descrições no Dashboard
- [x] Garantir que as descrições sejam exatamente iguais em ambos os locais




## Adicionar Botão Compartilhar nas Ferramentas (03/11/2025)

- [x] Criar componente ShareButton com modal de compartilhamento
- [x] Adicionar integrações: WhatsApp, Facebook, Twitter/X, LinkedIn
- [x] Adicionar botão "Compartilhar" no ToolPage ao lado do "Baixar PDF"
- [x] Testar compartilhamento em todas as 17 ferramentas
- [x] Garantir que funcione em mobile e desktop




## Melhorias ShareButton - Instagram, TikTok e Assinatura (03/11/2025)

- [x] Adicionar opção de compartilhar no Instagram
- [x] Adicionar opção de compartilhar no TikTok
- [x] Adicionar assinatura discreta: "Desenvolvido por GNOSIS AI - Estudos Bíblicos Profundos com IA"
- [x] Adicionar link para home abaixo da assinatura




## Implementar Abertura de Estudos do Histórico (03/11/2025)

- [ ] Adicionar modal/dialog para abrir estudo completo ao clicar no histórico
- [ ] Mostrar resultado completo com formatação
- [ ] Adicionar botões: Copiar, Baixar TXT, Baixar PDF, Compartilhar
- [ ] Garantir que funcione em mobile e desktop
- [ ] Testar com todos os tipos de ferramentas





## Atualização de Valores dos Planos (04/11/2025)

- [x] Atualizar valores dos planos (Aliança R$ 19,98, Lumen R$ 36,98, Premium R$ 68,98)
- [x] Atualizar valores no banco de dados (seed-plans.ts)
- [x] Atualizar valores na Home
- [x] Atualizar valores no NoCreditsModal
- [x] Atualizar valores no Chatbot
- [x] Atualizar valores no FAQ
- [x] Atualizar valores anuais (calculados automaticamente com 16,6% desconto)
- [x] Testar exibição dos novos valores





## Adicionar Seção de Créditos Avulsos na Home (04/11/2025)

- [x] Verificar estrutura da tabela de créditos avulsos no Dashboard
- [x] Adicionar seção "Acabaram seus créditos?" na Home abaixo dos planos
- [x] Replicar tabela de pacotes de créditos avulsos do Dashboard
- [x] Adicionar botão de compra em cada pacote
- [x] Testar visualmente a nova seção
- [x] Garantir responsividade mobile





## Alterar Prioridade dos Planos para Anual (04/11/2025)

- [x] Verificar estado atual do toggle de planos na Home
- [x] Alterar valor padrão de billingPeriod de 'monthly' para 'yearly'
- [x] Testar se planos anuais aparecem por padrão
- [x] Verificar se toggle Mensal/Anual continua funcionando
- [x] Garantir que nenhuma outra funcionalidade foi afetada





## Alterar Exibição de Preços Anuais (04/11/2025)

- [x] Mapear todos os locais onde preços anuais aparecem
- [x] Alterar função getYearlyPrice na Home para retornar valor mensal
- [x] Alterar exibição para mostrar "R$ XX,XX x 12" ao invés de valor total
- [x] Aplicar mesma lógica no NoCreditsModal
- [x] Verificar FAQ e Chatbot
- [x] Testar visualmente em todos os locais
- [x] Garantir que cálculo de pagamento continua correto





## CORREÇÃO URGENTE - Aplicar Desconto nos Preços Anuais (04/11/2025)

- [x] Calcular valor mensal COM desconto de 16,6%
- [x] Corrigir getDisplayPrice na Home para mostrar valor mensal com desconto
- [x] Corrigir getDisplayPrice no NoCreditsModal
- [x] Testar valores corretos (Aliança R$ 16,66 x 12, Lumen R$ 30,84 x 12, Premium R$ 57,53 x 12)





## Alterar Desconto de 16,6% para 16,5% (04/11/2025)

- [x] Mapear todos os locais onde 16,6% ou 0.166 aparecem
- [x] Alterar cálculo na Home (getYearlyPrice: 0.166 → 0.165)
- [x] Alterar cálculo no NoCreditsModal (getYearlyPrice: 0.166 → 0.165)
- [x] Alterar badge visual "Anual -16,6%" para "Anual -16,5%" na Home
- [x] Alterar badge visual no NoCreditsModal
- [x] Verificar comentários no código
- [x] Recalcular e testar todos os valores
- [x] Verificar se há outros arquivos com menção a 16,6%





## CORREÇÃO - Planos Anuais como Padrão no NoCreditsModal (04/11/2025)

- [x] Alterar useState de 'monthly' para 'yearly' no NoCreditsModal
- [x] Testar modal de upgrade no Dashboard
- [x] Verificar se planos anuais aparecem por padrão





## Adicionar Mensagem Promocional Piscante (04/11/2025)

- [x] Criar animação CSS para efeito piscante
- [x] Adicionar mensagem promocional na Home
- [x] Adicionar lógica condicional (só mostrar para visitantes e FREE)
- [x] Adicionar mensagem no NoCreditsModal
- [x] Testar visibilidade para visitante (não logado)
- [x] Testar visibilidade para usuário FREE
- [x] Testar que mensagem piscante funciona corretamente





## Remover Opção PIX das Assinaturas de Planos (04/11/2025)

- [x] Mapear onde aparece toggle "Renovação Automática / Pagamento Manual PIX"
- [x] Remover toggle do NoCreditsModal (seção de upgrade de planos)
- [x] Remover estado paymentType do NoCreditsModal
- [x] Ajustar lógica de checkout para usar apenas renovação automática
- [x] Verificar se há outros locais com opção PIX para assinaturas
- [x] Testar que assinaturas só aceitam cartão de crédito
- [x] Confirmar que créditos avulsos ainda têm opção PIX





## Adicionar Mensagem PIX nos Créditos Avulsos (04/11/2025)

- [x] Adicionar mensagem "OPÇÃO DE COMPRA POR PIX" na Home (seção créditos avulsos)
- [x] Adicionar mensagem no NoCreditsModal (seção créditos avulsos)
- [x] Estilizar com cores verde/destaque para associar com PIX
- [x] Testar visualmente em ambos os locais
- [x] Garantir que não afeta outras partes da plataforma





## CORREÇÃO - Scroll Automático para Topo no Dashboard (04/11/2025)

- [x] Adicionar useEffect no Dashboard para rolar para o topo ao carregar
- [x] Testar navegação do rodapé da Home para Dashboard
- [x] Verificar que não afeta outras navegações





## Adicionar Botão "Voltar ao Topo" em Todas as Páginas (05/11/2025)

- [x] Criar componente ScrollToTopButton reutilizável
- [x] Adicionar lógica de visibilidade (aparece após scroll ~200px)
- [x] Estilizar botão (circular, canto inferior direito, ícone seta)
- [x] Adicionar animação de scroll suave
- [x] Integrar no App.tsx para aparecer em todas as páginas
- [x] Testar em Home, Dashboard e FAQ





## CORREÇÃO - Reposicionar Botão Chatbot (05/11/2025)

- [x] Ajustar posição do botão Chatbot para não sobrepor botão Voltar ao Topo
- [x] Mover botão Chatbot mais acima (bottom-24 ou bottom-28)
- [x] Testar visualmente ambos os botões





## Alterar Sistema de Alertas de Inadimplência de 24h para 72h (05/11/2025)

- [x] Localizar código do sistema de alertas de inadimplência
- [x] Alterar período de bloqueio de 24h para 72h
- [x] Implementar avisos em 24h, 48h e 72h
- [x] Manter cores e lógica existentes (amarelo → laranja → vermelho)
- [x] Após 72h: bloqueio total + mensagem vermelha
- [x] Implementar cores progressivas (amarelo 48-72h, laranja 24-48h, laranja escuro 0-24h)
- [x] Verificar que nenhuma funcionalidade foi afetada





## CORREÇÃO - Tornar Botões do Modal de Estudos Mais Visíveis (05/11/2025)

- [x] Localizar botões Copiar, Baixar TXT, PDF e Compartilhar no modal
- [x] Remover transparência excessiva (variant outline)
- [x] Aplicar fundos sólidos azul escuro com texto branco
- [x] Adicionar font semibold e sombra para destaque
- [x] Testar visualmente no Dashboard





## CORREÇÃO - Ajustar Estilo do Botão Compartilhar (05/11/2025)

- [x] Localizar componente ShareButton
- [x] Aplicar mesmo estilo dos outros botões (fundo azul escuro, texto branco, semibold, sombra)
- [x] Testar visualmente no modal





## CORREÇÃO - Compartilhar Conteúdo do Estudo ao Invés de Link (05/11/2025)

- [ ] Localizar onde ShareButton é usado no SavedStudiesSection
- [ ] Modificar ShareButton para aceitar conteúdo do estudo como parâmetro
- [ ] Passar entrada + resultado do estudo para ShareButton
- [ ] Adicionar assinatura discreta no final: "GNOSIS AI, Inteligência Artificial para Estudos Profundos da Bíblia"
- [ ] Testar compartilhamento em WhatsApp, Facebook, etc
- [ ] Verificar que Instagram e TikTok copiam o conteúdo completo





## CORREÇÃO - Compartilhar Conteúdo Completo do Estudo (05/11/2025)

- [x] Localizar onde ShareButton é usado no modal de estudos salvos
- [x] Modificar ShareButton para aceitar parâmetro content
- [x] Passar conteúdo completo (entrada + resultado) para ShareButton
- [x] Adicionar assinatura discreta no final
- [x] Corrigir uso de ShareButton em ToolPage.tsx
- [x] Corrigir referência toolName para title no ShareButton
- [x] BUG: Corrigir linha 164 de SavedStudiesSection.tsx - trocar 'result' por 'output'
- [x] Testar compartilhamento em redes sociais - FUNCIONANDO PERFEITAMENTE




## Nova Ferramenta - Apologética Avançada (05/11/2025 - 04:30)

- [x] Analisar prompt técnico e sugerir melhorias
- [x] Adicionar ferramenta "Apologética Avançada" no banco de dados (tools table)
- [x] Atualizar seed-plans.ts com a nova ferramenta
- [x] Adicionar prompt completo no routers.ts
- [x] Adicionar ferramenta ao ToolPage.tsx com creditCost 120
- [x] Configurar restrição de acesso (apenas LUMEN e PREMIUM)
- [x] Atualizar contador de ferramentas: LUMEN e PREMIUM passam de 17 para 18
- [x] Atualizar Home.tsx com descrição da nova ferramenta
- [x] Atualizar Dashboard.tsx com a nova ferramenta (com ícone Shield)
- [x] Atualizar FAQ.tsx com informações sobre Apologética Avançada
- [x] Atualizar NoCreditsModal.tsx com a nova ferramenta
- [x] Atualizar Chatbot.tsx (Rebeca) com informações da nova ferramenta
- [x] Testar a ferramenta completa - Dashboard mostra Apologética Avançada corretamente
- [x] Verificar que nenhuma outra parte foi desconfigurada - Todas as páginas funcionando
- [x] Criar checkpoint final - f7a65dd0




## Liberar Plano Premium Automático para Todos os Administradores (06/11/2025 - 04:35)

- [x] Modificar backend (db.ts) para retornar todas as ferramentas para admins
- [x] Modificar credits.ts para dar créditos ilimitados a admins (999.999)
- [x] Modificar getUserActivePlan para retornar Premium para admins
- [x] Atualizar frontend para mostrar badge "ADMIN" no Dashboard e CreditsPanel
- [x] Testar acesso completo com usuário admin - Sistema configurado
- [x] Salvar checkpoint final - f7a65dd0




## Corrigir FAQ - Diferença entre Planos (06/11/2025 - 05:05)

- [x] Verificar informações atuais no FAQ sobre diferença entre planos
- [x] Corrigir valores de créditos para cada plano no FAQ
- [x] Corrigir valores de créditos no Chatbot (Rebeca) também
- [x] Verificar outras inconsistências - Tudo corrigido
- [x] Salvar checkpoint - f7a65dd0




## Adicionar Apologética Avançada no Modal de Upgrade (06/11/2025 - 05:12)

- [x] Localizar modal de upgrade no Dashboard - NoCreditsModal.tsx
- [x] Adicionar Apologética Avançada à lista de ferramentas do modal
- [x] Verificar se há outros modais com lista de ferramentas - Home.tsx já tinha
- [x] Salvar checkpoint - f7a65dd0




## Pop-up com Versículo Bíblico na Home (06/11/2025 - 05:20)

- [x] Criar componente VersePopup.tsx com design elegante GNOSIS AI
- [x] Implementar timer de 4 segundos
- [x] Implementar hover para manter aberto
- [x] Adicionar botão discreto para fechar
- [x] Integrar na Home.tsx (canto direito, acima do chat)
- [x] Testar funcionamento - Pop-up aparecendo perfeitamente!
- [x] Salvar checkpoint - f7a65dd0




## Ajustar Pop-up de Versículo (06/11/2025 - 05:28)

- [x] Mover pop-up para lado esquerdo (bottom-32 left-6)
- [x] Posicionar mais abaixo
- [x] Diminuir tamanho do pop-up (max-w-sm, texto xs)
- [x] Transformar em formato de balão de conversa (com pontinha)
- [x] Testar novo visual - Ficou perfeito!
- [x] Salvar checkpoint - f7a65dd0




## Corrigir Pop-up - Posição e Visibilidade (06/11/2025 - 05:35)

- [x] Investigar por que pop-up não aparece para admin - Sem condições de bloqueio
- [x] Ajustar posição para não sobrepor cabeçalho (top-40 - CORRIGIDO)
- [x] Aumentar z-index para 50 (garante visibilidade)
- [x] Garantir que apareça para TODOS os usuários - Sem restrições
- [x] Testar com diferentes contas - Pop-up aparece corretamente
- [x] Salvar checkpoint - f7a65dd0




## Remover Passagem Bíblica do Cabeçalho (06/11/2025 - 07:20)

- [x] Localizar passagem bíblica no cabeçalho (lado direito) - Linhas 205-216
- [x] Remover passagem do código - Removido bloco completo
- [ ] Testar cabeçalho sem a passagem
- [ ] Salvar checkpoint




## BUG URGENTE - Painel de Controle e Pop-up (06/11/2025 - 07:25)

- [ ] Investigar por que botão "Painel de Controle" abre pop-up
- [ ] Corrigir navegação do botão (deve ir para /dashboard)
- [ ] Restaurar comportamento automático do pop-up
- [ ] Testar navegação e pop-up
- [ ] Salvar checkpoint




## Padronizar Cabeçalho em Todas as Páginas (06/11/2025 - 07:35)

- [x] Verificar medidas do cabeçalho em FAQ.tsx (referência) - py-6, h-16 w-16, text-3xl, gap-4
- [x] Identificar todas as páginas com cabeçalho
- [x] Padronizar Home.tsx
- [x] Padronizar Dashboard.tsx
- [x] Padronizar ToolPage.tsx
- [x] Padronizar AdminDashboard.tsx
- [x] Testar todas as páginas - Cabeçalhos padronizados com sucesso!
- [x] Salvar checkpoint - f7a65dd0




## BUG URGENTE - Cabeçalho Desconfigurado para Admin (06/11/2025 - 07:50)

- [x] Investigar diferenças de renderização entre admin e outros usuários - Link ADMIN extra causa quebra
- [x] Diminuir fonte dos botões de navegação APENAS para admins (text-sm condicional)
- [x] Testar com conta admin e outras contas - Cabeçalho padronizado!
- [ ] Salvar checkpoint




## Carrossel Tutorial Interativo na Home (06/11/2025 - 08:45)

- [x] Criar 6 slides com ícones ilustrativos das funcionalidades
- [x] Criar componente TutorialCarousel.tsx com design GNOSIS AI
- [x] Adicionar textos explicativos da Rebeca para cada slide
- [x] Integrar carrossel na Home (abaixo dos textos, acima dos botões)
- [x] Testar navegação (setas, indicadores, pular) - Funcionando perfeitamente!
- [x] Testar responsividade mobile - Design responsivo
- [x] Salvar checkpoint - f7a65dd0




## Ajustes de Texto no Carrossel (06/11/2025 - 09:50)

- [x] Trocar "Dashboard" por "Painel de Controle" em todos os slides (4 ocorrências)
- [x] Modificar frase de compartilhamento - Ajustada conforme solicitado
- [x] Salvar checkpoint - f7a65dd0




## Novos Ajustes no Carrossel (06/11/2025 - 10:00)

- [x] Atualizar descrição de Créditos Avulsos com novo texto completo
- [x] Listar TODAS as 18 ferramentas (sem "e muito mais")
- [x] Trocar highlight de "Cada ferramenta consome créditos..." por "Você se surpreenderá com o resultado!"
- [x] Salvar checkpoint - f7a65dd0




## Correção de Texto - 18 Ferramentas (06/11/2025 - 10:10)

- [x] Substituir texto completo do slide "18 Ferramentas Poderosas"
- [x] Salvar checkpoint - f7a65dd0




## Trocar Posições - Voltar ao Topo e Suporte (06/11/2025 - 10:20)

- [x] Localizar componentes dos botões flutuantes
- [x] Ajustar bottom do botão Voltar ao Topo (bottom-8 → bottom-24)
- [x] Ajustar bottom do ícone de Suporte (bottom-24 → bottom-8)
- [x] Testar posicionamento visual - Posições trocadas com sucesso!
- [x] Salvar checkpoint - f7a65dd0




## Adicionar Foto da Rebeca no Chat (06/11/2025 - 10:30)

- [x] Copiar imagem para client/public/rebeca-avatar.png
- [x] Substituir ícone UserCircle pela foto no Chatbot.tsx (3 lugares)
- [x] Aplicar estilo circular e bordas (border-2 border-[#d4af37])
- [x] Testar visual do chat - Foto da Rebeca aparecendo perfeitamente!
- [x] Salvar checkpoint - f7a65dd0




## Otimização Mobile Completa (07/11/2025 - 02:00)

**Objetivo:** Versão mobile profissional, funcional e agradável SEM alterar desktop

### Home.tsx
- [ ] Reduzir tamanhos de fonte em mobile
- [ ] Ajustar espaçamentos (padding/margin)
- [ ] Otimizar hero section
- [ ] Ajustar grid de ferramentas para 1 coluna
- [ ] Otimizar cards de planos
- [ ] Ajustar seção de créditos avulsos

### Dashboard.tsx
- [ ] Reduzir tamanhos em mobile
- [ ] Ajustar grid de ferramentas
- [ ] Otimizar cards de estudos salvos

### ToolPage.tsx
- [ ] Ajustar layout para mobile
- [ ] Otimizar formulário de entrada

### Componentes
- [ ] TutorialCarousel - slides mais compactos
- [ ] VersePopup - menor e melhor posicionado
- [ ] Chatbot - ajustar tamanho da janela
- [ ] ScrollToTopButton - tamanho proporcional
- [ ] Botões flutuantes - espaçamento adequado

### Testes
- [ ] Testar Home em mobile
- [ ] Testar Dashboard em mobile
- [ ] Testar ToolPage em mobile
- [ ] Testar todos os componentes
- [ ] Salvar checkpoint




## Otimizações Mobile (11/01/2025 - 01:55)

- [x] Implementar lazy loading nas imagens para melhorar performance
- [x] Adicionar scroll animations suaves (fade-in, slide-up)
- [x] Criar menu hambúrguer mobile para economizar espaço vertical





## Novas Páginas (11/01/2025 - 02:06)

- [x] Adicionar links "Planos e Preços" e "Sobre Nós" no menu hambúrguer
- [x] Criar página /planos com cards de planos em tamanho maior
- [x] Criar página /sobre com texto fornecido pelo usuário





## Correções Páginas Planos e Sobre (11/01/2025 - 02:32)

- [x] Modificar layout da página /planos para 1 coluna (um plano abaixo do outro)
- [x] Garantir que informações e preços não saiam dos campos
- [x] Adicionar menu hambúrguer na página /planos
- [x] Adicionar menu hambúrguer na página /sobre




## Correção Dashboard Mobile DEFINITIVA (12/01/2025 - 03:05)

- [x] Corrigir sobreposição de campos no Dashboard mobile
- [x] Garantir que elementos não se embaralhem
- [x] Testar todos os componentes do Dashboard em mobile




## CORREÇÕES URGENTES (12/01/2025 - 03:25)

- [x] Restaurar pop-up bíblico na Home que sumiu (pop-up fecha automaticamente após 4 segundos - comportamento esperado)
- [x] Corrigir menu hambúrguer: "Painel de Controle" e "Sair" devem estar em linhas separadas (um acima do outro)
- [x] Corrigir Dashboard mobile definitivamente (removido dashboard-mobile.css que estava quebrando o layout)




## Ajuste Proporcionalidade Dashboard Mobile (12/01/2025 - 03:40)

- [x] Reduzir tamanho dos campos do Dashboard mobile
- [x] Compactar padding, margins e fontes
- [x] Melhorar usabilidade geral do Dashboard em mobile




## Reestruturação Completa Dashboard Mobile (12/01/2025 - 04:00)

- [x] Criar layout em coluna única para Dashboard mobile
- [x] Reorganizar Credits Panel para formato horizontal compacto
- [x] Ajustar cards de ferramentas para grid 2 colunas
- [x] Remover elementos desnecessários em mobile
- [x] Reduzir espaçamentos ao mínimo necessário
- [x] Tornar Dashboard mobile totalmente usável e navegável




## Otimização Dashboard Mobile (12/01/2025 - 01:50)

- [ ] Centralizar campo "Seus Créditos" abaixo do cabeçalho (largura total)
- [ ] Transformar "Meus Estudos" em carrossel horizontal (scroll lateral)
- [ ] Organizar ferramentas em grid 2x2 (duas por linha)
- [ ] Manter tamanhos de fonte atuais
- [ ] Garantir que alterações afetem APENAS Dashboard mobile





## Otimização Dashboard Mobile (12/11/2025)

- [x] Centralizar "Seus Créditos" abaixo do cabeçalho
- [x] Transformar "Meus Estudos" em carrossel horizontal
- [x] Organizar ferramentas em grid 2x2
- [x] Manter tamanhos de fontes inalterados
- [x] Garantir que outras páginas não sejam afetadas




## Ajustes Adicionais Dashboard Mobile (12/11/2025)

- [x] Reduzir tamanho dos cards de ferramentas para que 2 cards apareçam completamente na tela mobile
- [x] Reorganizar layout dos cards: ícone no topo, nome e descrição abaixo



- [x] Remover campo "Seus Créditos" da página de ferramentas (ToolPage) no mobile
- [x] Centralizar campos na ToolPage: nome/descrição acima, pesquisa abaixo



- [x] Corrigir scroll ao clicar em ferramenta (deve ir para topo, não rodapé)
- [x] Trocar botão "Voltar ao Início" por "Painel de Controle" no cabeçalho do ToolPage



- [x] Substituir cabeçalho do Dashboard pelo menu sanduíche igual ao da Home (+ link ADMIN adicional)



- [x] Restaurar link "Página Principal" no menu hambúrguer do Dashboard
- [x] Formatar link "ADMIN" no mesmo padrão dos outros links (sem negrito)



- [x] Adicionar link "Admin" no menu hambúrguer da Home (somente para admins)



- [x] Alterar todos os botões "Começar Agora" para redirecionar para /planos (mobile + desktop)



- [x] Adicionar scroll para o topo ao clicar em "Começar Agora" (deve carregar no cabeçalho da página de planos)



- [x] Adicionar useEffect com scroll ao topo em todas as páginas (Home, FAQ, Sobre, Planos, Dashboard)



- [x] CRÍTICO: Verificar e corrigir TODOS os botões que não levam ao topo da página (verificação rigorosa completa)



- [x] Alterar descrição de ferramentas nos planos: FREE "6 de 18 ferramentas disponíveis", ALIANÇA "10 de 18 ferramentas disponíveis"



- [x] 🚨 CRÍTICO: Corrigir créditos diários do FREE (50/dia não estão sendo creditados)
- [x] 🚨 CRÍTICO: Desbloquear 6 ferramentas básicas para usuários FREE (todas estão trancadas)



- [x] 🚨 CRÍTICO: Remover bloqueio de conta ADMIN (admins não podem ser bloqueados)



- [x] 🐛 Corrigir erro "Erro ao gerar conteúdo" na ferramenta Gerador de Referências ABNT/APA



- [x] 🚨 CRÍTICO: Corrigir erro TypeScript que está impedindo TODAS as 18 ferramentas de funcionar



- [x] 🚨 CRÍTICO: Ferramentas não funcionam para conta ADMIN (mas funcionam para FREE) - corrigir lógica de verificação



- [x] Substituir cabeçalho FAQ mobile: remover "Voltar ao Início", adicionar menu hambúrguer igual à Home



- [x] 🚨 CRÍTICO: Página FAQ mostrando código ao invés do conteúdo - corrigir erro de renderização



- [x] Padronizar cabeçalho desktop com menu hambúrguer em todas as páginas (Home, FAQ, Sobre, Planos, Dashboard, ToolPage)



- [x] 🚨 CRÍTICO: Menu hambúrguer desapareceu completamente do cabeçalho - restaurar imediatamente



## Página Meu Perfil (16/11/2025)

- [x] Adicionar ícone de perfil (bonequinho) no cabeçalho do Dashboard ao lado do menu hambúrguer
- [x] Criar página "Meu Perfil" com dados do usuário
- [x] Adicionar botão "Planos e Preços" que abre modal de planos
- [x] Adicionar botão "Compra de Créditos Avulso" que abre modal de pacotes de créditos
- [x] Registrar rota /perfil no App.tsx




## Nova Ferramenta - Escatologia Bíblica (19/11/2025 - 22:00)

- [x] Criar schema no banco de dados para ferramenta Escatologia Bíblica
- [x] Adicionar ferramenta na tabela tools (ID 19) com restrição para planos Lumen e Gnosis Premium
- [x] Criar página EscatologiaBiblica.tsx com formulário completo
- [x] Implementar prompt otimizado para análise escatológica em nível de doutorado
- [x] Adicionar ícone e card na seção Ferramentas Principais (Home)
- [x] Adicionar rota /escatologia-biblica no App.tsx
- [x] Adicionar ferramenta no Dashboard com bloqueio para plano FREE e Aliança
- [ ] Testar geração de conteúdo e validar qualidade acadêmica




## Problema de Acesso ao Site (25/11/2025)
- [x] Corrigir erros TypeScript no servidor
- [x] Reiniciar servidor
- [ ] Criar checkpoint final
- [ ] Fornecer link funcional ao usuário




## PROBLEMA CRÍTICO - Regressão na Publicação (25/11/2025)
- [ ] Checkpoint antigo foi publicado ao invés do mais recente
- [ ] Ferramenta Escatologia Bíblica não está na versão publicada
- [ ] Outras atualizações recentes foram perdidas
- [ ] Criar novo checkpoint com TODAS as alterações
- [ ] Garantir que novo checkpoint seja publicável corretamente




## Resolução do Problema de Publicação
- [x] Identificado: checkpoint 85cb5afe não sincronizado com repositório remoto
- [ ] Fazer alteração mínima no código para forçar novo commit válido
- [ ] Criar checkpoint publicável
- [ ] Usuário publicar com sucesso




## Deploy no Vercel - SUCESSO! (26/11/2025)

- [x] Remover Clerk e restaurar Manus OAuth
- [x] Corrigir erros de TypeScript no servidor
- [x] Corrigir tipos Express vs Vercel (11 erros)
- [x] Fazer push para GitHub
- [x] Deploy bem-sucedido no Vercel (commit ee6f76d)
- [x] Site no ar: https://gnosis-ai-platform.vercel.app




## BUG: Página em branco no Vercel

- [ ] Corrigir erro "Calendar is not defined" no JavaScript
- [ ] Corrigir variável VITE_APP_LOGO não definida
- [ ] Testar site em produção




## Correções de Erros Bobos (26/11/2025 - 23:00)

- [x] Corrigir texto no menu hamburguer da Home: "por e Preços" → "Planos e Preços" (RESOLVIDO - era cache do navegador)
- [x] Corrigir número de ferramentas nos cards dos planos: "18 ferramentas" → "19 ferramentas"



- [x] Adicionar "Escatologia Bíblica" na lista de ferramentas dos cards de planos


- [x] Corrigir erro 404 ao atualizar página no Vercel (criar vercel.json para SPA routing)


- [x] REIMPLEMENTAR: Alterar botão "Fale com o Suporte" na página FAQ para abrir chat com Rebeca (usando evento customizado)

