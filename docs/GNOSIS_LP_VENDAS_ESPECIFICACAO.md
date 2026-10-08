# GNOSIS AI — LP de vendas, copy, UI/UX e mensuração

**Entrega para:** desenvolvimento, design, produto e marketing  
**Data:** 08/10/2026 · **Versão:** 1.0 · **Idioma:** PT-BR  
**Base de produto:** `BRIEFING_LP_VENDAS.md`, fornecido pelo cliente.  
**Escopo:** especificação para construir a LP e integrar a mensuração ao cadastro, ao uso inicial e à compra. Este documento não representa uma página ou tags já implementadas.

## 1. Direção estratégica e análise do briefing

O briefing tem uma oferta clara, um catálogo especializado e um diferencial brasileiro. O principal risco de conversão é apresentar ferramentas demais antes de mostrar uma aplicação concreta. O segundo é confundir conta gratuita com assinatura ou com uso ilimitado. O terceiro é tratar o cadastro como fim do funil, sem acompanhar se o usuário gera um estudo e compra créditos.

A LP deve vender uma ação imediata: **começar um estudo bíblico com uma conta grátis**. A compra de créditos aparece como continuidade natural, com preço transparente e sem mensalidade.

A copy será assertiva: dor concreta, verbos de ação, demonstração e oferta repetida nos momentos de decisão. Não usar escassez falsa, culpa religiosa, promessa de revelação, resultado garantido ou números de desempenho não comprovados.

**Promessa central:** profundidade e organização para estudar, preparar e ensinar a Bíblia, com ferramentas de IA especializadas.

**Funil prioritário:** visita → cadastro concluído → primeiro estudo concluído → escolha de pacote → checkout → pagamento aprovado.

### Regras comerciais inegociáveis

| Tema | Regra para interface e copy |
|---|---|
| Conta | Uma conta Free; todas as ferramentas disponíveis |
| Cadastro | E-mail ou Google, sem cartão |
| Créditos iniciais | 500 uma vez; não renovam; disponíveis até o consumo |
| Créditos diários | 50 por dia; saldo restante do dia não acumula |
| Créditos comprados | Avulsos; não vencem |
| Ordem de consumo | Diários → iniciais → avulsos |
| Cobrança | Compra única, sem mensalidade ou cobrança automática |
| Pagamento | PIX ou cartão, conforme disponibilidade real do checkout |
| Consumo | Cada estudo consome créditos; ferramentas liberadas não significam uso ilimitado |
| Preços | 1.000/R$ 9,90; 3.000/R$ 24,90; 6.000/R$ 39,90; 10.000/R$ 69,90 |

O pacote de 6.000 tem o menor preço por mil créditos. Destacar como **Melhor valor**, nunca como “mais vendido” sem dados. Não prometer número de sermões por pacote. As condições acima vêm do briefing; produto deve confirmar sua vigência antes de publicar.

## 2. Arquitetura da página

| Ordem | Seção / âncora | Objetivo | Ação |
|---|---|---|---|
| 0 | Cabeçalho | Marca, orientação e acesso | Criar conta grátis / Entrar |
| 1 | Hero `#inicio` com vídeo | Entender o produto e começar | Criar conta grátis |
| 2 | Dor `#desafio` | Reconhecer o problema | Continuidade da leitura |
| 3 | Como funciona `#como-funciona` | Mostrar simplicidade | Criar conta grátis |
| 4 | Perfis `#para-quem` | Identificação com a tarefa | Continuidade da leitura |
| 5 | Ferramentas `#ferramentas` | Demonstrar aplicação | Criar conta grátis |
| 6 | Contexto brasileiro `#brasil` | Diferencial concreto | Continuidade da leitura |
| 7 | Confiança `#confianca` | Tradição e uso responsável | Continuidade da leitura |
| 8 | Conta Free `#conta-free` | Explicar a oferta gratuita | Criar conta grátis |
| 9 | Pacotes `#creditos` | Preparar a recarga | Cadastro ou compra autenticada |
| 10 | FAQ `#perguntas` | Resolver objeções | Acordeões |
| 11 | Fechamento `#comecar` | Decisão final | Criar conta grátis |
| 12 | Rodapé | Contato, termos e privacidade | Links funcionais |

Evitar uma sequência de cartões idênticos. Alternar blocos editoriais, demonstração real, passos e tabela de pacotes. Cabeçalho com no máximo três âncoras: Como funciona, Ferramentas e Créditos. “Entrar” tem menor destaque que o CTA de cadastro.

## 3. Copy final da LP

Os textos entre aspas abaixo são prontos para implementação. As instruções de layout não fazem parte da copy pública.

### 3.1 Hero — primeira dobra

**Sobretítulo:** “Estudo bíblico com inteligência artificial”

**H1:** “Seu próximo estudo bíblico merece mais profundidade. Comece grátis.”

**Subtítulo:** “Prepare sermões, aprofunde passagens e organize pesquisas com IA para o estudo bíblico. Para pastores, seminaristas e quem quer compreender melhor a Palavra.”

**CTA principal:** “Criar conta grátis”  
**Microcopy:** “Sem cartão. 500 créditos no cadastro e 50 por dia. Todas as ferramentas.”  
**Link secundário:** “Ver créditos” → `#creditos`.

**Vídeo:** botão sobre o pôster: “Veja a GNOSIS AI em ação”.  
**Legenda:** “Da passagem ao estudo: veja como começar.”

**Linha de apoio:** “Exegese, sermão, doutrina e pesquisa no mesmo lugar.”

Não colocar preço monetário no hero. Não condicionar o cadastro a assistir ao vídeo.

### 3.2 Dor

**Título:** “A semana corre. Seu estudo exige profundidade.”

**O domingo chega antes do preparo**  
“A agenda aperta, as referências se espalham e o estudo fica para depois. Você precisa de um caminho organizado para aprofundar o texto e preparar o que vai ensinar.”

**O contexto da sua igreja importa**  
“Nem toda referência conversa com a realidade brasileira. Preparar uma boa aplicação exige considerar a cultura, os desafios e as perguntas de quem vai ouvir.”

**Uma resposta pronta não basta**  
“Ao estudar teologia com IA, você precisa de contexto e espaço para aprofundar. Um texto convincente, sozinho, não resolve as perguntas da passagem.”

**Ponte:** “Escolha a passagem. A GNOSIS AI ajuda a organizar o caminho para estudá-la.”

### 3.3 Como funciona

**Título:** “Pare de adiar. Comece pelo próximo texto.”

1. **Crie sua conta grátis.** “Entre com e-mail ou Google, sem cartão, e receba 500 créditos iniciais.”
2. **Escolha o que quer preparar.** “Selecione uma ferramenta, informe a passagem ou o tema e solicite seu estudo.”
3. **Aprofunde e leve com você.** “Continue a conversa, consulte o estudo salvo e baixe em PDF ou texto; compre créditos apenas se quiser ir além do saldo disponível.”

**CTA:** “Criar conta grátis”  
**Apoio:** “Seu primeiro passo não exige pagamento.”

### 3.4 Para quem

**Título:** “O que você precisa preparar agora?”

| Perfil | Texto do cartão |
|---|---|
| Pastor e pregador | “Organize o caminho entre a passagem e a mensagem. Trabalhe contexto, estrutura e aplicação antes de subir ao púlpito.” |
| Seminarista e pesquisador | “Dê direção à pesquisa e ao argumento. Estruture o trabalho e revise as referências com apoio especializado.” |
| Professor de escola bíblica | “Transforme uma passagem em uma aula clara. Prepare explicações e aplicações para a realidade da sua turma.” |
| Quem estuda a Bíblia | “Vá além da primeira leitura. Explore o contexto e aprofunde as perguntas que surgem no texto.” |

### 3.5 Ferramentas e demonstração

**Título:** “Não pare na resposta. Aprofunde o estudo.”

**Introdução:** “Todas as ferramentas estão disponíveis na conta Free. Escolha seu objetivo e encontre um caminho de estudo. Cada geração consome créditos do seu saldo.”

| Grupo | Promessa | Ferramentas | Exemplo de pedido |
|---|---|---|---|
| Estudo do texto | “Entenda a passagem antes de construir a aplicação.” | Hermenêutica; Exegese; Traduções; Resumos; Escatologia bíblica | “Analise Romanos 8:1–11 considerando contexto, estrutura e termos importantes do original.” |
| Pregação e ministério | “Dê estrutura à mensagem e clareza à aplicação.” | Esboços de pregação; Análise de linguagem ministerial; Contextualização brasileira | “Organize um esboço sobre Lucas 10:25–37 e proponha aplicações para uma igreja urbana brasileira.” |
| Teologia | “Compare argumentos e compreenda como as doutrinas se desenvolveram.” | Estudos doutrinários; Análise teológica comparada; Teologia sistemática; Religiões comparadas; Patrística; Linha do tempo teológica; Apologética avançada | “Compare as perspectivas calvinista e arminiana sobre a salvação, apresentando os argumentos de cada uma.” |
| Academia e pesquisa | “Organize a pesquisa sem perder o fio do argumento.” | Redação acadêmica; Referências ABNT/APA; Dados demográficos; Transcrição de mídia | “Proponha uma estrutura de artigo sobre o contexto histórico da carta aos Filipenses.” |

**CTA:** “Criar conta grátis”  
**Apoio:** “Escolha sua ferramenta. Comece com os créditos gratuitos.”

**Tratamento visual:** quatro abas acessíveis no desktop; quatro acordeões no celular. Cada grupo mostra um pedido e uma captura real do produto. O pedido é ilustrativo, não resultado garantido. Usar saídas reais revisadas; não desenhar respostas fictícias com aparência de prova do produto. Mostrar estado padrão útil mesmo antes de qualquer interação.

### 3.6 Brasil

**Título:** “A aplicação precisa conversar com quem ouve.”

“A GNOSIS AI inclui uma ferramenta de contextualização brasileira para aproximar o estudo da cultura, da sociedade e da religiosidade daqui. Trabalhe aplicações para a realidade da sua comunidade, mantendo o texto bíblico como referência.”

**Exemplo de uso:** “Ao estudar o bom samaritano, explore aplicações sobre cuidado com o próximo na rotina de um bairro brasileiro.”

### 3.7 Tradição e confiança

**Título:** “Mais referências para estudar. Discernimento para ensinar.”

“As ferramentas foram desenhadas para dialogar com a tradição cristã: Agostinho, Tomás de Aquino, Lutero, Calvino, Wesley, Barth, C. S. Lewis, Bonhoeffer, N. T. Wright e Timothy Keller. Nas comparações, explore os argumentos de diferentes perspectivas.”

“A GNOSIS AI apoia seu estudo; não substitui a Bíblia, a oração nem o pastor. Confira os resultados no texto bíblico e na bibliografia. O discernimento continua com você e sua comunidade.”

Não usar retratos como endosso nem alegar treinamento com obras completas. Sem depoimentos disponíveis, a prova será a demonstração do produto. Um futuro bloco de relatos só entra com conteúdo real autorizado.

### 3.8 Oferta Free

**Título:** “Comece grátis. Recarregue quando precisar.”

- **500 créditos no cadastro.** “Receba uma vez e use até acabar.”
- **50 créditos por dia.** “O saldo diário renova. O que sobra do dia não acumula.”
- **Créditos comprados não vencem.** “Adicione saldo quando quiser continuar além dos créditos gratuitos.”

“Todas as ferramentas já estão liberadas. O que você utiliza é o saldo de créditos.”

“Sem cartão no cadastro. Sem mensalidade.”

**CTA:** “Criar conta grátis”

### 3.9 Pacotes

**Título:** “Quer continuar? Compre créditos, sem mensalidade.”

**Subtítulo:** “Compra única por PIX ou cartão. Seus créditos avulsos ficam disponíveis até você usar.”

| Quantidade | Preço | Texto de apoio | Selo |
|---|---|---|---|
| 1.000 créditos | R$ 9,90 | “Para explorar além do saldo gratuito.” | — |
| 3.000 créditos | R$ 24,90 | “Para dar continuidade à sua rotina de estudos.” | — |
| 6.000 créditos | R$ 39,90 | “O menor preço por mil créditos entre os pacotes.” | Melhor valor |
| 10.000 créditos | R$ 69,90 | “Para quem prefere uma reserva maior de créditos.” | — |

**CTA por pacote, visitante:** “Criar conta grátis”  
**Apoio por pacote, visitante:** “Você pode experimentar antes de comprar.”  
**CTA por pacote, autenticado:** “Comprar 6.000 créditos” — adaptar a quantidade.

**Nota:** “Os 50 créditos diários continuam após a compra. O consumo usa primeiro os diários, depois os iniciais e, por último, os avulsos, que não vencem.”

Não tratar pacotes como planos. Não usar toggle mensal/anual. Não pré-selecionar compra como obrigação de cadastro. Se houver comparação unitária, usar R$ 9,90, R$ 8,30, R$ 6,65 e R$ 6,99 por mil, respectivamente.

### 3.10 FAQ — oito respostas

**Preciso assinar ou pagar para começar?**  
“Não. Você cria uma conta Free e recebe 500 créditos iniciais, além de 50 por dia. Todas as ferramentas ficam disponíveis. A compra de créditos é opcional e não cria mensalidade.”

**Preciso informar meu cartão?**  
“Não. O cadastro não pede cartão e não inicia cobrança automática. Você só paga quando decide comprar um pacote de créditos.”

**Meus créditos vencem?**  
“Os 50 créditos diários não acumulam. Os 500 iniciais são concedidos uma vez e ficam disponíveis até você usar. Os créditos avulsos comprados não vencem. O consumo prioriza os diários, depois os iniciais e, por último, os avulsos.”

**Posso confiar em tudo que a IA escreve?**  
“A IA pode cometer erros. Use a GNOSIS AI para organizar e aprofundar o estudo, conferindo interpretações e referências na Bíblia e na bibliografia. Ela não substitui a Escritura nem o discernimento da sua comunidade.”

**Serve para quem não fez seminário?**  
“Sim. Você pode começar com resumos e contexto de passagens e avançar conforme suas perguntas. O mesmo painel também oferece recursos para preparação de sermões e pesquisa acadêmica.”

**Funciona no celular?**  
“Sim. Você acessa pelo navegador e pode instalar o site na tela inicial. É necessário estar conectado à internet para usar a plataforma.”

**Por que usar a GNOSIS AI?**  
“Você encontra caminhos específicos para o estudo bíblico: contexto, originais, doutrina, pregação, pesquisa e aplicação brasileira. Escolha a ferramenta e continue aprofundando o estudo na mesma sala.”

**Qual pacote devo comprar primeiro?**  
“Nenhum é necessário para começar. Experimente os créditos gratuitos e observe seu uso. Quando quiser recarregar, o pacote de 1.000 é a menor compra, e o de 6.000 oferece o menor preço por mil créditos.”

### 3.11 Fechamento

**Título:** “Abra sua conta. Dê profundidade ao próximo estudo.”

“Você já tem uma passagem para estudar, uma aula para preparar ou uma pergunta para aprofundar. Comece grátis com um instrumento a serviço da compreensão das Escrituras.”

**CTA:** “Criar conta grátis”  
**Microcopy:** “Sem cartão. 500 créditos no cadastro e 50 por dia. Todas as ferramentas.”

### 3.12 Rodapé

**Descrição:** “GNOSIS AI — ferramentas de inteligência artificial para aprofundar o estudo bíblico.”

Links: Termos de uso, Privacidade, Preferências de cookies, Contato e Entrar. Reutilizar destinos reais do produto; nenhum link deve apontar apenas para `#`. Exibir identificação institucional conforme os dados fornecidos pelo responsável.

## 4. Direção de UI/UX

### 4.1 Identidade e ritmo

Proposta visual: página clara, editorial e acolhedora, com fundo marfim, azul-marinho e ouro pontual. Mostrar a interface real da plataforma como elemento principal. Evitar estética de infoproduto, imagens genéricas de robôs, excesso de brilhos e blocos escuros sucessivos.

| Token proposto | Valor / aplicação |
|---|---|
| Marca principal | `#1E3A5F` — títulos, botões e navegação |
| Acento | `#D4AF37` — detalhes, selo e ícones; não texto pequeno sobre branco |
| Fundo | `#FAF8F3` |
| Superfície | `#FFFFFF` |
| Texto principal | `#172B42` |
| Texto secundário | `#475569` |
| Borda | `#E2E8F0` |
| Tipografia | Preferir fonte já usada no produto; alternativa: Inter no corpo e Lora nos títulos, hospedadas localmente |
| Largura | Conteúdo até 1.200 px; leitura até 65 caracteres por linha |
| Espaçamento | Escala de 8 px; seções 80–96 px desktop, 40–56 px mobile |
| Cantos | Botões 10–12 px; painéis 16–20 px |

CTA principal azul com texto branco; ouro reservado para acento. Botões com altura mínima de 48 px e área de toque confortável. Estados hover, foco, carregamento e desabilitado explícitos. Validar contraste e foco conforme WCAG 2.2 AA; não comunicar estado apenas por cor.

### 4.2 Primeira dobra e vídeo

**Desktop a partir de 1.024 px:** cabeçalho compacto, hero em duas colunas 48/52; texto e CTA à esquerda, vídeo 16:9 à direita. Não usar `height: 100vh` rígido. Em 1.366 × 768, título, oferta, CTA e vídeo devem aparecer sem rolagem nas configurações padrão.

**Tablet:** reduzir tipografia e espaçamento antes de quebrar para coluna única.

**Mobile:** ordem: sobretítulo → H1 → subtítulo → CTA → microcopy → vídeo. Em 390 × 844, projetar para mostrar o pôster e seu botão ainda na área inicial; em telas menores, priorizar CTA e permitir continuidade natural. Não reduzir fonte ou cortar conteúdo para forçar tudo na dobra. Testar também 360 × 640 e zoom de 200%.

Vídeo no próprio hero, com pôster real otimizado, proporção reservada e controle de reprodução. Sem autoplay com áudio. Usar carregamento por intenção; não baixar o vídeo inteiro antes do play. Oferecer legendas e transcrição. Em falha: “Não foi possível carregar o vídeo. Você pode criar sua conta e conhecer a plataforma.” O CTA continua disponível.

**Duração proposta:** 60–90 segundos, sujeita ao material produzido. Só mostrar duração na interface quando o arquivo existir.

| Tempo indicativo | Cena | Narração proposta |
|---|---|---|
| 0–10 s | Passagem e painel real | “Seu próximo estudo bíblico pode começar com uma pergunta. A GNOSIS AI ajuda você a organizar o caminho para aprofundá-la.” |
| 10–25 s | Escolha da ferramenta e pedido | “Escolha o que precisa preparar: uma análise do texto, um esboço, uma comparação teológica ou uma pesquisa.” |
| 25–45 s | Resultado e pergunta complementar | “Explore a resposta, continue a conversa e confira o conteúdo na Bíblia e na bibliografia.” |
| 45–60 s | Histórico e exportação reais | “Seu estudo fica salvo. Você pode retomar, copiar, baixar e compartilhar.” |
| 60–80 s | Oferta e CTA | “Crie sua conta grátis, sem cartão. Receba 500 créditos iniciais e 50 por dia. Se precisar de mais, compre créditos avulsos, sem mensalidade.” |

Usar gravação real sem dados pessoais. Se houver corte de espera na geração, indicar “tempo de processamento reduzido na demonstração”. O vídeo não pode sugerir resultado instantâneo se isso não ocorrer.

### 4.3 Navegação e fluidez

- Cabeçalho discreto; âncoras com `scroll-margin-top` para não esconder títulos.
- Mobile: barra inferior “Criar conta grátis” apenas depois de o CTA do hero sair da tela; ocultar quando outro CTA principal estiver visível ou enquanto preferências de cookies estiverem abertas.
- Reservar espaço para a barra e respeitar `safe-area-inset-bottom`. Não cobrir vídeo, FAQ ou rodapé.
- Quatro pacotes em linha no desktop e empilhados no mobile. Manter a ordem de preços; realçar 6.000 sem esconder os demais.
- Animações leves e opcionais; respeitar `prefers-reduced-motion`. Sem scroll capturado, carrossel automático ou pop-up de saída.
- Conteúdo legível sem animações e sem JavaScript. Interações progressivas não podem esconder copy essencial.
- Tabs, acordeões e player operáveis por teclado, com rótulos acessíveis e foco visível.
- Não adicionar formulários de telefone, igreja ou denominação na LP. Encaminhar ao cadastro existente.

## 5. Fluxos e integração com o produto

### 5.1 Rotas

A única rota confirmada no briefing é `/auth`, na aba cadastrar. Desenvolver um adaptador para abrir essa aba conforme o roteador existente. `mode=signup`, rotas de painel, carteira e checkout são decisões a confirmar no repositório, não endpoints presumidos como existentes.

Configurar destinos num único módulo: `SIGNUP_URL`, `LOGIN_URL`, `DASHBOARD_URL`, `CREDITS_URL`, `CONTACT_URL`. Reutilizar o catálogo de preços do produto; evitar números duplicados em arquivos independentes. O servidor valida preço e SKU no checkout.

### 5.2 Cadastro padrão

1. Clique em “Criar conta grátis” abre cadastro; nunca abre checkout.
2. Preservar origem da LP e posição do CTA conforme consentimento aplicável.
3. Erro no cadastro mantém o formulário e mostra orientação; não dispara conversão.
4. Conta criada e habilitada para acesso dispara `sign_up` uma vez. Se houver confirmação de e-mail obrigatória, disparar após essa etapa; registrar o início separadamente.
5. Autenticação com Google em conta existente é login, não cadastro.
6. Direcionar ao painel e sugerir a primeira ferramenta, respeitando o onboarding existente.

### 5.3 Interesse em pacote antes do cadastro

Clique no CTA de um pacote salva apenas a intenção funcional: SKU, quantidade e origem interna. Após cadastro, permitir experimentar ou continuar para a compra. Copy sugerida: “Sua conta está pronta. Quer começar um estudo ou adicionar 6.000 créditos?” Ações: “Começar meu estudo” e “Ver pacote de 6.000 créditos”. Nenhuma cobrança sem confirmação explícita.

Usar retorno interno permitido por allowlist, nunca aceitar qualquer URL externa em `return_to`. Não colocar e-mail, token de sessão ou conteúdo de estudo na URL.

### 5.4 Usuário autenticado

Trocar CTAs gerais por “Ir para meu painel” e os CTAs dos pacotes por “Comprar [quantidade] créditos”. Estado da sessão não deve causar grande deslocamento visual. A seleção de pacote abre o fluxo de compra existente; sessão expirada solicita login e preserva a intenção.

### 5.5 Compra

Checkout criado → pagamento pendente → confirmação do provedor → créditos disponibilizados. PIX gerado, retorno do checkout e página de agradecimento não provam pagamento. Estados de falha e cancelamento permitem nova tentativa sem crédito duplicado. Recarregar somente após confirmação válida do servidor.

## 6. Monitoramento de conversão

### 6.1 Escopo e arquitetura proposta

O rastreamento deve abranger **LP + autenticação + painel + checkout + backend**. Tags somente na LP medem interesse, mas não confirmam cadastro ou venda.

- Google Tag Manager: gerenciamento de tags no navegador, sem duplicar scripts já instalados.
- GA4: comportamento e funil, com eventos de cadastro e comércio eletrônico.
- Google Ads: conversões de cadastro e compra, quando houver campanhas.
- Meta Pixel / Conversions API: integração opcional por configuração, sujeita à elegibilidade da fonte e às políticas vigentes da conta. Não presumir disponibilidade de todos os eventos.
- Backend: fonte de verdade para novas contas, estudo concluído e pagamentos. Manter relatório operacional separado do alcance das tags.

Padrão proposto para compra no GA4: emissão pelo servidor após pagamento confirmado. Não enviar outra `purchase` pelo navegador na mesma implementação. Para Meta, se o projeto usar navegador e servidor, compartilhar `event_name` e `event_id` para deduplicação e validar o comportamento na documentação vigente antes de ativar.

### 6.2 Plano de eventos

Campos comuns permitidos: `page_id=lp_vendas`, `page_version=v1`, `placement`, `experiment_variant` quando existir. Eventos de produto não devem transportar o conteúdo do estudo.

| Evento | Momento exato | Parâmetros específicos | Tratamento |
|---|---|---|---|
| `page_view` | Visualização real da rota | Caminho saneado | Uma origem, automática ou manual |
| `cta_click` | Clique no CTA | `placement`, `action` | Interesse; não conversão final |
| `video_start` | Reprodução iniciada | `video_id` | Uma vez por reprodução |
| `video_progress` | 25%, 50%, 75% efetivamente assistidos | `video_id`, `percent` | Uma vez por marco/reprodução |
| `video_complete` | Reprodução encerrada | `video_id` | Não inferir só por seek |
| `sign_up_start` | Primeira interação com cadastro | `method`, origem | Diagnóstico de abandono |
| `sign_up` | Nova conta habilitada, backend confirma | `method=email/google` | Evento-chave de aquisição |
| `first_study_completed` | Primeiro estudo gerado com sucesso | ID técnico do evento | Ativação; uma vez por conta |
| `view_item_list` | Bloco de pacotes ≥50% visível por 1 s | `item_list_id`, `items` | Uma vez por visualização |
| `select_item` | Seleção de um pacote | SKU em `items` | Intenção de compra |
| `begin_checkout` | Sessão de checkout criada com sucesso | `currency`, `value`, `items` | Não disparar só no clique |
| `purchase` | Backend confirma pagamento aprovado | `transaction_id`, `currency`, `value`, `items` | Evento-chave comercial |
| `refund` | Reembolso confirmado | Transação e valor real | Ajuste de receita no GA4 |
| `faq_open` | Pergunta aberta | `faq_id` de lista fixa | Diagnóstico de objeções |

`placement`: `header`, `hero`, `steps`, `tools`, `free`, `package_1000`, `package_3000`, `package_6000`, `package_10000`, `final`, `mobile_sticky`.

Não implementar eventos de vídeo manuais junto com captura automática equivalente. Não marcar todos os microeventos como conversão.

### 6.3 Contrato de dataLayer

Exemplo de clique; nomes e valores formam o contrato proposto entre frontend e GTM:

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'cta_click',
  page_id: 'lp_vendas',
  page_version: 'v1',
  placement: 'hero',
  action: 'sign_up'
});
```

Exemplo de cadastro, somente após confirmação real de conta nova:

```js
window.dataLayer.push({
  event: 'sign_up',
  method: 'google',
  page_id: 'lp_vendas',
  page_version: 'v1'
});
```

Contrato lógico da compra no servidor; adaptar ao transporte oficial de cada destino. Não é um payload completo de Measurement Protocol:

```json
{
  "event": "purchase",
  "ecommerce": {
    "transaction_id": "order_unique_id",
    "currency": "BRL",
    "value": 39.90,
    "items": [
      {
        "item_id": "credits_6000",
        "item_name": "6000 creditos",
        "price": 39.90,
        "quantity": 1
      }
    ]
  }
}
```

`value` é o valor efetivamente pago em reais, não o número de créditos, sem formatação monetária. Usar ID único da transação interna; confirmar nomes reais dos SKUs. Nunca enviar valor fictício de receita em cadastro grátis.

### 6.4 Tags e destinos

| Origem | Destino | Configuração |
|---|---|---|
| `sign_up` | GA4 | Marcar evento-chave |
| `purchase` | GA4 | Evento-chave com moeda, valor, itens e transação |
| `sign_up` | Google Ads | Ação específica de cadastro; contagem Uma |
| `purchase` | Google Ads | Ação específica de compra; contagem Todas, valor dinâmico e ID da transação |
| Cadastro confirmado | Meta, se elegível | Mapeamento proposto `CompleteRegistration` |
| Checkout criado | Meta, se elegível | Mapeamento proposto `InitiateCheckout` |
| Compra aprovada | Meta, se elegível | Mapeamento proposto `Purchase`, BRL e valor real |

Em Google Ads, escolher uma fonte por ação: importação do GA4 **ou** integração direta. Não contar as duas como primárias. Na campanha de aquisição, otimizar para cadastro confirmado; nas campanhas comerciais, para compra quando houver volume suficiente. Cliques e vídeo ficam como diagnóstico.

GTM precisa de variáveis de dataLayer, gatilhos por nome exato, bloqueios por consentimento e ambiente de homologação separado. IDs públicos via configuração; tokens de API e segredos somente no servidor. IDs não fornecidos são pendências, nunca preencher com valores fictícios em produção.

### 6.5 Atribuição e deduplicação

- Capturar UTMs autorizadas: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`; manter primeira origem e última origem não direta separadas, quando consentido.
- Permitir identificadores de clique necessários ao canal, como `gclid`, `gbraid`, `wbraid` ou `fbclid`, somente conforme consentimento e política aplicável; não encaminhar a todos os destinos indiscriminadamente.
- Armazenamento proposto de atribuição: até 90 dias, sujeito à política de retenção aprovada. Documentar o prazo final e descarte.
- Preservar contexto autorizado no retorno OAuth e vincular a origem à conta após cadastro. Não sobrescrever a origem da campanha pelo redirecionamento do Google ou do provedor de pagamento.
- Se LP e app estiverem em domínios distintos, configurar medição entre domínios próprios e validar continuidade. Não configurar provedores externos como domínios próprios.
- Saneamento de URL: remover e-mail, tokens, parâmetros livres e temas de estudo antes da coleta. Usar IDs neutros de campanha, sem atributos religiosos pessoais.
- Backend valida autenticidade do webhook e registra transição de status de forma idempotente. Criar registro de envio por destino e transação, com fila/retry; webhook repetido não concede créditos nem cria conversão adicional.
- Reter client/session IDs do GA4 apenas quando autorizados, para conectar eventos de servidor à sessão. Sem identificador permitido, manter a compra no relatório operacional; não inventar identificadores para simular atribuição.
- Renovar página, usar botão voltar e receber webhook fora de ordem não podem duplicar cadastro, primeiro estudo ou compra.

### 6.6 Consentimento e minimização

Configuração proposta: modo básico, sem disparo de analytics ou publicidade antes da escolha apropriada do visitante. Categorias separadas para analytics e marketing; essenciais ao login e pagamento permanecem funcionais.

Inicializar e atualizar corretamente os estados do Consent Mode: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`. A escolha precisa ser respeitada também pelos envios do servidor. A API de conversões não é alternativa para contornar uma recusa.

Banner com “Aceitar”, “Recusar opcionais” e “Personalizar”, sem bloquear o cadastro; link persistente para rever preferências. Não reenviar retroativamente eventos anteriores à autorização como padrão.

Como o produto trata estudos religiosos, **não enviar** denominação, igreja, crença, pedidos de oração, prompts, passagens estudadas, respostas geradas ou transcrições a plataformas de publicidade/analytics. Desabilitar captura automática de formulários, matching avançado e gravação de sessões como padrão deste projeto. Não criar públicos com base em crença ou doutrina inferida. Eventos neutros também exigem avaliação da elegibilidade da fonte pela plataforma; neutralizar nomes não autoriza contornar restrições.

Confirmar política de privacidade, retenção, configuração dos destinos e elegibilidade das integrações antes de ativá-las. Consentimento não autoriza conteúdo proibido pelas plataformas.

### 6.7 Painel de resultados

| Indicador | Cálculo |
|---|---|
| Conversão da LP | Cadastros novos atribuídos / visitantes únicos elegíveis da LP |
| Abandono de cadastro | 1 − cadastros concluídos / usuários que iniciaram cadastro |
| Ativação em 7 dias | Contas com primeiro estudo concluído em até 7 dias / novas contas da coorte |
| Compra em 7 e 30 dias | Novas contas com primeira compra na janela / novas contas da coorte |
| Conversão do checkout | Compradores aprovados / usuários que iniciaram checkout |
| Custo por cadastro | Investimento / cadastros atribuídos |
| Custo por novo comprador | Investimento / novos compradores atribuídos |
| ROAS | Receita atribuída de compras / investimento |
| Ticket médio | Receita de compras aprovadas / pedidos aprovados |

Separar primeira compra de recargas seguintes, receita bruta de reembolsos e tráfego consentido de total operacional. Não misturar compras de usuários antigos com receita das novas contas da LP. Documentar janela e modelo de atribuição; relatórios de canais podem divergir e não devem ser somados como usuários exclusivos.

## 7. SEO, anúncios e testes de copy

**Title:** “GNOSIS AI | Estudo bíblico com IA. Comece grátis”  
**Meta description:** “Aprofunde seu estudo bíblico com IA. Crie uma conta grátis, receba 500 créditos iniciais e 50 por dia. Sem cartão e sem mensalidade.”

URL final e canonical dependem da arquitetura existente. Usar um H1, headings hierárquicos, OG com captura real, idioma `pt-BR` e conteúdo principal renderizado no HTML. Homologação com `noindex`. Não usar avaliações ou dados estruturados de reviews fictícios.

### Anúncios — títulos até 40 caracteres

1. “Seu estudo bíblico, mais profundo”
2. “Crie sua conta grátis na GNOSIS AI”
3. “Prepare seu próximo sermão”
4. “Estude a Bíblia com apoio de IA”
5. “Créditos avulsos. Sem mensalidade.”

### Anúncios — descrições até 90 caracteres

1. “Comece com 500 créditos e receba 50 por dia. Crie sua conta sem cartão.”
2. “Exegese, pregação e teologia no mesmo painel. Comece seu estudo grátis.”
3. “Aprofunde passagens e organize pesquisas com ferramentas de IA para estudo bíblico.”
4. “Precisa de mais saldo? Compre créditos avulsos que não vencem. Sem mensalidade.”
5. “Prepare a próxima aula com contexto e clareza. Conheça a GNOSIS AI.”

### Três alternativas de H1

| Variante | Headline | Hipótese |
|---|---|---|
| Pastoral | “Seu estudo bíblico merece a profundidade que sua mensagem exige.” | Responsabilidade com o preparo aumenta identificação |
| Prática | “Estudo bíblico profundo para seu próximo sermão ou trabalho de seminário.” | Tarefa explícita aumenta cadastros qualificados |
| Entrada gratuita | “Aprofunde seu estudo bíblico. Crie sua conta grátis hoje.” | Oferta direta reduz hesitação |

Testar uma mudança por vez, mantendo atribuição consistente e experiência acessível. Métrica principal: cadastro confirmado por visitante; guardrails: ativação e primeira compra. Não declarar vencedor apenas por CTR. Definir duração e amostra a partir do tráfego real, sem inventar metas de conversão.

## 8. Orientações de implementação e desempenho

Usar a stack do projeto existente; não migrar aplicação para construir uma LP. Em projetos React/Next, preferir renderização de conteúdo no servidor e hidratar somente interações necessárias. Composição sugerida:

```text
LandingPage
  Header
  Hero + PresentationVideo
  PainSection
  HowItWorks
  AudienceSection
  ToolShowcase
  BrazilSection
  TrustSection
  FreeCreditsSection
  CreditPackages
  FAQ
  FinalCTA
  Footer
  MobileCTA
  ConsentPreferences
```

Manter copy em arquivo estruturado, preço na fonte comercial compartilhada e analytics num adaptador próprio. Cada CTA recebe `placement` explícito; não detectar conversão por texto ou seletor CSS frágil.

**Metas de aceite propostas:** LCP ≤2,5 s, INP ≤200 ms e CLS ≤0,1 no percentil 75 de usuários reais quando houver dados suficientes. Antes disso, usar teste de laboratório como diagnóstico, sem apresentar Lighthouse como garantia de campo.

Reservar dimensões de mídia, otimizar pôster e imagens, fazer lazy-load abaixo da dobra, carregar vídeo apenas por intenção e evitar scripts duplicados. Falha de analytics não pode bloquear navegação, cadastro ou checkout. Respeitar consentimento ao carregar players externos; preferir mídia hospedada sem rastreadores de terceiros.

## 9. Critérios de aceite e QA

### Conteúdo e experiência

- [ ] Hero mostra estudo bíblico, gratuidade, CTA e apresentação em vídeo.
- [ ] Vídeo real disponível, legendado e com pôster; material faltante não é substituído por simulação enganosa.
- [ ] Todos os CTAs têm destinos e posições identificáveis.
- [ ] Oferta reproduz exatamente os créditos e os quatro preços do briefing confirmado.
- [ ] 6.000 créditos com selo “Melhor valor”; nenhuma indicação falsa de popularidade.
- [ ] Nenhuma referência a assinatura, teste com cartão, acesso ilimitado ou plano superior.
- [ ] Não há depoimentos, resultados, descontos ou garantias inventados.
- [ ] Layout validado em 360, 390, 768, 1.024 e 1.440 px; sem rolagem horizontal.
- [ ] Navegação por teclado, foco, contraste, leitores de tela e zoom revisados.
- [ ] Barra mobile, consentimento e vídeo não se sobrepõem.

### Jornada funcional

- [ ] Cadastro por e-mail e Google funciona; login existente não conta como novo cadastro.
- [ ] Verificação de e-mail, se exigida, preserva retorno seguro.
- [ ] Usuário anônimo não é enviado diretamente a cobrança.
- [ ] Pacote de interesse é preservado sem obrigar a compra.
- [ ] Sessão expirada retorna ao fluxo correto.
- [ ] PIX pendente não concede créditos nem contabiliza compra.
- [ ] Pagamento aprovado disponibiliza crédito uma vez, mesmo com repetição de webhook.
- [ ] Falha ou cancelamento não gera `purchase`; reembolso confirmado ajusta relatório.

### Mensuração

- [ ] GTM Preview e GA4 DebugView mostram eventos previstos sem duplicação.
- [ ] Nenhum evento de conversão dispara apenas por clique no CTA.
- [ ] Nova conta gera uma conversão; retorno OAuth e reload não repetem.
- [ ] Compra tem BRL, valor real, SKU e transação única.
- [ ] Google Ads possui uma fonte primária por ação, sem dupla contagem.
- [ ] Meta, se habilitada, validada na conta e em Test Events; deduplicação conferida quando houver dois canais de envio.
- [ ] Aceitar, recusar e revogar preferências alteram navegador e servidor corretamente.
- [ ] Inspeção de rede confirma ausência de e-mail, tokens, conteúdo de estudo e dados religiosos pessoais nos destinos de medição.
- [ ] Atribuição sobrevive ao cadastro e ao pagamento quando autorizada.
- [ ] Compra ainda aparece no relatório operacional mesmo quando tags são bloqueadas.
- [ ] Homologação não polui dados de produção; segredos não estão no bundle público.

## 10. Entregáveis, prioridades e pendências

**P0 — construção:** seções e copy completas, hero com vídeo real, responsividade, integração ao cadastro/painel, pacotes e política de consentimento.

**P0 — mensuração:** instrumentação no cadastro e backend de pagamento, eventos GA4, atribuição consentida e validação de não duplicação. Não anunciar monitoramento completo se apenas os cliques da LP estiverem implementados.

**P1 — otimização:** ativação, relatório por coorte, campanhas Google/Meta conforme disponibilidade e primeiro experimento de headline.

| Responsável | Fornecer / confirmar |
|---|---|
| Produto | Oferta vigente, reset diário e fuso exibido no app, nomes de ferramentas, SKUs e fluxo após cadastro |
| Design/conteúdo | Logo, gravação do vídeo, legendas, pôster e capturas reais revisadas |
| Desenvolvimento | Stack, rotas reais, autenticação, catálogo de preços, integração dos webhooks |
| Marketing | GTM, GA4, IDs de conversão Google Ads e eventual Meta; convenção de UTMs |
| Responsável por privacidade | Política, retenção, categorias de consentimento e elegibilidade dos destinos |
| QA | Evidências das jornadas, dos eventos e dos estados de erro |

Não é necessário interromper o desenvolvimento por IDs ainda não fornecidos: implementar adaptadores desativados por configuração. Para publicar com medição ativa, preencher e validar as configurações reais. Documento final de handoff deve listar quais integrações estão ativas e quais continuam pendentes.

## 11. Referências técnicas

Oferta, catálogo e marca: briefing fornecido em 08/10/2026. Não foi feita auditoria do código ou validação do ambiente atual da GNOSIS AI. Layout, arquitetura de eventos e fluxos complementares são propostas de implementação.

Documentação consultada em 08/10/2026:

- Google — eventos recomendados, inclusive `sign_up` e `purchase`: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Google — mensuração de comércio eletrônico: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- Google — configuração de consentimento: https://developers.google.com/tag-platform/security/guides/consent
- Meta — referência arquivada da API, que documenta o uso conjunto de `event_name` e `event_id`: https://github.com/facebookarchive/Facebook-Server-Side-API-Swagger/blob/main/server-side-api.yaml . Usar como fundamento conceitual; conferir a versão ativa da API e os requisitos da conta antes da implementação.

As referências sustentam os contratos técnicos básicos; não significam aprovação automática de campanhas, elegibilidade de eventos ou conformidade integral do projeto.
