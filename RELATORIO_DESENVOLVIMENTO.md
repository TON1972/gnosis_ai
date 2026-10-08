# Relatório de Desenvolvimento — GNOSIS AI

> **Versão para apresentar:** [`RELATORIO_DESENVOLVIMENTO.html`](./RELATORIO_DESENVOLVIMENTO.html) — abra no navegador. Botão **Imprimir / salvar PDF** no topo.

**Produto:** GNOSIS AI — plataforma de estudos bíblicos profundos com inteligência artificial  
**Versão analisada:** 1.0.1  
**Período de desenvolvimento documentado:** outubro de 2025 a agosto de 2026  
**Data deste relatório:** 31 de agosto de 2026  
**Valor-hora considerado:** R$ 60,00  
**Público:** cliente contratante e liderança da empresa de desenvolvimento

---

## 1. Sumário executivo

A GNOSIS AI é uma plataforma SaaS completa: o usuário se cadastra, escolhe um plano, recebe créditos, gera estudos teológicos com IA, salva o histórico, continua a conversa sobre o estudo, paga por cartão (Stripe e Mercado Pago), instala o app no celular (PWA) e, se for administrador, opera o negócio pelo painel interno.

O trabalho entregue não é um site institucional com um chatbot. É um sistema de assinatura, créditos, catálogo de ferramentas, pagamentos recorrentes, suporte, marketing, afiliados, cupons, API para aplicativo nativo e operação administrativa.

| Indicador | Valor |
|---|---|
| Período de construção | ~10 meses (backlog + repositório Git) |
| Commits no Git | 163 (4 jan 2026 → 3 ago 2026) |
| Páginas / rotas de aplicação | 16 rotas + 12 módulos do admin |
| Tabelas de banco | 25+ |
| Endpoints tRPC (núcleo) | ~80 procedimentos |
| Idiomas | Português, inglês e espanhol (preços em BRL, USD e EUR) |
| Gateways de pagamento | Stripe e Mercado Pago |
| Horas estimadas | **856 h** |
| Investimento de desenvolvimento | **R$ 51.360,00** |

A estimativa de horas foi feita por módulo, com base no que está no código, no backlog (`todo.md`) e no histórico Git — não em um timesheet diário. A metodologia está na seção 13.

---

## 2. O que o produto faz (visão do cliente)

O público-alvo é pastor, teólogo, seminarista e estudante que precisa de estudo bíblico com profundidade acadêmica, sem montar uma equipe de pesquisa.

Fluxo principal:

1. O visitante chega na tela de cadastro/login, escolhe um plano (com trial de 20 dias para conta nova) e paga.
2. Entra no Painel de Controle, vê o saldo de créditos e a grade de ferramentas liberadas pelo plano.
3. Abre uma ferramenta, descreve o pedido, a IA gera o estudo e os créditos são debitados conforme o tamanho do texto.
4. O estudo fica salvo. O usuário pode reabrir, continuar em formato de chat, copiar, baixar em TXT/PDF e compartilhar.
5. Se os créditos acabam, compra pacote avulso ou faz upgrade. Se a assinatura atrasa, o sistema avisa e, depois do período de graça, bloqueia o uso.
6. Dúvidas vão para a Rebeca (chat) ou viram ticket de suporte com conversa entre cliente e equipe.

Por trás disso existe operação de negócio: calendário financeiro, inadimplentes, e-mail marketing, automações, cupons, afiliados e gestão do catálogo de ferramentas sem alterar código.

---

## 3. Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Wouter, TanStack Query |
| API interna | tRPC 11 |
| Backend | Node.js 20, Express (local), funções serverless na Vercel |
| Banco | PostgreSQL (Supabase) + Drizzle ORM (13 migrations) |
| Autenticação web | e-mail/senha, Google OAuth, cookies de sessão, controle de sessão única |
| Autenticação mobile | JWT (`Authorization: Bearer`) |
| Pagamentos | Stripe (assinaturas, Customer Portal, webhooks) e Mercado Pago (assinaturas, créditos, PIX) |
| IA | Motor `invokeLLM` com prompts por ferramenta e suporte a PT/EN/ES |
| E-mail | Resend (transacional, marketing e automações via cron) |
| App instalável | PWA (vite-plugin-pwa + service worker próprio) |
| Push | Web Push (inscrição, preferências e envio) |
| Internacionalização | i18next (pt, en, es) |
| Hospedagem | Vercel (SPA + API + cron de e-mails) |
| Observabilidade de conversão | Meta CAPI + tags de rastreamento |

Identidade visual: paleta pergaminho e ouro (`#FFFACD`, `#1E3A5F`, `#D4AF37`), fontes Cinzel (títulos) e Crimson Text (corpo). Design system documentado para o app nativo em `docs/api/APP_DESIGN_SYSTEM.md`.

---

## 4. Mapa de telas

Rotas reais da aplicação (`client/src/App.tsx`). Telas globais (chat, PWA, migração de plano) aparecem por cima de qualquer página.

### 4.1 Telas públicas

| Rota | Tela | O que o usuário vê e faz |
|---|---|---|
| `/` e `/auth` | Cadastro e login | Abas Entrar / Criar conta. Login por e-mail e senha ou Google. No cadastro: nome, e-mail, senha, cupom opcional, código de afiliado (`?ref=`), escolha de plano, período mensal/anual e início do checkout. Botão para instalar o PWA. |
| `/planos` | Planos e preços | Cards dos planos em coluna, toggle mensal/anual, lista de ferramentas por plano (liberada vs. bloqueada), CTA para assinar. |
| `/sobre` | Sobre nós | Texto institucional da GNOSIS AI, cabeçalho padrão e menu mobile. |
| `/faq` | Perguntas frequentes | 6 categorias, 30+ perguntas em accordion (ferramentas, teologia, créditos, pagamento, conta, uso geral). Atalho para abrir o chat da Rebeca. |
| `/ticket/:ticketId` | Ticket público | O cliente acompanha e responde um chamado sem entrar no admin. |

A landing longa (`Home.tsx`) permanece no projeto: hero, carrossel tutorial, grade de ferramentas, teólogos de referência, planos, créditos avulsos, contextualização brasileira e rodapé. A rota `/` hoje aponta para o cadastro, priorizando conversão.

### 4.2 Telas do usuário autenticado

| Rota | Tela | O que o usuário vê e faz |
|---|---|---|
| `/dashboard` | Painel de Controle | Saldo de créditos, vídeo de destaque (se o admin ligou), carrossel “Meus Estudos”, grade de ferramentas com filtro por categoria, cadeado nas ferramentas do plano superior, banner de inadimplência, atalho de perfil. Layout compacto no celular (créditos no topo, estudos em scroll horizontal, grade 2×2). |
| `/tool/:toolId` | Ferramenta | Nome e descrição da ferramenta, campo de pedido, contagem de palavras e custo estimado, geração com markdown, copiar, baixar TXT/PDF, compartilhar, saldo no cabeçalho. Sem créditos: modal de upgrade ou compra avulsa. Sem plano válido: modal de ativação. |
| `/study/:studyId` | Continuação do estudo | Chat sobre o estudo já gerado. Histórico persistido. Nova mensagem consome créditos. Copiar, PDF e compartilhar o fio completo. |
| `/perfil` | Meu Perfil | Dados da conta, plano atual, saldo (iniciais / diários / bônus), gráfico de uso, histórico de pagamentos, portal Stripe (cancelar/trocar cartão), compra de créditos, upgrade de plano, preferências de notificação push. |
| `/afiliados` | Programa de afiliados | Código e link de indicação, percentual de comissão, lista de comissões (pendente/paga), status de saques. |

### 4.3 Telas administrativas

| Rota / módulo | Tela | Função |
|---|---|---|
| `/admin` → Visão Geral | Dashboard admin | Totais de usuários, distribuição por plano, gráficos de uso das ferramentas, KPIs financeiros Stripe. Filtro 7 / 30 / 90 dias. |
| `/admin` → Calendário Financeiro | Financeiro | Vencimentos e valores por dia, visão de receita recorrente. |
| `/admin` → Gerenciar Usuários | Usuários | Lista, busca, exportação, detalhe, troca de plano, exclusão. |
| `/admin` → Inadimplentes | Cobrança | Quem está em atraso, com recorte por período. |
| `/admin` → Tickets | Suporte | Fila, status (aberto / em andamento / resolvido), atribuição, mensagens, arquivar/desarquivar. Admin vê os seus; super_admin vê todos. |
| `/admin` → Email Marketing | Resend | Público-alvo por plano/papel/status, grupos salvos, envio, histórico e aberturas. |
| `/admin` → Automações | Cron de e-mail | Gatilhos: assinatura vencendo, créditos baixos, usuário inativo, data fixa, periódico (diário/semanal/mensal). |
| `/admin` → Catálogo de Tools | Ferramentas | Criar/editar/desativar ferramenta, categoria, prompt, ícone, ordem, vínculo com planos, textos em 3 idiomas. |
| `/admin` → Gerenciar Planos | Planos | Preços, créditos, quantidade de ferramentas, nomes e descrições. |
| `/admin` → Administradores | Acessos | Incluir/remover admin, editor e super_admin. |
| `/admin` → Vídeo Destaque | Conteúdo do painel | URL, título e liga/desliga do vídeo no Dashboard do aluno. |
| `/admin` → Afiliados | Parceiros | Ativar afiliado, definir %, ver comissões e registrar payout. |
| `/admin` → Cupons | Promoções | Código, validade, dias de desconto, créditos bônus, plano concedido, ferramentas liberadas. |
| `/admin/tickets` | Fila dedicada de tickets | Mesmo sistema de suporte em página cheia. |
| `/admin/tools` | Ferramentas (página) | Atalho de catálogo. |
| `/admin/migrations` | Migração Basic | Acompanhamento da passagem Free legado → plano Basic pago. |

Papéis: `user`, `editor` (marketing/automações), `admin`, `super_admin`. Administradores operam com acesso Premium e créditos altos para testar o produto.

### 4.4 Componentes de tela que atravessam o produto

| Componente | Onde aparece | Função |
|---|---|---|
| Chatbot Rebeca | Todas as páginas | FAQ guiado (planos, créditos, ferramentas) + abertura de ticket (nome, e-mail, departamento, mensagem). |
| Modal de upgrade / créditos | Dashboard, ferramenta, estudo, perfil | Toggle mensal/anual, cards de plano com lista de ferramentas, pacotes avulsos, checkout. |
| Banner de assinatura | Área logada | Aviso progressivo de atraso (amarelo → laranja → vermelho) e bloqueio após 72 h. |
| Modal de plano obrigatório | Ferramentas | Impede geração se a conta não tem plano ativo / trial válido. |
| Modal de migração Basic | Usuários Free legados | Contagem regressiva e CTA para migrar ao Basic pago. |
| Prompt de PWA | Primeira visita compatível | Instalar o app na tela inicial (iOS e Android com guias diferentes). |
| Notificações push | Perfil | Liga/desliga por tipo: assinatura, créditos, estudo, ticket, marketing. |
| Seletor de idioma | Cabeçalho | PT / EN (ES no banco e nos arquivos; UI prioriza PT como padrão). |
| Voltar ao topo | Todas as páginas | Botão flutuante após scroll. |
| Menu hambúrguer | Mobile e desktop | Navegação unificada (Painel, Planos, Sobre, FAQ, Admin, Sair). |

---

## 5. Funcionalidades por módulo

### 5.1 Conta e autenticação

- Cadastro com e-mail e senha (hash bcryptjs).
- Login com Google (OAuth serverless).
- Login e registro REST para o app nativo, com JWT.
- Cupom e código de afiliado no momento do cadastro.
- Escolha de plano e período já na criação da conta, com redirecionamento ao checkout.
- Trial de 20 dias para conta nova (cartão coletado no Stripe).
- Sessão única: novo login invalida a sessão anterior.
- Papéis e permissões no backend (tRPC protegido).
- Recuperação de sessão (`auth.me`, `refreshSession`).

### 5.2 Planos e acesso às ferramentas

Quatro faixas (nomes e valores conforme seed atual; o admin pode alterar no painel):

| Plano | Posição | Ferramentas | Créditos iniciais | Créditos/dia | Preço mensal (seed) |
|---|---|---|---|---|---|
| Basic (ex-Free) | Entrada | 6 | 500 | 50 | R$ 4,97 |
| Aliança | Intermediário | 10 | 1.500 | 150 | R$ 19,98 |
| Lumen | Completo | 18 | 3.000 | 300 | R$ 36,98 |
| GNOSIS Premium | Completo + mais créditos | 18 | 8.000 | 400 | R$ 68,98 |

Regras implementadas:

- Plano anual com desconto (~16,5% / 16,6%, conforme tela).
- Preços em BRL, USD e EUR conforme o idioma.
- Vínculo N:N plano ↔ ferramenta (o admin escolhe o que cada plano libera).
- Migração dos usuários Free antigos para o Basic pago, com prazo de graça e modal de contagem.
- Usuário sem pagamento válido não gera estudo (gate de acesso).

### 5.3 Sistema de créditos

Três bolsos, com ordem fixa de consumo: **diários → iniciais → avulsos/bônus**.

- Diários: renovam todo dia, não acumulam.
- Iniciais: entram na assinatura e nas renovações; validade de 30 dias nos planos pagos.
- Avulsos: compra avulsa, não expiram.
- Custo da geração escala com o número de palavras (tabela de 50 até 625 créditos).
- Histórico de consumo no perfil (gráfico).
- Histórico de pagamentos.
- Pacotes avulsos (valores de referência da documentação mobile): 1.000, 3.000, 6.000 e 10.000 créditos.

### 5.4 Motor de IA e ferramentas

Cada ferramenta tem nome, descrição, placeholder, categoria, ícone, custo base, prompt e traduções. O admin edita isso no catálogo.

Fluxo de geração:

1. Valida plano e créditos.
2. Monta o prompt da ferramenta (idioma do usuário).
3. Chama o LLM.
4. Debita créditos.
5. Grava o estudo.
6. Devolve markdown para a tela.

Na tela da ferramenta e no chat do estudo: copiar, TXT, PDF (jsPDF) e compartilhamento (WhatsApp, Facebook, X, LinkedIn, Instagram, TikTok) com assinatura da GNOSIS AI.

### 5.5 Estudos salvos e chat

- Gravação automática após gerar.
- Lista no Dashboard (limite operacional de 100 mais recentes).
- Exclusão pelo usuário.
- Reabertura em `/study/:id` com mensagens em tabela própria (`study_messages`).
- Cada follow-up também cobra créditos e entra no histórico.

### 5.6 Pagamentos

**Stripe**

- Checkout de assinatura (mensal/anual).
- Customer Portal (cartão, cancelamento, faturas).
- Webhooks de ativação, renovação, atraso e cancelamento.
- Sincronização retroativa de assinaturas.
- Dados financeiros no admin.
- Integração Meta CAPI no funil.

**Mercado Pago**

- Checkout de plano e de créditos avulsos.
- Preferência com período (30 ou 360 dias).
- Pagamento único / PIX nos créditos.
- Webhooks de confirmação.
- Parcelamento tratado nos fluxos de checkout.

Os dois gateways gravam na tabela `payments` (valor, moeda, método, IDs externos, tipo: crédito, plano mensal, anual ou manual).

### 5.7 Assinatura, atraso e bloqueio

Estados: `active`, `cancelled`, `expired`, `grace_period`, `blocked`.

- Período de graça de 72 horas após o vencimento.
- Avisos em 24 h, 48 h e 72 h (cores distintas).
- Bloqueio das ferramentas depois da graça.
- Desbloqueio automático quando o pagamento confirma.
- Banner visível em Dashboard, ferramenta e demais telas logadas.
- Admins não entram nessa trava.

### 5.8 Suporte

- Chat Rebeca com árvore de respostas (planos, créditos, ferramentas) e captura de contato.
- Ticket com departamentos (técnico, financeiro, comercial, outros).
- Thread de mensagens admin ↔ cliente.
- Status, atribuição, não-lidos, arquivo.
- E-mail de ticket (Resend).
- Página pública `/ticket/:id` para o cliente responder.

### 5.9 Marketing e automações

- Envio em massa com filtro de audiência (plano, papel, status de assinatura, e-mails avulsos).
- Grupos reutilizáveis.
- Histórico de envios e contagem de abertura.
- Automações: assinatura vencendo em X dias, créditos abaixo de X, inativo há X dias, data específica, periodicidade.
- Cron Vercel (`api/cron/process-emails.ts`) processa a fila.
- Template HTML padrão da marca.

### 5.10 Afiliados

- Código único e link `?ref=` / `?aff=`.
- Comissão percentual definida pelo super_admin.
- Registro de comissão na assinatura do indicado.
- Lista para o afiliado e gestão de payout no admin.

### 5.11 Cupons

- Código, descrição, validade, ativo/inativo.
- Dias de benefício.
- Créditos bônus.
- Concessão de um plano.
- Liberação de um subconjunto de ferramentas.
- Controle de uso por usuário e expiração do benefício.

### 5.12 PWA, push e API mobile

- Manifest, service worker, instalação na tela inicial, guias iOS/Android.
- Push: inscrição, preferências, envio pontual.
- API REST documentada em `docs/api/MOBILE_APP_API.md`: login, registro, me, tools, generate, studies, créditos, planos.
- Documentação de planos/créditos e design system para o time de app nativo.

### 5.13 Internacionalização

- Interface em português e inglês (detecção só via localStorage; padrão PT).
- Campos de plano e ferramenta em PT, EN e ES no banco.
- Preço exibido na moeda do idioma (BRL / USD / EUR).
- Prompts de IA por idioma.

---

## 6. Catálogo de ferramentas de IA

Catálogo seed (18 ferramentas). A landing e o FAQ também tratam Escatologia Bíblica como ferramenta adicional no produto.

| # | Ferramenta | Uso |
|---|---|---|
| 1 | Hermenêutica | Contexto histórico, cultural e literário do texto. |
| 2 | Exegese | Leitura verso a verso (gramática, sintaxe, teologia). |
| 3 | Traduções | Hebraico, aramaico e grego, com nuances de tradução. |
| 4 | Resumos | Síntese de passagem, livro ou tema, com nível ajustável. |
| 5 | Esboços de Pregação | Estrutura de sermão: introdução, pontos, ilustração, aplicação. |
| 6 | Estudos Doutrinários | Doutrinas (salvação, Trindade, escatologia etc.) com bases bíblicas. |
| 7 | Análise Teológica Comparada | Confronta correntes (calvinismo, arminianismo, etc.). |
| 8 | Teologia Sistemática | Organização temática (bibliologia, cristologia, soteriologia…). |
| 9 | Religiões Comparadas | Cristianismo frente a outras religiões, para diálogo e apologética. |
| 10 | Contextualização Brasileira | Aplicação pastoral e cultural no Brasil. |
| 11 | Gerador de Referências ABNT/APA | Formatação acadêmica de fontes. |
| 12 | Análise de Linguagem Ministerial | Tom, clareza e adequação da fala pastoral. |
| 13 | Assistente de Redação Acadêmica | Apoio a artigos, TCC e textos de seminário. |
| 14 | Análise de Dados Demográficos | Leitura de contexto social para ministério. |
| 15 | Transcrição de Mídia | Transcrição de áudio e vídeo. |
| 16 | Patrística | Pais da Igreja (Agostinho, Irineu, Tertuliano, etc.). |
| 17 | Linha do Tempo Teológica | Cronologia de concílios, doutrinas e movimentos. |
| 18 | Apologética Avançada | Defesa racional da fé (filosofia, história, evidências). |

Acesso por plano (seed):

- **Basic:** Hermenêutica, Traduções, Resumos, Esboços, Estudos Doutrinários, Análise Teológica Comparada.
- **Aliança:** as 6 acima + Teologia Sistemática, Religiões Comparadas, Contextualização Brasileira, Linguagem Ministerial.
- **Lumen e Premium:** catálogo completo.

---

## 7. Modelo de dados (banco)

PostgreSQL via Drizzle. Principais tabelas:

| Tabela | Responsabilidade |
|---|---|
| `users` | Conta, papel, senha, Google, Stripe customer, sessão, afiliado |
| `plans` | Preços (BRL/USD/EUR), créditos, quantidade de ferramentas, i18n |
| `tools` / `tool_categories` | Catálogo, prompts, categorias, i18n |
| `plan_tools` / `planTools` | Quais ferramentas cada plano libera |
| `subscriptions` | Status, período, graça, IDs Stripe/MP |
| `credits` / `user_credits` | Saldos (inicial, diário, bônus) e reset |
| `credit_transactions` | Extrato de consumo e recarga |
| `saved_studies` / `study_messages` | Estudos e chat de continuidade |
| `payments` | Cobranças Stripe e Mercado Pago |
| `chatbot_contacts` / `ticket_messages` | Tickets e mensagens |
| `sent_emails` / `marketing_groups` | Marketing |
| `email_automations` / `automation_logs` | Automações e log de envio |
| `affiliate_commissions` / `affiliate_payouts` | Afiliados |
| `coupons` / `coupon_usages` | Cupons e uso |
| `dashboard_settings` | Vídeo do painel |
| `push_subscriptions` / `notification_preferences` | PWA push |

13 arquivos de migration (`drizzle/0000` … `0012`), incluindo RLS.

---

## 8. Superfície de API

### 8.1 tRPC (web)

Grupos: `auth`, `plans`, `tools`, `studies`, `credits`, `payments`, `subscription`, `admin` (usuários, financeiro, tickets, ferramentas, planos, cupons, admins), `chatbot`, `marketing`, `automations`, `affiliate`, `push`, `settings`.

Cerca de 80 procedimentos. O arquivo `server/routers.ts` tem mais de 2.000 linhas só no núcleo; afiliados e push estão em routers próprios.

### 8.2 REST serverless (`api/`)

| Endpoint | Função |
|---|---|
| `POST /api/login` | Login e JWT |
| `POST /api/register` | Cadastro + login |
| `GET /api/oauth/google` e callback | Login Google |
| `POST /api/trpc/[trpc]` | Bridge tRPC na Vercel |
| `POST /api/webhooks/stripe` | Eventos Stripe |
| `POST /api/webhooks/mercadopago` | Eventos Mercado Pago |
| `GET /api/health` | Saúde do serviço |
| `GET /api/cron/process-emails` | Cron de automações |

### 8.3 API mobile (`/api/v1/mobile`)

Login, perfil, listagem de ferramentas, geração, estudos, créditos e planos — pensada para iOS/Android nativos, com a mesma regra de negócio da web.

---

## 9. Cronologia do trabalho

O backlog (`todo.md`) cobre o período em que o produto saiu do zero até o primeiro deploy público. O Git cobre a fase de produção, serverless e módulos de negócio.

### 9.1 Fundação e produto (out–nov 2025)

Documentado no backlog interno:

- Schema, seed de planos e primeiras 15 ferramentas.
- Home, Dashboard, ToolPage, FAQ (30 perguntas).
- Créditos, Mercado Pago, pagamento anual.
- Estudos salvos, PDF, compartilhamento.
- Painel admin inicial, tickets, papéis admin/super_admin.
- Ferramentas Patrística, Linha do Tempo, Apologética, Escatologia.
- Chat Rebeca, pop-up de versículo, carrossel tutorial.
- Ajustes pesados de mobile e cabeçalho unificado.
- Deploy Vercel (nov 2025): SPA routing, OAuth, correção de runtime.

### 9.2 Produção e Git (jan–ago 2026)

163 commits. Distribuição:

| Mês | Commits | Foco |
|---|---|---|
| Jan/2026 | 90 | Migração serverless, login, Stripe, MP, mobile, créditos, home, FAQ, segurança admin |
| Fev/2026 | 25 | Estabilização Vercel, e-mail marketing, Stripe, vídeo do dashboard, filtros |
| Mar/2026 | 27 | Automações, Resend, cron, gráficos, cupom, afiliados, papel editor, parcelamento |
| Abr/2026 | 2 | bcryptjs, lockfile |
| Mai/2026 | 3 | i18n da IA, API do app |
| Jun/2026 | 13 | Novos planos (Basic), valores, idioma, cadastro com plano, Stripe, modais |
| Jul/2026 | 2 | Mercado Pago, correções |
| Ago/2026 | 1 | Ajuste do plano de entrada |

Isso mostra um produto que nasceu completo e depois ganhou camada de operação (marketing, automação, cupom, afiliado, i18n, app, novo plano de entrada).

---

## 10. Métricas do código (evidência)

| Item | Quantidade |
|---|---|
| Arquivos TypeScript / TSX | 243 |
| Páginas em `client/src/pages` | 18 |
| Componentes (exceto pasta `ui`) | ~50 de produto + 20 de admin + biblioteca shadcn |
| Módulos de servidor | 57 arquivos `.ts` |
| Funções `api/` | 9 |
| Linhas nas páginas | ~6.500 |
| Linhas em `server/routers.ts` | ~2.020 |
| Schema Drizzle | ~440 linhas (além do schema compartilhado) |
| Traduções (pt + en + es) | ~1.100 linhas |
| Commits | 163 |

Autores no Git (mesma pessoa, identidades diferentes): `ale-movidev` (102), `Alessandro Bueno` (40), `alebbueno` (21).

---

## 11. Entregáveis para o cliente

O que o contratante recebe, em produção:

1. Plataforma web em produção (Vercel + Supabase).
2. Quatro planos comerciais com créditos, trial e upgrade.
3. Dezoito ferramentas de IA com prompts especializados e geração em markdown.
4. Histórico de estudos e continuação em chat.
5. Pagamentos Stripe e Mercado Pago (assinatura e créditos).
6. Painel administrativo para operar o negócio sem depender de desenvolvedor no dia a dia.
7. Suporte (Rebeca + tickets).
8. E-mail marketing e automações.
9. Afiliados e cupons.
10. PWA instalável e notificações.
11. API e documentação para aplicativo iOS/Android.
12. Interface em português e inglês, com preços internacionais no banco.
13. Código-fonte, migrations e documentação de API/design.

---

## 12. O que o admin consegue operar sozinho

Sem abrir pull request, o super_admin consegue:

- Mudar preço e créditos de plano.
- Ligar/desligar ferramenta e trocar o prompt.
- Definir quais ferramentas cada plano inclui.
- Publicar ou esconder o vídeo do Dashboard.
- Ver quem pagou, quem atrasou e o uso por ferramenta.
- Tratar tickets e responder o aluno.
- Disparar campanha e agendar automação de e-mail.
- Criar cupom de lançamento ou parceria.
- Cadastrar afiliado e pagar comissão.
- Promover editor/admin.

Isso reduz custo operacional depois da entrega: o produto não fica “engessado no código” para mudança comercial.

---

## 13. Estimativa de horas e investimento

### 13.1 Método

Não havia timesheet formal por tarefa. A estimativa usa:

- Escopo entregue (telas, regras, integrações, painel).
- Tamanho e complexidade dos arquivos.
- Backlog de outubro–novembro de 2025 (produto inicial + dezenas de correções de UX).
- 163 commits de janeiro a agosto de 2026 (produção, pagamentos, marketing, i18n, app).
- Referência de esforço de um desenvolvedor full-stack sênior para SaaS com pagamento recorrente e IA.

Horas já incluem análise, implementação, ajuste com o cliente, correção em produção e documentação. Não incluem horas de LLM/API da OpenAI, taxas Stripe/MP, nem infra Vercel/Supabase.

### 13.2 Horas por módulo

| # | Módulo | O que entra | Horas | Valor (R$ 60/h) |
|---|---|---|---:|---:|
| 1 | Arquitetura, banco e infraestrutura | Vite/React, tRPC, Drizzle, 13 migrations, 25+ tabelas, ambiente local e Supabase | 56 | 3.360 |
| 2 | Autenticação e sessões | E-mail/senha, Google, JWT mobile, sessão única, papéis, cadastro com plano/cupom/afiliado | 44 | 2.640 |
| 3 | Páginas públicas e identidade | Auth, Home, Planos, Sobre, FAQ, tema pergaminho/ouro, carrossel, rodapé, FAQ 30+ | 52 | 3.120 |
| 4 | Painel do aluno, perfil e créditos (UI) | Dashboard, CreditsPanel, perfil, gráfico de uso, histórico, header de saldo | 40 | 2.400 |
| 5 | Motor de IA e catálogo | `tools.generate`, tabela de custo por palavras, 18 ferramentas, prompts, PDF, share | 80 | 4.800 |
| 6 | Estudos e chat de continuidade | `saved_studies`, `study_messages`, lista no painel, `/study/:id` | 32 | 1.920 |
| 7 | Mercado Pago | Checkout de plano e créditos, PIX, webhooks, anual/mensal, parcelamento | 44 | 2.640 |
| 8 | Stripe | Checkout, Portal, webhooks, sync, trial, financeiro no admin, Meta CAPI | 52 | 3.120 |
| 9 | Ciclo da assinatura | Graça 72 h, banners, bloqueio, migração Free→Basic, gate de pagamento | 32 | 1.920 |
| 10 | Painel administrativo | 12 módulos (stats, financeiro, users, tools, plans, vídeo, tickets, etc.) | 88 | 5.280 |
| 11 | Tickets e Rebeca | Chat, departamentos, thread, arquivo, e-mail, página pública do ticket | 36 | 2.160 |
| 12 | Marketing, automações e cron | Resend, audiência, grupos, gatilhos, Vercel Cron, templates | 48 | 2.880 |
| 13 | Afiliados e cupons | Código, comissão, payout, cupom com plano/créditos/ferramentas | 36 | 2.160 |
| 14 | Internacionalização | i18n PT/EN/ES, preços BRL/USD/EUR, prompts por idioma | 32 | 1.920 |
| 15 | PWA, push e API mobile | Service worker, install guides, web-push, REST mobile + docs | 44 | 2.640 |
| 16 | Mobile e responsividade | Menu, Dashboard 2×2, ToolPage, header único, testes de viewport | 36 | 2.160 |
| 17 | Deploy serverless | Express → Vercel, cookies, webhooks, OAuth, 404 SPA, crons, correção de 500 | 48 | 2.880 |
| 18 | QA, correções e iterações | Bugs de crédito/plano, copy, valores, UX, regressões de publicação | 56 | 3.360 |
| | **Total** | | **856** | **51.360** |

### 13.3 Consolidado financeiro

| Descrição | Valor |
|---|---|
| Valor-hora | R$ 60,00 |
| Horas estimadas | 856 |
| **Investimento de desenvolvimento** | **R$ 51.360,00** |
| Conferência | R$ 51.360,00 ÷ 856 h = R$ 60,00/h |

### 13.4 Como ler esse número

- Um SaaS com dois gateways, IA, admin de operação, PWA e API mobile, feito sob medida, costuma sair nessa faixa (ou acima) em casa de software.
- Janeiro de 2026 sozinho concentrou 90 commits: migração para Vercel + pagamentos + login — sprint típico de 150–180 horas.
- Outubro–novembro de 2025 (antes do Git atual) concentrou a construção das telas, das ferramentas e do primeiro admin.
- Meses com poucos commits (abril, maio, julho, agosto) não zeram o esforço: são janelas de ajuste pontual e de módulos já grandes (i18n, API do app, plano Basic).

---

## 14. Distribuição do investimento por frente

Agrupamento para conversa comercial:

| Frente | Horas | R$ | % |
|---|---:|---:|---:|
| Produto do aluno (telas, ferramentas, estudos, créditos, mobile UI) | 228 | 13.680 | 27% |
| Monetização (planos, Stripe, MP, assinatura, cupom, afiliado) | 164 | 9.840 | 19% |
| Operação (admin, tickets, marketing, automações) | 172 | 10.320 | 20% |
| Plataforma (arquitetura, auth, i18n, PWA, API, deploy) | 236 | 14.160 | 28% |
| Qualidade e iteração com o cliente | 56 | 3.360 | 7% |
| **Total** | **856** | **51.360** | **100%** |

---

## 15. Riscos e pendências conhecidas (transparência)

Itens que o próprio backlog ou o código ainda marcam como incompletos ou frágeis — úteis para o cliente não tratar o sistema como “fechado para sempre”:

- Cancelamento e reembolso automático ainda não são um fluxo completo de self-service além do Customer Portal da Stripe.
- Parte das copies do chatbot ainda cita nomes/valores antigos (Free vs. Basic); o painel e o seed já usam Basic.
- Home institucional existe no código, mas a rota `/` está no cadastro — decisão de conversão, não de falta de landing.
- Espanhol está no banco e nos JSON; a UI força português como padrão e trata EN como segundo idioma.
- Transcrição de mídia depende de serviço de áudio/vídeo configurado no ambiente.
- Custo variável de LLM (tokens) e taxas dos gateways são despesa operacional, fora desta tabela de horas.

Nada disso anula o que foi entregue; são pontos de evolução, não retrabalho da base.

---

## 16. Conclusão para o cliente e para a liderança

A GNOSIS AI entregue é um **produto comercial operável**:

- O aluno estuda, paga, renova, instala no celular e fala com o suporte.
- O dono do produto muda plano, preço, prompt, campanha e cupom pelo admin.
- O time de app nativo tem API e design system prontos.
- O time de crescimento tem afiliado, cupom, Meta CAPI e e-mail automático.

O desenvolvimento cobre cerca de **dez meses de evolução contínua**, **856 horas** de trabalho especializado e um investimento de **R$ 51.360,00** à hora de **R$ 60,00**.

Esse valor paga a construção de um SaaS — não a montagem de um site. Substituir este sistema por um conjunto de ferramentas avulsas (landing + Stripe Checkout + um GPT genérico + planilha de alunos) perderia o que justifica a plataforma: créditos com regra de negócio, ferramentas teológicas com prompt próprio, bloqueio por plano, estudo persistido, operação e dois mercados de pagamento.

---

## 17. Anexos — índice de telas para apresentação

Use esta lista como roteiro de demo (ordem sugerida):

1. `/auth` — login e cadastro com escolha de plano  
2. `/planos` — tabela comercial  
3. `/faq` e chat da Rebeca  
4. `/dashboard` — créditos + ferramentas + estudos  
5. `/tool/:id` — gerar, copiar, PDF, compartilhar  
6. `/study/:id` — continuar o estudo  
7. `/perfil` — portal Stripe, push, gráfico de uso  
8. `/afiliados` — link e comissões  
9. `/admin` — visão geral e financeiro  
10. `/admin` — usuários, inadimplentes, tickets  
11. `/admin` — catálogo de tools e planos  
12. `/admin` — marketing, automações, cupons, afiliados  
13. Instalar PWA no celular e receber push  
14. Checkout Stripe e/ou Mercado Pago (sandbox)

---

**Documento gerado a partir da análise do repositório `gnosis_ai` (código, schema, rotas, backlog e histórico Git).**  
**Não inclui chaves de API, tokens nem dados pessoais de usuários.**
