# Diretriz de desenvolvimento — Free para todos + créditos avulsos

**Status:** aprovado para implementação (webapp)  
**Data:** 7 de outubro de 2026  
**Escopo:** webapp GNOSIS AI (API mobile deve seguir as mesmas regras)  
**Fora deste documento:** implementação. Este arquivo é a regra do produto.

---

## 1. Decisão de produto

A GNOSIS AI **deixa de vender planos de assinatura** na interface do aluno.

Modelo novo:

| Antes | Agora |
|---|---|
| Cadastro escolhe plano e vai para checkout (Stripe/MP) | Cadastro cria conta **Free** e entra no painel |
| Ferramentas travadas por plano | **Todas as ferramentas liberadas** para todo usuário logado |
| Sem pagamento de plano = `PLAN_REQUIRED` | Sem plano = trata como **Free** |
| Upgrade de plano no header / modal | **Compra de créditos avulsos** no lugar |

O que o aluno paga: **só créditos avulsos**, quando o saldo não dá para gerar o estudo.

Ferramenta liberada **não** significa geração ilimitada. Cada uso continua consumindo créditos.

---

## 2. Regras de negócio (obrigatórias)

### 2.1 Plano Free

- Toda conta nova nasce no plano **Free** (`name = "free"`), preço **R$ 0,00**.
- Conta sem assinatura, assinatura expirada ou plano Basic legado **sem pagamento** = Free.
- Não redirecionar cadastro para checkout de plano.
- Não exigir cartão para criar conta nem para usar ferramentas.

Créditos do Free (valores atuais do produto; alterar só com decisão explícita):

| Tipo | Quantidade | Regra |
|---|---|---|
| Iniciais | 500 | Uma vez, no cadastro. **Não renovam.** |
| Diários | 50 | Reset todo dia. **Não acumulam.** |
| Avulsos (bônus) | 0 no cadastro | Comprados. **Não expiram.** |

Ordem de consumo **não muda:** diários → iniciais → avulsos.

Admin / super_admin: créditos ilimitados, como hoje.

### 2.2 Ferramentas

- Qualquer usuário autenticado com plano Free (ou qualquer outro) vê e abre **todo o catálogo**.
- Remover cadeado, “plano superior” e modal “precisa assinar”.
- Backend: `assertCanUseTools` / `PLAN_REQUIRED` **não** pode mais bloquear aluno Free. Bloqueio passa a ser só **saldo insuficiente**.
- Admin continua podendo desativar ferramenta no catálogo (`isActive = false`). Isso vale para todos.

### 2.3 Planos pagos (Aliança, Lumen, Premium, Basic pago)

**Desativar a opção comercial. Não apagar o banco.**

- Esconder escolha de plano no cadastro, `/planos`, Home, FAQ, Rebeca, Dashboard, Perfil, `NoCreditsModal`, `BuyCreditsModal`, `PlanRequiredModal`.
- Não criar checkout `type: 'plan'` a partir da UI do aluno.
- Endpoints de checkout de plano: recusar nova venda (erro claro) ou deixar só para admin, se ainda for necessário internamente.
- Assinaturas **já pagas** existentes: **não cancelar automaticamente**. Elas param de ser vendidas. Acesso a ferramentas já é total para todo mundo; créditos da assinatura antiga podem continuar creditando até expirar, salvo decisão contrária do cliente.
- Cupom que “concede plano pago”: na UI do aluno, não oferecer upgrade. Se o cupom ainda existir no admin, documentar comportamento (recomendado: cupom passa a dar **créditos bônus**, não plano). Tratar na implementação.

### 2.4 Créditos avulsos (monetização principal)

Pacotes atuais (manter até o comercial mudar):

| Pacote | Preço |
|---|---|
| 1.000 créditos | R$ 9,90 |
| 3.000 créditos | R$ 24,90 |
| 6.000 créditos | R$ 39,90 |
| 10.000 créditos | R$ 69,90 |

Checkout: Mercado Pago e/ou Stripe, **compra única** (PIX/cartão), como já existe para `type: 'credits'`.

Quando o saldo for insuficiente: abrir **só** a compra de créditos. Nunca mais lista de planos.

---

## 3. UX — onde o crédito avulso precisa aparecer

Objetivo: o aluno sempre sabe o saldo e sempre vê um caminho curto para recarregar.

### 3.1 Obrigatório (destaque)

1. **Header do Dashboard** — botão atual “Upgrade de Plano” vira **Comprar créditos** (ouro, visível no desktop; equivalente no menu mobile).
2. **Painel de créditos** — CTA único: comprar avulsos. Remover “Upgrade de plano”.
3. **Página da ferramenta e chat do estudo** — se faltar crédito, modal de pacotes (não de planos).
4. **Perfil** — seção de recarga em evidência; portal Stripe de assinatura some da jornada do aluno Free.
5. **Cadastro** — depois de criar a conta, ir para `/dashboard` (não checkout). Opcional: banner “Seus 50 créditos do dia + 500 iniciais”.

### 3.2 Remover da jornada do aluno

- Seletor de plano no `/auth` (mensal/anual, cards Aliança/Lumen/Premium).
- `PlanRequiredModal` e `BasicMigrationModal` para o aluno.
- Toggle mensal/anual de assinatura.
- Copy “assine para desbloquear”.
- FAQ / Rebeca falando em FREE limitado a 6 ferramentas ou em quatro planos pagos.

### 3.3 Página `/planos`

Não vender assinatura. Opções aceitas (escolher uma na implementação):

- **A (preferida):** transformar em **Créditos avulsos** (título, pacotes, CTA de compra).
- **B:** redirecionar `/planos` → `/dashboard` ou âncora de recarga.

Links de menu “Planos e Preços” passam a “Créditos” ou “Comprar créditos”.

---

## 4. Backend — o que mudar

Arquivos-chave (não é lista exaustiva):

| Área | Arquivo | Mudança |
|---|---|---|
| Acesso | `server/planAccess.ts` | Free pode usar ferramentas. `canUseTools = true` se autenticado (exceto conta bloqueada/admin policy). Motivo `payment_required` some para aluno. |
| Cadastro | `api/register.ts` | Sempre: user + subscription Free + créditos 500+50. `requiresCheckout: false`. |
| Plano default | `server/planHelpers.ts` | Resolver plano **`free`** (não Basic pago). Se só existir `basic` no banco, tratar `basic` como Free **somente se** `priceMonthly === 0`; senão criar/usar registro `free`. |
| Geração | `server/routers.ts` (`tools.generate`, `studies.save`) | Manter débito de créditos. Remover bloqueio `PLAN_REQUIRED`. |
| Checkout | `payments.createCheckoutSession` | UI só dispara `type: 'credits'`. |
| Migração | `server/basicMigration.ts` + modal | Desligar para o aluno. |
| Ferramentas do plano | `plans.getTools` / Dashboard | Deixar de filtrar por `plan_tools`. Listar todas as `tools` ativas. |

Seed / banco:

- Garantir plano `free`: `priceMonthly = 0`, `creditsInitial = 500`, `creditsDaily = 50`, `toolsCount` = total de ferramentas ativas.
- Vincular **todas** as ferramentas ativas a esse plano **ou** ignorar `plan_tools` no acesso (preferir ignorar no acesso para não depender de seed).

Usuários antigos:

- Job ou lógica no login: se não houver subscription ativa, criar Free + créditos se ainda não tiverem registro de créditos.
- Não zerar créditos avulsos já comprados.
- Não apagar histórico de pagamentos de plano.

---

## 5. Copy (alinhar tudo)

Mensagem única para FAQ, Rebeca, onboarding e textos de crédito:

> Conta Free: todas as ferramentas. 500 créditos no cadastro + 50 por dia. Acabou o saldo? Compre créditos avulsos. Os avulsos não vencem.

Proibido nas telas do aluno:

- “6 de 18 ferramentas”
- “Upgrade de plano”
- “Assinar Aliança / Lumen / Premium”
- “Plano Basic R$ 4,97”
- “Trial de 20 dias com cartão”

Admin pode continuar mostrando nomes de planos antigos em relatórios históricos.

---

## 6. O que não fazer

- Não remover tabelas `plans` / `subscriptions` / `plan_tools` nesta etapa.
- Não desligar Stripe/MP: ainda servem para **créditos**.
- Não tornar a geração grátis e ilimitada.
- Não esconder o saldo de créditos.
- Não cancelar assinaturas Stripe/MP em massa sem pedido explícito do cliente.
- Não quebrar o admin (catálogo, usuários, financeiro, cupons). Ajuste só o que for venda de plano na UI do aluno.

---

## 7. Ordem de implementação sugerida

1. **Regra de acesso** — Free usa todas as ferramentas; sem `PLAN_REQUIRED`.
2. **Cadastro** — sempre Free + créditos; dashboard direto.
3. **Dashboard / ferramenta** — sem cadeado; CTA de créditos no header.
4. **Modais** — só pacotes avulsos quando faltar saldo.
5. **Auth, `/planos`, Perfil** — tirar venda de assinatura.
6. **FAQ + Rebeca** — copy nova.
7. **Usuários sem plano** — backfill Free.
8. **API mobile** — mesmas regras (documento `docs/api/APP_PLANS_AND_CREDITS.md` deve ser atualizado depois).

Cada passo deve poder ir para produção sozinho, sem deixar o aluno num estado “precisa pagar plano” e “plano não existe mais”.

---

## 8. Critérios de aceite

- [ ] Conta nova: Free, 500 + 50 créditos, entra no dashboard sem checkout.
- [ ] Dashboard: todas as ferramentas ativas clicáveis, sem cadeado.
- [ ] Geração funciona no Free até acabar o saldo.
- [ ] Saldo zerado: modal/tela de **créditos avulsos** (4 pacotes), não de planos.
- [ ] Header: botão de comprar créditos visível.
- [ ] `/auth` sem seletor de plano.
- [ ] `/planos` não vende assinatura.
- [ ] FAQ e Rebeca não mencionam planos pagos nem limite de ferramentas.
- [ ] Compra de créditos avulsos (sandbox) credita `creditsBonus` e não expira.
- [ ] Créditos diários renovam no dia seguinte (50), sem acumular o que sobrou do dia.
- [ ] Admin ainda acessa o painel. Aluno comum não vê upgrade de plano.
- [ ] Assinante antigo não perde créditos avulsos nem estudos.

---

## 9. Decisões em aberto (não bloquear o restante)

Registrar aqui se o cliente decidir depois:

1. **Assinantes pagos atuais:** manter crédito diário/inicial do plano antigo até o fim do ciclo, ou converter todos para Free 50/dia imediatamente?
2. **Cupom que dava plano:** vira pacote de créditos? Quantos?
3. **Afiliado:** comissão só em recarga de créditos daqui pra frente?
4. **`/planos`:** vira página de recarga (A) ou redirect (B)?

Default desta diretriz se ninguém responder: (1) converter o **acesso** para todas as ferramentas já; créditos do plano pago seguem até expirar a subscription; (2) cupom de plano não é oferecido no cadastro; (3) afiliado continua no código, nova venda de plano na UI = zero; (4) opção A.

---

## 10. Resumo em uma frase

**Todo mundo é Free, todo mundo usa todas as ferramentas, o que acaba é crédito — e o produto empurra a recarga avulsa, não a assinatura.**
