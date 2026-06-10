# Gnosis AI - Planos e Créditos (Mobile App)

Este documento descreve as regras de negócio, os planos de assinatura disponíveis e os pacotes de créditos avulsos que devem ser implementados na interface de compra (In-App Purchases) do aplicativo móvel.

---

## 1. Regras do Sistema de Créditos

O ecossistema Gnosis AI utiliza três tipos de créditos para o consumo das ferramentas (estudos, traduções, etc). É fundamental que o app exiba o saldo total, mas internamente entenda a **Ordem de Consumo**.

*   **Créditos Diários:** Renovados todos os dias automaticamente. São os primeiros a serem consumidos. (Não acumulam para o dia seguinte).
*   **Créditos Iniciais (Mensais/Anuais):** Fornecidos no momento da assinatura (e a cada renovação). São cumulativos dentro de um limite de 30 dias de validade. São consumidos apenas quando os créditos diários acabam.
*   **Créditos Avulsos:** Comprados separadamente através de recargas. Eles **nunca expiram** e são cumulativos para sempre. São os últimos a serem consumidos.

> **Ordem de Consumo:** Diários -> Iniciais -> Avulsos.

---

## 2. Planos de Assinatura

Estes são os planos que o usuário pode assinar. As integrações devem prever a assinatura via Google Play Billing (Android) e Apple In-App Purchases (iOS). 
*(Nota: Valores anuais representam o valor total cobrado com ~16.6% de desconto em relação ao mensal).*

### Plano FREE (Gratuito)
O plano básico fornecido automaticamente quando o usuário se cadastra.
*   **Valor:** R$ 0,00
*   **Créditos Iniciais:** 500
*   **Créditos Diários:** 50 / dia
*   **Ferramentas:** 6 ferramentas básicas habilitadas.
    *(Ex: Hermenêutica, Traduções, Resumos, Esboços, Estudos Doutrinários, Análise Teológica).*

### Plano ALIANÇA
O plano intermediário ideal para estudantes.
*   **Mensal:** R$ 19,90/mês
*   **Anual:** R$ 199,80/ano
*   **Créditos Iniciais:** 1.500 / mês
*   **Créditos Diários:** 150 / dia
*   **Ferramentas:** 10 ferramentas habilitadas.

### Plano LUMEN
O plano avançado para pesquisadores profundos.
*   **Mensal:** R$ 36,90/mês
*   **Anual:** R$ 369,80/ano
*   **Créditos Iniciais:** 3.000 / mês
*   **Créditos Diários:** 300 / dia
*   **Ferramentas:** 18 ferramentas (Acesso Total).

### Plano GNOSIS PREMIUM
O plano definitivo com abundância de créditos e recursos ilimitados.
*   **Mensal:** R$ 68,90/mês
*   **Anual:** R$ 689,80/ano
*   **Créditos Iniciais:** 8.000 / mês
*   **Créditos Diários:** 400 / dia
*   **Ferramentas:** 18 ferramentas (Acesso Total).

---

## 3. Créditos Avulsos (Recargas)

Além dos planos, o usuário pode "recarregar" seu saldo a qualquer momento sem mudar de plano. Estes pacotes devem ser oferecidos como compras únicas (One-time purchases / Consumables) nas lojas de aplicativo.

*   **1.000 Créditos:** R$ 9,90
*   **3.000 Créditos:** R$ 24,90
*   **6.000 Créditos:** R$ 39,90
*   **10.000 Créditos:** R$ 69,90

### Dicas de Implementação UI
- As ofertas de **Créditos Avulsos** devem ser exibidas tanto na tela de "Assinaturas" quanto através de um botão rápido na barra superior do App perto de onde o "Saldo Atual" for exibido.
- Se a chamada da API `POST /tools/generate` retornar um erro indicando "Saldo Insuficiente", o aplicativo deve abrir imediatamente o modal de recarga de Créditos Avulsos (Bottom Sheet nativo).
